# ADR-001: Medusa.js como plataforma de e-commerce

**Status:** Aceito  
**Data:** 2026-06-10  
**Decisores:** Iago (desenvolvedor)

---

## Contexto

O projeto Joias do Bairro precisa de uma plataforma de e-commerce para suportar catálogo de produtos, carrinho, checkout, pagamentos e gestão pelo lojista. A decisão central é: construir do zero, usar uma plataforma SaaS (Shopify, VTEX) ou adotar uma plataforma headless open source.

Existe também um projeto de referência já operacional (Real Underground E-commerce) construído com Medusa.js + Next.js, o que reduz significativamente o risco técnico de adoção.

## Decisão

Utilizamos **Medusa.js v2** como backend de e-commerce e **Next.js** como storefront. O projeto será iniciado a partir do código do Real Underground E-commerce, adaptando o layout e identidade visual para a marca Joias do Bairro.

## Alternativas Consideradas

| Opção | Prós | Contras |
|-------|------|---------|
| **Medusa.js v2 (escolhida)** | Open source, extensível via módulos/workflows, admin incluído, integração SuperFrete já pronta no projeto de referência | Requer infra própria (VPS + Docker), curva de aprendizado maior |
| Shopify | Zero infra, suporte nativo, amplo ecossistema de apps | Custo mensal + taxas por transação, customização limitada, lock-in |
| WooCommerce | Familiar, plugins abundantes | PHP/WordPress, performance fraca para escala, customizações ficam frágeis |
| Construir do zero | Controle total | Tempo e custo muito altos para o escopo do projeto |

## Consequências

**Positivas:**
- Reuso do módulo SuperFrete (integração de frete já implementada e testada)
- Admin dashboard completo incluso (`/app`) sem desenvolvimento adicional
- Arquitetura modular: customizações ficam isoladas em `src/modules/`, sem tocar no core do Medusa — upgrades seguros
- Storefront desacoplado: layout pode ser totalmente redesenhado sem impactar o backend

**Negativas / Trade-offs:**
- Depende de infraestrutura própria (VPS com Docker) para o backend em produção
- Deploy do storefront separado do backend (Vercel + VPS)
- Gerenciamento de segredos e variáveis de ambiente mais complexo

**Riscos:**
- Medusa.js é uma plataforma em evolução — upgrades podem introduzir breaking changes (mitigado pelo script `safe-upgrade.sh` do projeto de referência)

## Referências

- [Documentação oficial Medusa.js v2](https://docs.medusajs.com)
- Projeto de referência: `real-underground-ecom` (Drive It Like Stole It)
