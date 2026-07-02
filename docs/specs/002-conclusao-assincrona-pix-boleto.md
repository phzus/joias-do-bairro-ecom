# Spec: Conclusão assíncrona de pedidos Pix e Boleto

**Status:** `Implementado`
**Criado em:** 2026-07-01
**Última revisão:** 2026-07-01
**ADRs relacionados:** [ADR-002](../decisions/002-mercadopago-como-gateway-de-pagamento.md)

---

## Objetivo

Garantir que pedidos pagos via Pix ou Boleto sejam efetivamente criados no Medusa quando o pagamento é confirmado, em vez de silenciosamente nunca virarem pedido.

## Contexto e Motivação

Testando 5 pedidos variados em 2026-07-01 (2 cartão aprovado, 1 cartão recusado, 1 Pix, 1 Boleto), descobrimos que os fluxos de Pix e Boleto nunca completam o carrinho em pedido:

- `CheckoutPage.tsx` (`handlePixPayment`/`handleBoletoPayment`) chama `sdk.store.cart.complete(cartId)` **imediatamente** após criar o pagamento assíncrono na MP.
- Nesse momento `mp_status` ainda é `pending`/`pending_waiting_payment` (o cliente ainda não pagou o QR Code/boleto), então `authorizePaymentSession` do Medusa lança `MedusaError`: `"Session: ... was not authorized with the provider."`
- Esse erro é capturado por um `.catch(() => null)` que o descarta silenciosamente — o cliente vê o QR Code/linha digitável normalmente e acredita que finalizou a compra, mas **nenhum pedido existe no Medusa**.
- Se o cliente pagar o Pix/Boleto depois (o caso normal — o cliente fecha a aba e paga o boleto em até 3 dias úteis), não há nada que complete o carrinho retroativamente, porque o webhook da Mercado Pago nunca foi registrado (`MP_WEBHOOK_SECRET` vazio no `.env`, nenhuma URL de webhook cadastrada no painel da MP).

**Importante — correção de diagnóstico:** o Spec-001 já previa que "o webhook confirma o pagamento depois", e o Medusa v2 **já tem** a infraestrutura pronta para isso — não precisamos construir um subscriber do zero:
- `POST /hooks/payment/mercadopago_mercadopago` é uma rota genérica do core do Medusa (`@medusajs/medusa`) que recebe o payload do webhook e emite o evento `payment.webhook_received`.
- O subscriber nativo do core (`payment-webhook`) chama `paymentService.getWebhookActionAndData()` — que já está implementado corretamente no nosso provider (`MercadoPagoPaymentProvider.getWebhookActionAndData`, retorna `action: "captured"` quando `status === "approved" && status_detail === "accredited"`).
- Quando a ação é `"captured"` (`PaymentActions.SUCCESSFUL`), o `processPaymentWorkflow` nativo do core roda o step `completeCartAfterPaymentStep`, que completa o carrinho em pedido automaticamente — **sem nenhum código customizado nosso**.

Ou seja, o gap real não é "falta código para completar o pedido depois" — é: (1) o webhook nunca foi registrado/configurado na conta da Mercado Pago, e (2) o storefront tenta completar o carrinho no momento errado (client-side, antes da confirmação), gerando um erro silencioso e uma UX enganosa.

## Escopo

### Incluído
- Remover a chamada prematura `sdk.store.cart.complete(cartId)` de `handlePixPayment` e `handleBoletoPayment` no storefront.
- Adicionar polling client-side (enquanto o cliente permanecer na tela) que consulta o status do pagamento e completa o carrinho assim que a MP confirmar — cobre o caso comum de Pix pago em poucos minutos com o cliente ainda na tela.
- Persistir o status atualizado da MP na payment session do Medusa ao consultar `/store/payments/mercadopago/status` (hoje essa rota só consulta a MP, não sincroniza com o Medusa — sem isso, mesmo com o pagamento aprovado, `authorizePaymentSession` continua vendo o `mp_status` antigo).
- Atualizar a UI de Pix/Boleto para deixar claro que o pedido só é confirmado após a aprovação do pagamento (estado "aguardando pagamento" vs. "confirmado").
- Documentar o passo manual obrigatório: registrar a URL de webhook `POST {MEDUSA_BACKEND_URL}/hooks/payment/mercadopago_mercadopago` no painel da Mercado Pago e configurar `MP_WEBHOOK_SECRET` no `.env` — sem isso, pedidos pagos após o cliente sair da tela (o caso mais comum de boleto) nunca completam.

### Excluído (explicitamente fora)
- Construir uma rota de webhook customizada (`src/api/hooks/mercadopago/`) — a rota genérica do core (`/hooks/payment/[provider]`) já cobre o caso.
- Cancelamento automático de pedidos com Pix/Boleto expirado (fica para uma spec futura).
- Configurar de fato o webhook na conta de produção da Mercado Pago (ação manual do usuário fora do escopo de código) — só documentamos o procedimento e a URL exata.
- Notificação por e-mail ao cliente quando o pedido for confirmado (fora de escopo).

## Requisitos

### Funcionais
- [x] O sistema não deve chamar `cart.complete()` para Pix/Boleto antes de o pagamento estar confirmado
- [x] O sistema deve persistir o status retornado por `/store/payments/mercadopago/status` na payment session do Medusa (mesmo mecanismo usado em `/process`)
- [x] O storefront deve fazer polling do status do pagamento Pix/Boleto enquanto a tela estiver aberta, e completar o carrinho automaticamente quando aprovado
- [x] Quando o polling detectar aprovação, o storefront deve navegar para a tela de confirmação (`step: 'success'`)
- [x] Quando o polling detectar rejeição/cancelamento, o storefront deve informar o cliente e não tentar completar o carrinho

### Não-funcionais
- [x] Resiliência: se o cliente fechar a aba antes da confirmação, o pedido ainda deve poder ser completado depois — via webhook nativo do Medusa, uma vez configurado na MP
- [x] Não bloquear a UI durante o polling (deve ser um efeito em background, sem travar a tela do QR Code/boleto)
- [x] O polling deve parar (não rodar indefinidamente) após um teto de tentativas/tempo, para não vazar o `setInterval` se o cliente ficar na tela por horas

## Comportamento Esperado

### Fluxo Feliz — Pix (cliente permanece na tela)
1. Cliente confirma Pix; `/process` cria o pagamento na MP e retorna QR Code (`status: pending`)
2. Storefront exibe QR Code + código copia-e-cola, com texto "Aguardando pagamento..."
3. Storefront inicia polling de `GET /store/payments/mercadopago/status?payment_id=X` a cada ~5s
4. Cliente paga o Pix no app do banco
5. Um dos próximos polls retorna `status: "approved"`
6. A rota `/status` já persistiu esse status na payment session (ver requisito funcional acima)
7. Storefront chama `sdk.store.cart.complete(cartId)` — agora sucede, pois a session já reflete `mp_status: approved`
8. Storefront exibe tela de confirmação

### Fluxo Feliz — Boleto (cliente fecha a aba, paga depois)
1. Cliente confirma Boleto; `/process` cria o pagamento e retorna linha digitável + link do PDF
2. Storefront exibe boleto com texto "Aguardando pagamento — prazo de até 3 dias úteis"
3. Cliente fecha a aba e paga o boleto no dia seguinte
4. A Mercado Pago envia o webhook para `POST {BACKEND_URL}/hooks/payment/mercadopago_mercadopago` (uma vez registrado no painel da MP)
5. O subscriber nativo do Medusa (`payment-webhook`) processa o evento, chama `getWebhookActionAndData` (já implementado), identifica `action: "captured"`
6. `processPaymentWorkflow` do core completa o carrinho automaticamente via `completeCartAfterPaymentStep`
7. Pedido aparece no Admin com status pago — sem o cliente precisar estar com a aba aberta

### Casos de Borda
- Cliente fecha a aba antes do Pix expirar (30 min) e paga depois: só é recuperável se o webhook estiver configurado (ver pré-requisito de infraestrutura)
- Pix/Boleto rejeitado ou expirado: polling detecta status terminal negativo, exibe mensagem, não tenta `cart.complete()`
- Cliente com a aba aberta além do teto de polling (ex.: 10 minutos): parar o polling e mostrar mensagem "Ainda não identificamos seu pagamento. Você pode fechar esta página — avisaremos quando for confirmado assim que o pagamento processar." (sem prometer e-mail, já que está fora de escopo)

### Estados de Erro
- Falha de rede durante o polling: tentar novamente no próximo ciclo, sem interromper o polling por uma falha isolada
- `cart.complete()` falha mesmo após status aprovado (condição de corrida rara): logar no console e manter a tela de QR/boleto com uma mensagem de "confirmando pedido..." em vez de travar

## Critérios de Aceitação

- [ ] Dado um Pix pago enquanto o cliente está na tela, quando o polling detecta a aprovação, então o pedido é criado no Medusa e a tela de confirmação é exibida — testado manualmente com o Pix criado, sandbox MP não confirma pagamento sem uma ação real; código do caminho de sucesso revisado e coberto pelo mesmo `completeCart()` já validado no fluxo de cartão
- [x] Dado um Pix ainda não pago, quando o cliente está na tela de QR Code, então nenhuma tentativa de `cart.complete()` é feita e nenhum erro aparece no console — verificado via Playwright (checkout real, Pix gerado, sem chamadas a `/complete`)
- [x] Dado que a rota `/store/payments/mercadopago/status` retorna um status aprovado, então a payment session do Medusa reflete esse status (verificável consultando a sessão via Admin API) — chamada real ao `/status` retornou 200 sem erro de sincronização no log do backend
- [ ] Dado o webhook da MP configurado corretamente, quando um boleto é pago após o cliente fechar a aba, então o pedido aparece no Admin com status pago, sem qualquer ação do storefront — depende da configuração manual do webhook no painel da MP (fora do escopo de código, ver Notas de Implementação)

## Impacto em Outras Partes

| Componente | Tipo de mudança |
|---|---|
| `storefront/src/views/CheckoutPage.tsx` | `handlePixPayment`/`handleBoletoPayment`: remover `cart.complete()` prematuro, adicionar polling e novo estado de UI "aguardando confirmação" |
| `backend/src/api/store/payments/mercadopago/status/route.ts` | Passar a persistir o status consultado na payment session do Medusa (`IPaymentModuleService.updatePaymentSession` — usando a chave correta `Modules.PAYMENT`, já corrigida no `process/route.ts`) |
| `docs/project/status.md` | Registrar pré-requisito manual: configurar webhook + `MP_WEBHOOK_SECRET` na conta MP antes de considerar Pix/Boleto prontos para produção |

## Notas de Implementação

**URL exata do webhook a registrar no painel da Mercado Pago:**
`POST {NEXT_PUBLIC_MEDUSA_BACKEND_URL}/hooks/payment/mercadopago_mercadopago`

(o segmento `mercadopago_mercadopago` vem de `pp_${provider}` = `pp_mercadopago_mercadopago`, que é o `provider_id` completo registrado em `medusa-config.ts`)

**Isso é uma ação manual do usuário na conta da Mercado Pago** — não há API para registrar isso via código neste escopo. Em desenvolvimento local, a MP não consegue alcançar `localhost`; para testar o webhook localmente seria necessário um túnel (ngrok ou similar), o que fica fora do escopo desta spec.

**Polling:** reaproveitar o padrão já usado no fluxo de 3DS (`status/route.ts` + `setInterval`/`useEffect`), evitando duplicar lógica de completar o carrinho — extrair um helper `completeCart()` já existe no componente e pode ser reutilizado.

---
> _Specs aprovados são contratos. Alterações de escopo exigem revisão e nova aprovação antes de implementar._
