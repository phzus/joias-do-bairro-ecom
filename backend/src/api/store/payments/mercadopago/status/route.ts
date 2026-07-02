import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import MercadoPagoConfig, { Payment } from "mercadopago"

// Polled by the storefront after a 3DS challenge and during Pix/Boleto waiting screens.
// When session_id + cart_id are provided, persists the queried status onto the Medusa
// payment session so authorizePaymentSession sees the up-to-date mp_status.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const paymentId = req.query.payment_id as string | undefined
  const sessionId = req.query.session_id as string | undefined
  const cartId = req.query.cart_id as string | undefined

  if (!paymentId) {
    return res.status(400).json({ message: "payment_id é obrigatório." })
  }

  const accessToken = process.env.MP_ACCESS_TOKEN
  if (!accessToken) {
    return res.status(500).json({ message: "Gateway de pagamento não configurado." })
  }

  const mpClient = new MercadoPagoConfig({ accessToken })
  const paymentClient = new Payment(mpClient)

  let payment: any
  try {
    payment = await paymentClient.get({ id: Number(paymentId) })
  } catch (err: any) {
    return res.status(422).json({ message: err?.message ?? "Erro ao consultar pagamento." })
  }

  if (sessionId && cartId) {
    try {
      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
      const { data: carts } = await query.graph({
        entity: "cart",
        filters: { id: cartId },
        fields: ["id", "total", "currency_code"],
      })
      const cart = carts?.[0]

      if (cart) {
        const paymentService = req.scope.resolve(Modules.PAYMENT)
        await paymentService.updatePaymentSession({
          id: sessionId,
          data: {
            public_key: process.env.MP_PUBLIC_KEY,
            mp_payment_id: String(payment.id),
            mp_status: payment.status,
            mp_status_detail: payment.status_detail,
          },
          currency_code: cart.currency_code as string,
          amount: cart.total as unknown as number,
        })
      }
    } catch (err) {
      // Não falha a consulta de status por causa disso — o storefront ainda pode
      // completar o carrinho no próximo /process, e o webhook nativo cobre o resto.
      console.error("[MP] Failed to sync payment session status:", err)
    }
  }

  return res.json({
    mp_payment_id: payment.id,
    status: payment.status,
    status_detail: payment.status_detail,
  })
}
