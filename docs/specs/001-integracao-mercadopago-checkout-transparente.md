# Spec: Integração Mercado Pago — Checkout Transparente

**Status:** `Implementado`  
**Criado em:** 2026-06-30  
**Última revisão:** 2026-06-30  
**ADRs relacionados:** [ADR-002](../decisions/002-mercadopago-como-gateway-de-pagamento.md)

---

## Objetivo

Substituir o Stripe pelo Mercado Pago Checkout Transparente como gateway de pagamento, suportando cartão de crédito parcelado, Pix e Boleto, mantendo toda a experiência de checkout dentro do storefront.

## Contexto e Motivação

O público é 100% brasileiro. O Stripe não suporta Pix nem Boleto, que são meios de pagamento essenciais para conversão no Brasil. O Mercado Pago é o gateway dominante no país e familiar ao consumidor. Sem isso o e-commerce não consegue operar.

## Escopo

### Incluído
- Módulo custom de payment provider para Medusa v2 (`src/modules/mercadopago/`)
- Endpoint backend para processar pagamentos MP (`src/api/store/payments/mercadopago/`)
- Endpoint de webhook MP (`src/api/hooks/mercadopago/`)
- Form de cartão customizado no storefront com tokenização via MP.js
- Seletor de parcelas dinâmico (busca regras por BIN do cartão)
- Fluxo de Pix: exibição de QR Code e código copia-e-cola
- Fluxo de Boleto: exibição de linha digitável e link PDF
- Tratamento de 3DS 2.0 (iframe de challenge no checkout)
- Remoção do Stripe do backend e storefront
- Atualização de variáveis de ambiente

### Excluído (explicitamente fora)
- Checkout Pro ou Checkout Bricks (decisão: Transparente apenas)
- Pagamento via conta Mercado Pago / saldo MP
- Cartão de débito (escopo futuro)
- Salvar cartões para uso futuro (escopo futuro)
- Split de pagamento

## Requisitos

### Funcionais
- [ ] O usuário deve poder pagar com cartão de crédito (Visa, Mastercard, Elo, Hipercard, Amex)
- [ ] O usuário deve poder escolher o número de parcelas com as taxas corretas por emissor
- [ ] O usuário deve poder pagar via Pix, com QR Code exibido na tela
- [ ] O usuário deve poder pagar via Boleto, com linha digitável e link para PDF
- [ ] O sistema deve tratar o fluxo de 3DS 2.0 sem redirecionar o usuário para fora do checkout
- [ ] O sistema deve confirmar pagamentos de Pix e Boleto via webhook
- [ ] O sistema deve rejeitar pagamentos duplicados (idempotency key por tentativa)

### Não-funcionais
- [ ] Segurança: dados brutos do cartão nunca chegam ao servidor próprio (tokenização via MP.js no frontend)
- [ ] Segurança: webhook validado via HMAC (`x-signature`)
- [ ] Performance: seletor de parcelas carrega ao digitar os 6 primeiros dígitos do cartão (BIN), sem bloquear o form
- [ ] Resiliência: falha no webhook não bloqueia o usuário — o status do pedido é atualizado de forma assíncrona

## Comportamento Esperado

### Fluxo Feliz — Cartão de Crédito

1. Usuário conclui etapa de endereço e frete
2. Tela de pagamento exibe: abas Cartão / Pix / Boleto
3. Na aba Cartão: form com número, validade, CVV, nome do titular, CPF, seletor de parcelas
4. Ao digitar 6 dígitos do cartão (BIN), o storefront busca as opções de parcelamento e popula o select
5. Usuário preenche e confirma
6. MP.js tokeniza o cartão no browser → retorna `{ token, payment_method_id, installments, issuer_id }`
7. Storefront chama `POST /store/payments/mercadopago/process` com os dados + `cart_id`
8. Backend chama `POST /v1/orders` na API do MP
9. MP retorna `status: "processed"` + `status_detail: "accredited"`
10. Backend atualiza a payment session do Medusa e retorna sucesso
11. Storefront chama `sdk.store.cart.complete(cart.id)`
12. Exibe tela de confirmação do pedido

### Fluxo 3DS

Passos 1–8 iguais ao fluxo de cartão. No passo 9:

9. MP retorna `status: "action_required"` + `status_detail: "pending_challenge"`
10. Storefront extrai a URL de challenge da resposta e renderiza um `<iframe>` na tela
11. Usuário completa a autenticação no banco emissor (dentro do iframe)
12. Storefront detecta `window.postMessage({ status: "COMPLETE" })`
13. Storefront chama `GET /store/payments/mercadopago/status?order_id=X` para confirmar
14. Se aprovado: `cart.complete()` → tela de confirmação
15. Se rejeitado: exibe erro e permite nova tentativa

### Fluxo Feliz — Pix

1. Usuário seleciona aba Pix e confirma
2. Storefront chama `POST /store/payments/mercadopago/process` com `{ method: "pix", cart_id }`
3. Backend cria order no MP (`payment_method.id: "pix"`, `type: "bank_transfer"`)
4. MP retorna `{ qr_code, qr_code_base64, ticket_url }`
5. Storefront exibe: imagem do QR Code + código copia-e-cola + contador de expiração
6. Pedido no Medusa criado com status `pending`
7. MP envia webhook quando Pix for pago → backend confirma → status do pedido atualizado para `paid`

### Fluxo Feliz — Boleto

1. Usuário seleciona aba Boleto e confirma
2. Storefront chama `POST /store/payments/mercadopago/process` com `{ method: "boleto", cart_id }`
3. Backend cria order no MP com dados do pagador (CPF + endereço completo do form de shipping)
4. MP retorna `{ ticket_url, digitable_line }`
5. Storefront exibe linha digitável + botão "Abrir Boleto PDF"
6. Pedido criado com status `pending`
7. Webhook confirma pagamento (até 3 dias úteis) → status atualizado

### Casos de Borda

- Usuário fecha o browser durante 3DS: pedido fica em `pending_challenge`; pode tentar novamente
- Boleto vencido sem pagamento: webhook MP notifica cancelamento → cancelar pedido no Medusa
- BIN do cartão não retorna parcelas: exibir apenas opção de 1x sem juros
- Pix expirado sem pagamento: webhook MP notifica → cancelar pedido
- Webhook chega fora de ordem (status antigo): verificar `date_created` antes de aplicar

### Estados de Erro

- Cartão recusado (`status: "failed"`): exibir mensagem genérica "Cartão recusado. Verifique os dados ou tente outro cartão."
- 3DS falhou (`status_detail: "cc_rejected_3ds_challenge"`): "Autenticação recusada pelo seu banco. Tente novamente ou use outro cartão."
- Timeout 3DS (40 min): "Tempo de autenticação expirado. Inicie um novo pagamento."
- Erro de rede ao chamar API MP: exibir "Erro temporário. Tente novamente em instantes." e logar no servidor

## Critérios de Aceitação

- [ ] Dado um cartão de teste aprovado, quando o usuário finaliza o pagamento, então o pedido é criado no Medusa com status `paid`
- [ ] Dado um cartão que requer 3DS, quando o usuário completa o challenge, então o pedido é criado com status `paid`
- [ ] Dado um cartão recusado, quando o usuário tenta pagar, então uma mensagem de erro é exibida e o usuário pode tentar novamente sem criar um novo carrinho
- [ ] Dado que o usuário escolheu Pix, quando confirma o pedido, então um QR Code válido é exibido e o pedido fica em `pending`
- [ ] Dado que o usuário escolheu Boleto, quando confirma o pedido, então a linha digitável é exibida e o pedido fica em `pending`
- [ ] Dado que o webhook do MP chega com status `completed`, quando o backend processa, então o pedido no Medusa é atualizado para `paid`
- [ ] Dado uma requisição de webhook sem `x-signature` válido, quando chega ao endpoint, então retorna 401 e não processa

## Impacto em Outras Partes

| Componente | Tipo de mudança |
|---|---|
| `backend/medusa-config.ts` | Substituir provider `pp_stripe_stripe` por `pp_mercadopago_mercadopago` |
| `backend/src/modules/` | Novo módulo `mercadopago/` |
| `backend/src/api/store/` | Nova rota `payments/mercadopago/` |
| `backend/src/api/hooks/` | Nova rota `mercadopago/` |
| `storefront/src/views/CheckoutPage.tsx` | Substituir Stripe Elements por form MP customizado |
| `backend/package.json` | Adicionar `mercadopago`; remover `@stripe/stripe-js`-related |
| `storefront/package.json` | Adicionar `@mercadopago/sdk-js`; remover `@stripe/react-stripe-js`, `@stripe/stripe-js` |
| `.env` / `.env.local` | Adicionar `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MP_WEBHOOK_SECRET`; remover `STRIPE_API_KEY`, `NEXT_PUBLIC_STRIPE_PK` |

## Notas de Implementação

**Estrutura de arquivos backend:**
```
backend/src/
├── modules/mercadopago/
│   ├── index.ts              # module definition
│   ├── service.ts            # MercadoPagoModuleService
│   └── providers/
│       ├── index.ts          # provider registration
│       └── payment.ts        # MercadoPagoPaymentProvider (implements AbstractPaymentProvider)
├── api/
│   ├── store/payments/mercadopago/
│   │   ├── process/route.ts  # POST — cria order no MP, retorna status/QR/boleto
│   │   └── status/route.ts   # GET  — consulta status de order (para polling pós-3DS)
│   └── hooks/mercadopago/
│       └── route.ts          # POST — recebe webhooks do MP
```

**`X-Idempotency-Key`:** gerar um `crypto.randomUUID()` por tentativa de pagamento. Armazenar na payment session para reenvio seguro em caso de retry.

**Parcelas:** chamar `GET https://api.mercadopago.com/v1/payment_methods/installments?payment_method_id={id}&amount={valor}&access_token={PUBLIC_KEY}` ao detectar BIN completo (6 dígitos). Debounce de 300ms.

**Boleto:** o CPF do pagador vem do form de checkout (campo já existe na tela de endereço como parte do identificador). Se ainda não houver campo CPF no form, precisará ser adicionado.

**Webhook secret:** gerado automaticamente pelo painel MP ao configurar o endpoint. Armazenar em `MP_WEBHOOK_SECRET` no `.env` do backend.

---
> _Specs aprovados são contratos. Alterações de escopo exigem revisão e nova aprovação antes de implementar._
