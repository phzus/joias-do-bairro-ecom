import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import MercadoPagoConfig, { Payment } from "mercadopago"
import crypto from "crypto"

type ProcessPaymentBody = {
  cart_id: string
  session_id: string
  method: "card" | "pix" | "boleto"
  // Card-specific
  token?: string
  payment_method_id?: string
  installments?: number
  issuer_id?: string
  // Payer data (required for boleto, optional for card)
  payer?: {
    email: string
    first_name?: string
    last_name?: string
    identification?: { type: string; number: string }
    address?: {
      zip_code?: string
      street_name?: string
      street_number?: string
      neighborhood?: string
      city?: string
      federal_unit?: string
    }
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as ProcessPaymentBody

  if (!body.cart_id || !body.session_id || !body.method) {
    return res.status(400).json({ message: "cart_id, session_id e method são obrigatórios." })
  }

  const accessToken = process.env.MP_ACCESS_TOKEN
  if (!accessToken) {
    return res.status(500).json({ message: "Gateway de pagamento não configurado." })
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: carts } = await query.graph({
    entity: "cart",
    filters: { id: body.cart_id },
    fields: ["id", "total", "currency_code", "email", "shipping_address.*", "billing_address.*"],
  })

  const cart = carts?.[0]
  if (!cart) {
    return res.status(404).json({ message: "Carrinho não encontrado." })
  }

  const transactionAmount = Number(cart.total)

  const mpClient = new MercadoPagoConfig({ accessToken })
  const paymentClient = new Payment(mpClient)

  const idempotencyKey = crypto.randomUUID()

  let paymentBody: any = {
    transaction_amount: transactionAmount,
    description: "Joias do Bairro",
    external_reference: body.session_id,
    payer: body.payer
      ? {
          email: body.payer.email,
          first_name: body.payer.first_name,
          last_name: body.payer.last_name,
          identification: body.payer.identification,
          address: body.payer.address,
        }
      : { email: cart.email as string },
  }

  if (body.method === "card") {
    if (!body.token || !body.payment_method_id) {
      return res.status(400).json({ message: "token e payment_method_id são obrigatórios para cartão." })
    }
    paymentBody = {
      ...paymentBody,
      payment_method_id: body.payment_method_id,
      token: body.token,
      installments: body.installments ?? 1,
      ...(body.issuer_id ? { issuer_id: body.issuer_id } : {}),
    }
  } else if (body.method === "pix") {
    paymentBody = {
      ...paymentBody,
      payment_method_id: "pix",
    }
  } else if (body.method === "boleto") {
    paymentBody = {
      ...paymentBody,
      payment_method_id: "bolbradesco",
      payment_type_id: "ticket",
    }
  }

  let mpPayment: any
  try {
    mpPayment = await paymentClient.create({
      body: paymentBody,
      requestOptions: { idempotencyKey },
    })
  } catch (err: any) {
    const detail =
      err?.cause?.[0]?.description ??
      err?.cause?.message ??
      err?.message ??
      "Erro ao processar pagamento."
    return res.status(422).json({ message: detail })
  }

  try {
    const paymentService = req.scope.resolve(Modules.PAYMENT)
    await paymentService.updatePaymentSession({
      id: body.session_id,
      data: {
        public_key: process.env.MP_PUBLIC_KEY,
        mp_payment_id: String(mpPayment.id),
        mp_status: mpPayment.status,
        mp_status_detail: mpPayment.status_detail,
      },
      currency_code: cart.currency_code as string,
      amount: cart.total as unknown as number,
    })
  } catch (err) {
    console.error("[MP] Failed to update payment session:", err)
    return res.status(500).json({
      message: "Pagamento processado na MP, mas falhou ao sincronizar com o pedido. Contate o suporte.",
    })
  }

  const response: Record<string, any> = {
    mp_payment_id: mpPayment.id,
    status: mpPayment.status,
    status_detail: mpPayment.status_detail,
  }

  // Pix
  const txData = mpPayment.point_of_interaction?.transaction_data
  if (txData?.qr_code) response.qr_code = txData.qr_code
  if (txData?.qr_code_base64) response.qr_code_base64 = txData.qr_code_base64
  if (txData?.ticket_url) response.ticket_url = txData.ticket_url

  // Boleto
  if (mpPayment.barcode?.content) response.digitable_line = mpPayment.barcode.content
  if (mpPayment.transaction_details?.external_resource_url)
    response.ticket_url = mpPayment.transaction_details.external_resource_url

  // 3DS
  if (mpPayment.three_ds_info?.external_resource_url)
    response.challenge_url = mpPayment.three_ds_info.external_resource_url

  return res.json(response)
}
