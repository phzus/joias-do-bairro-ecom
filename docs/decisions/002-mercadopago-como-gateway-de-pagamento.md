# ADR-002: Mercado Pago como Gateway de Pagamento (substituindo Stripe)

**Status:** `Aceito`  
**Data:** 2026-06-30  
**Decisores:** Iago (responsável pelo projeto)

---

## Contexto

O projeto foi iniciado com Stripe como gateway de pagamento por ser a integração nativa do Medusa.js. Entretanto, o público-alvo da Joias do Bairro é exclusivamente brasileiro, e o Stripe apresenta fricções relevantes para esse mercado:

- Não suporta Pix nativamente
- Não suporta Boleto Bancário
- Parcelamento no cartão exige configuração adicional e não segue as regras dos emissores brasileiros
- Representa um custo adicional sem benefício para um e-commerce 100% nacional

O Mercado Pago é o gateway dominante no Brasil, suporta todos os meios de pagamento relevantes (cartão parcelado, Pix, boleto), e tem familiaridade alta entre consumidores brasileiros.

## Decisão

Escolhemos substituir o Stripe pelo **Mercado Pago Checkout Transparente (via Orders API)** como gateway de pagamento exclusivo da Joias do Bairro.

O modelo escolhido é o **Checkout Transparente**, que mantém toda a experiência de pagamento dentro do próprio storefront — em vez do Checkout Pro (que redireciona para uma página do MP) ou do Checkout Bricks (que embute componentes prontos do MP). Essa escolha preserva o controle total sobre o design do checkout, que já possui identidade visual própria.

A integração será implementada como um módulo custom de payment provider no Medusa v2, seguindo o mesmo padrão já estabelecido pelo módulo SuperFrete.

## Alternativas Consideradas

| Opção | Prós | Contras |
|-------|------|---------|
| Mercado Pago — Checkout Transparente (escolhido) | Controle total da UI, todos os meios de pagamento BR, design coerente com o site | Mais trabalho de implementação (quem implementa é o agente Claude, não o time) |
| Mercado Pago — Checkout Bricks | Menos código de formulário, 3DS automático | Componente de UI controlado pelo MP, limita customização visual |
| Mercado Pago — Checkout Pro | Mínima implementação | Redireciona o usuário para fora do site — quebra a experiência |
| Manter Stripe | Integração nativa Medusa, zero esforço | Sem Pix, sem boleto, sem parcelamento BR nativo — inadequado para o mercado |

## Consequências

**Positivas:**
- Suporte nativo a Pix, boleto e cartão parcelado com regras brasileiras
- Experiência de pagamento 100% dentro do site, com identidade visual preservada
- Maior taxa de conversão esperada: meios de pagamento familiares ao consumidor BR
- Sem dependência de gateway estrangeiro para um negócio local

**Negativas / Trade-offs:**
- Não há plugin oficial de Mercado Pago para Medusa v2 — exige implementação de provider custom
- O Stripe (`@medusajs/medusa/payment-stripe`) e suas dependências no storefront serão removidos
- 3DS precisa ser tratado manualmente no frontend (iframe de challenge)

**Riscos:**
- A Orders API do MP (`/v1/orders`) é relativamente nova — pode ter mudanças; monitorar changelogs
- Webhooks de boleto podem atrasar — pedidos ficam em status "pendente" por até 3 dias úteis; o fluxo de liberação de estoque/fulfillment precisa respeitar isso

## Referências

- [Documentação Mercado Pago — Checkout Transparente](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/overview)
- [Spec: Integração Mercado Pago Checkout Transparente](../specs/001-integracao-mercadopago-checkout-transparente.md)
- ADR-001 — Medusa.js como plataforma (padrão de módulos custom a seguir)

---
> _Não edite um ADR aceito. Se a decisão mudar, crie um novo ADR e marque este como "Supersedido por ADR-NNN"._
