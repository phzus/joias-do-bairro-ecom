import { AbstractPaymentProvider, BigNumber } from "@medusajs/framework/utils"
import type {
  InitiatePaymentInput,
  InitiatePaymentOutput,
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  ProviderWebhookPayload,
  WebhookActionResult,
} from "@medusajs/framework/types"
import MercadoPagoConfig, { Payment } from "mercadopago"
import crypto from "crypto"

type Options = {
  accessToken: string
  publicKey: string
  webhookSecret?: string
}

class MercadoPagoPaymentProvider extends AbstractPaymentProvider<Options> {
  static identifier = "mercadopago"

  protected mpClient: MercadoPagoConfig
  protected paymentClient: Payment

  constructor(container: Record<string, unknown>, options: Options) {
    super(container, options)
    this.mpClient = new MercadoPagoConfig({
      accessToken: options.accessToken,
    })
    this.paymentClient = new Payment(this.mpClient)
  }

  static validateOptions(options: Record<string, any>) {
    if (!options.accessToken) {
      throw new Error("MP_ACCESS_TOKEN is required in MercadoPago provider options.")
    }
    if (!options.publicKey) {
      throw new Error("MP_PUBLIC_KEY is required in MercadoPago provider options.")
    }
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const sessionId = crypto.randomUUID()
    return {
      id: sessionId,
      data: {
        public_key: this.config.publicKey,
        mp_session_id: sessionId,
        status: "pending",
      },
    }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const data = input.data ?? {}
    const mpStatus = data.mp_status as string | undefined

    // Card approved
    if (mpStatus === "approved") {
      return { status: "authorized", data }
    }

    // Pix/Boleto — waiting for async payment
    if (mpStatus === "pending" || mpStatus === "in_process") {
      return { status: "pending", data }
    }

    // Rejected
    if (mpStatus === "rejected" || mpStatus === "cancelled") {
      return { status: "error", data }
    }

    // Not yet processed (user hasn't submitted payment form)
    return { status: "pending", data }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    // MP Checkout Transparente auto-captures on order creation — nothing to do here
    return { data: input.data }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    const paymentId = input.data?.mp_payment_id as string | undefined
    if (!paymentId) return { data: input.data }

    try {
      await this.paymentClient.cancel({ id: Number(paymentId) })
    } catch {
      // Payment may already be in a terminal state; not critical to throw
    }
    return { data: { ...input.data, mp_status: "cancelled" } }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return this.cancelPayment(input)
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const paymentId = input.data?.mp_payment_id as string | undefined
    if (!paymentId) return { data: input.data }

    const payment = await this.paymentClient.get({ id: Number(paymentId) })
    return { data: { ...input.data, mp_payment: payment } }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    // Amount updates happen before payment is created in MP — just update local data
    return { data: { ...input.data, amount: input.amount } }
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const mpStatus = input.data?.mp_status as string | undefined
    const paymentId = input.data?.mp_payment_id as string | undefined

    if (paymentId) {
      try {
        const payment = await this.paymentClient.get({ id: Number(paymentId) })
        return { status: this.mapMpStatusToMedusa(payment.status, payment.status_detail) }
      } catch {
        // fall through to local status
      }
    }

    return { status: this.mapMpStatusToMedusa(mpStatus) }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const paymentId = input.data?.mp_payment_id as string | undefined
    if (!paymentId) throw new Error("Cannot refund: mp_payment_id not found in payment data.")

    await this.paymentClient.refundById({
      id: Number(paymentId),
      payload: { amount: Number(input.amount) },
    } as any)

    return { data: { ...input.data, refunded_amount: input.amount } }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const { data, headers } = payload

    // Validate signature
    if (this.config.webhookSecret) {
      const signature = headers["x-signature"] as string | undefined
      const requestId = headers["x-request-id"] as string | undefined
      const dataId = (data as any)?.data?.id as string | undefined

      if (!this.validateWebhookSignature(signature, requestId, dataId)) {
        return {
          action: "not_supported",
          data: { session_id: "", amount: new BigNumber(0) },
        }
      }
    }

    const paymentId = (data as any)?.data?.id as string | undefined
    if (!paymentId) {
      return {
        action: "not_supported",
        data: { session_id: "", amount: new BigNumber(0) },
      }
    }

    try {
      const payment = await this.paymentClient.get({ id: Number(paymentId) })
      const sessionId = payment.external_reference ?? ""
      const amount = new BigNumber(Number(payment.transaction_amount ?? 0))

      const mpStatus = payment.status
      const mpDetail = payment.status_detail

      // Card/Pix/Boleto approved
      if (mpStatus === "approved" && mpDetail === "accredited") {
        return { action: "captured", data: { session_id: sessionId, amount } }
      }

      // Rejected/failed/cancelled
      if (mpStatus === "rejected" || mpStatus === "cancelled" || mpStatus === "refunded") {
        return { action: "failed", data: { session_id: sessionId, amount } }
      }

      return { action: "not_supported", data: { session_id: sessionId, amount } }
    } catch {
      return {
        action: "failed",
        data: { session_id: "", amount: new BigNumber(0) },
      }
    }
  }

  private mapMpStatusToMedusa(
    status?: string,
    detail?: string
  ): "authorized" | "captured" | "pending" | "requires_more" | "error" | "canceled" {
    switch (status) {
      case "approved":
        return detail === "accredited" ? "authorized" : "captured"
      case "authorized":
        return "authorized"
      case "in_process":
      case "pending":
        return "pending"
      case "rejected":
        return "error"
      case "cancelled":
        return "canceled"
      case "refunded":
        return "canceled"
      default:
        return "pending"
    }
  }

  private validateWebhookSignature(
    xSignature: string | undefined,
    xRequestId: string | undefined,
    dataId: string | undefined
  ): boolean {
    if (!xSignature || !this.config.webhookSecret) return false

    const parts: Record<string, string> = {}
    xSignature.split(",").forEach((part) => {
      const [k, v] = part.trim().split("=")
      if (k && v) parts[k] = v
    })

    const ts = parts["ts"]
    const v1 = parts["v1"]
    if (!ts || !v1) return false

    const manifest = `id:${dataId ?? ""};request-id:${xRequestId ?? ""};ts:${ts};`
    const expected = crypto
      .createHmac("sha256", this.config.webhookSecret)
      .update(manifest)
      .digest("hex")

    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1))
  }
}

export default MercadoPagoPaymentProvider
