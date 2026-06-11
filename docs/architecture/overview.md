# Arquitetura — Visão Geral

> Descreve o design de alto nível do sistema. Atualize quando houver mudanças estruturais significativas.

## Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────────────┐
│              Storefront (Next.js — Vercel)               │
│    Catálogo · Carrinho · Checkout · Conta · Rastreio     │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS — @medusajs/js-sdk
┌───────────────────────▼─────────────────────────────────┐
│           Backend Medusa.js v2 (VPS + Docker)            │
│  /store API  ·  /admin API  ·  Admin Dashboard (/app)    │
│                                                          │
│  Módulos core: Products · Cart · Order · Payment         │
│                Fulfillment · Customer · Auth             │
│                                                          │
│  Módulo custom: SuperFrete (frete BR)                    │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
  ┌────────▼────────┐      ┌──────────▼──────────┐
  │  PostgreSQL 16  │      │    Serviços externos  │
  │  (dados)        │      │  Stripe · SuperFrete  │
  └─────────────────┘      └──────────────────────┘
           │
  ┌────────▼────────┐
  │    Redis 7      │
  │  (cache/jobs)   │
  └─────────────────┘
```

## Estrutura do Repositório

```
joias-do-bairro-ecom/
├── backend/                   # Medusa.js v2 — API + Admin
│   ├── src/
│   │   ├── admin/             # Customizações do painel admin (widgets, rotas)
│   │   ├── api/               # Rotas customizadas (store + admin + webhooks)
│   │   ├── modules/           # Módulos de negócio customizados
│   │   │   └── superfrete/    # Integração com SuperFrete (frete BR)
│   │   ├── scripts/           # Seed, setup inicial, scripts utilitários
│   │   ├── subscribers/       # Event subscribers
│   │   └── workflows/         # Medusa workflows (automações)
│   ├── medusa-config.ts       # Config central (DB, Redis, módulos, providers)
│   ├── docker-compose.yml     # Stack: jdb-medusa + jdb-postgres + jdb-redis
│   └── Dockerfile             # Multi-stage build
│
├── storefront/                # Next.js — Interface do cliente
│   ├── src/
│   │   ├── app/               # Next.js App Router + ClientApp (HashRouter SPA)
│   │   ├── components/        # Header, Footer, Navbar, ProductCard, etc.
│   │   ├── views/             # Páginas: ProductList, ProductDetail, Cart, Checkout…
│   │   ├── context/           # CartContext, AuthContext
│   │   └── lib/               # medusa.ts (SDK client), hooks.ts, auth.ts
│   └── next.config.ts
│
└── docs/                      # Segundo cérebro do projeto
```

## Módulos do Medusa.js

| Módulo | Tipo | Responsabilidade |
|--------|------|-----------------|
| Products | Core | Catálogo, variantes, categorias |
| Pricing | Core | Preços por região e canal de vendas |
| Cart | Core | Gerenciamento de carrinho de compras |
| Order | Core | Pedidos, histórico, status |
| Payment (Stripe) | Core + Provider | Checkout e cobrança |
| Customer | Core | Cadastro e autenticação de clientes |
| Fulfillment (SuperFrete) | Core + Custom Provider | Cotação e geração de etiquetas de frete |
| Inventory | Core | Controle de estoque |
| SuperFrete | **Custom** | Config cifrada, shipments, rastreio — 100% em `src/modules/superfrete/` |

## Padrão de Extensibilidade

Todo código customizado vive em `src/` — **zero arquivos do core Medusa são modificados**. Upgrades de versão do Medusa não perdem customizações. Esse é o padrão oficial do Medusa v2.

## Decisões de Arquitetura

Consulte a pasta [decisions/](../decisions/) para o histórico completo de ADRs.

---
_Última atualização: 2026-06-10_
