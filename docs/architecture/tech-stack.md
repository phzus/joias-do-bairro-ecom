# Tech Stack

> Registra as tecnologias escolhidas e **por que** foram escolhidas. Toda adição ou troca de tecnologia deve ser acompanhada de um ADR em [decisions/](../decisions/).

## Backend

| Camada | Tecnologia | Versão | Justificativa | ADR |
|--------|-----------|--------|---------------|-----|
| Framework e-commerce | Medusa.js | 2.13.1 | Headless open source, extensível, admin incluído | [ADR-001](../decisions/001-medusajs-como-plataforma-de-ecommerce.md) |
| Runtime | Node.js | ≥20 | Requisito do Medusa.js | ADR-001 |
| Package manager | pnpm | 10.28.2 | Eficiência de disco, rigor de dependências | — |
| ORM | MikroORM (via Medusa DML) | bundled | Nativo ao Medusa v2 | — |
| Pagamentos | Stripe | via `@medusajs/medusa/payment-stripe` | Integração nativa Medusa | — |
| Frete | SuperFrete | módulo custom | Única transportadora integrada ao mercado BR | — |
| File Storage | Local (dev) / S3-compatível (prod) | condicional via env | Flexibilidade dev/prod sem mudança de código | — |
| Banco de dados | PostgreSQL | 16-alpine | Requisito do Medusa.js v2 | — |
| Cache / Queue | Redis | 7-alpine | Event bus e jobs em background | — |
| Containerização | Docker + Docker Compose | 29.3.0 / v5.1.0 | Portabilidade dev ↔ prod | — |

## Storefront (Frontend)

| Camada | Tecnologia | Versão | Justificativa | ADR |
|--------|-----------|--------|---------------|-----|
| Framework | Next.js | 16.1.6 | SSR/SSG, performance, ecossistema React | ADR-001 |
| UI Library | React | 19.2.3 | Padrão da indústria | — |
| Estilização | Tailwind CSS | v4 | Utility-first, rápido para customizar | — |
| SDK Medusa | `@medusajs/js-sdk` | 2.13.1 | Client oficial para a API do Medusa | — |
| Pagamentos | Stripe (`@stripe/react-stripe-js`) | ^5.6.0 | Componentes prontos para checkout seguro | — |
| Animações | Framer Motion + GSAP | ^12 / ^3.14 | Herdado do projeto de referência | — |
| Smooth scroll | Lenis | ^1.3.17 | Herdado do projeto de referência | — |
| Roteamento (SPA) | React Router DOM | ^7 | HashRouter dentro do Next.js App Router | — |
| Carrossel | Embla Carousel | ^8.6.0 | Leve e sem dependências | — |

## Infraestrutura (Produção — a definir)

| Camada | Tecnologia | Status |
|--------|-----------|--------|
| Hospedagem backend | VPS com Docker | A contratar |
| Reverse proxy | Traefik v3 | A configurar |
| SSL | Let's Encrypt (auto via Traefik) | A configurar |
| Hospedagem storefront | Vercel | A configurar |
| File storage | S3-compatível (MinIO/AWS/R2) | A definir |
| Domínio | joiasdodobairro.com.br | A verificar |

---
_Última atualização: 2026-06-10_
