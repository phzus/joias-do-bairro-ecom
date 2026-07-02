# Status do Projeto

> Este arquivo é o **termômetro vivo** do projeto. Atualize-o toda vez que uma feature for concluída, um bloqueio surgir ou uma decisão mudar o rumo.

## Estado Atual

**Fase:** Base do projeto estabelecida — código base importado, adaptações de identidade visual pendentes  
**Última atualização:** 2026-07-01

## Milestones

| # | Milestone | Status | Data alvo |
|---|-----------|--------|-----------|
| 1 | Estrutura do repositório e docs | ✅ Concluído | 2026-06-10 |
| 2 | Código base importado (Medusa + Storefront) | ✅ Concluído | 2026-06-10 |
| 3 | Identidade visual — layout da Joias do Bairro | 🔄 Em progresso | — |
| 4 | Instalação de dependências e primeiro boot local | ✅ Concluído | 2026-06-12 |
| 5 | Configuração SuperFrete (conta da Joias do Bairro) | ⬜ Pendente | — |
| 6 | Seed inicial com produtos da loja | ⬜ Pendente | — |
| 7 | Configurar infraestrutura de produção (VPS + Traefik) | ⬜ Pendente | — |
| 8 | Deploy do storefront na Vercel | ⬜ Pendente | — |
| 9 | Integração Mercado Pago — Checkout Transparente | ✅ Concluído | 2026-06-30 |
| 10 | Go-live em produção | ⬜ Pendente | — |

## Em Progresso

- **Identidade visual do storefront** — adaptar cores, tipografia, logo, componentes de UI para a marca Joias do Bairro. Paleta definida: branco e preto como cores majoritárias, vermelho bordô (`#8b1e2f`) como cor de destaque minoritária — já aplicada em todo o storefront no lugar do laranja-avermelhado (`#e34717`) herdado do template Real Underground. Tipografia, logo e demais componentes de UI ainda pendentes.

## Bloqueios

- **Webhook da Mercado Pago ainda não configurado na conta MP (ação manual, fora do escopo de código).** `MP_WEBHOOK_SECRET` continua vazio em `backend/.env` e nenhuma URL foi cadastrada no painel da MP. Sem isso, um Pix/Boleto pago depois que o cliente fecha a aba do checkout **não completa o pedido automaticamente** (o polling client-side só cobre o caso do cliente permanecer na tela). URL a cadastrar: `POST {NEXT_PUBLIC_MEDUSA_BACKEND_URL}/hooks/payment/mercadopago_mercadopago`. Ver [Spec-002](../specs/002-conclusao-assincrona-pix-boleto.md) para detalhes.

## Concluído Recentemente

- **Implementado Spec-002 — conclusão assíncrona de Pix/Boleto.** Removida a chamada prematura de `sdk.store.cart.complete(cartId)` em `handlePixPayment`/`handleBoletoPayment` ([CheckoutPage.tsx](../../storefront/src/views/CheckoutPage.tsx)); o storefront agora faz polling de `GET /store/payments/mercadopago/status` a cada 5s (teto de 120 tentativas ≈ 10min) e só completa o carrinho quando a MP confirma o pagamento. A rota de status ([route.ts](../../backend/src/api/store/payments/mercadopago/status/route.ts)) passou a persistir o `mp_status` consultado na payment session do Medusa (mesmo mecanismo do `/process`), o que também corrige de quebra o mesmo problema latente no fluxo de 3DS de cartão. UI mostra "Aguardando confirmação do pagamento...", trata rejeição/timeout e a rara condição de corrida onde `cart.complete()` falha após aprovação. Verificado via Playwright contra o sandbox real da MP: Pix gerado com sucesso, nenhuma chamada a `/complete` antes da aprovação, status persistido sem erro. Falta apenas o pré-requisito de infraestrutura (webhook, ver Bloqueios) para cobrir o caso do cliente fechar a aba.

- **🔴 Fix crítico: preços e cobrança via Mercado Pago estavam 100x errados.** `formatPrice` ([hooks.ts](../../storefront/src/lib/hooks.ts)) dividia todo valor por 100 assumindo a convenção de centavos do Medusa v1 — mas este Medusa v2 armazena/retorna preços em reais decimais diretos (confirmado: variante com `calculated_amount: 149.99` exibia "R$ 1,50"). Isso forçava quem cadastrava produto a digitar valores 100x maiores para "compensar" o bug (ex.: 14999 para R$149,99). Pior: o mesmo erro existia em `transactionAmount = Number(cart.total) / 100` no [process/route.ts](../../backend/src/api/store/payments/mercadopago/process/route.ts) — a Mercado Pago estava sendo cobrada 100x menos do que o total exibido no carrinho. Corrigido removendo as divisões/multiplicações por 100 em `formatPrice`, no cálculo de parcelas do cartão e no valor enviado à MP. Também corrigido o dado já "compensado" no frete: a opção "Correios PAC" estava cadastrada com R$2.500,00 em vez de R$25,00 no Admin (ajustado via Admin API). Os dois produtos de teste (`Camiseta Drop #001`, `Moletom Jiu-Jitsu Drop #001`) já tinham preço correto no banco e não precisaram de correção. **Ação necessária:** revisar qualquer preço cadastrado manualmente usando o workaround 100x antes de ir para produção.

- **Fix: sessão de pagamento Mercado Pago nunca era autorizada** — `POST /store/payments/mercadopago/process` resolvia o serviço de pagamento com a chave inválida `"IPaymentModuleService"` (não existe no container do Medusa v2 — a chave correta é `Modules.PAYMENT`). A falha era engolida por um `catch` silencioso, então `mp_status` nunca era persistido na sessão; no `authorizePaymentSession` o Medusa lia a sessão sem `mp_status`, caía no status `pending` e lançava "Session: ... was not authorized with the provider." mesmo com o pagamento aprovado na MP. Corrigido em [route.ts](../../backend/src/api/store/payments/mercadopago/process/route.ts): chave certa (`Modules.PAYMENT`), `amount` adicionado ao `updatePaymentSession` (campo obrigatório no DTO) e o catch agora retorna 500 em vez de falhar silenciosamente.

- **Fix: produtos sem shipping profile bloqueando checkout** — `Camiseta Drop #001` e `Moletom Jiu-Jitsu Drop #001` (criados manualmente via Admin) nunca foram vinculados a um shipping profile, causando o erro "The cart items require shipping profiles that are not satisfied by the current shipping methods" ao tentar pagar. Vinculados ao "Default Shipping Profile" via `updateProductsWorkflow`. Causa raiz: criação manual de produto no Admin não força seleção de shipping profile, e não há constraint impedindo salvar sem um.

- **Integração Mercado Pago** — Stripe removido e substituído por MP Checkout Transparente. Provider custom Medusa v2 criado em `src/modules/mercadopago/`, rotas de API em `src/api/store/payments/mercadopago/`, e CheckoutPage.tsx reescrito com suporte a cartão parcelado, Pix e Boleto. ([ADR-002](../decisions/002-mercadopago-como-gateway-de-pagamento.md), [Spec-001](../specs/001-integracao-mercadopago-checkout-transparente.md))

- **Favicon da marca (2026-06-30):** o favicon padrão do Next.js foi substituído pelo wordmark grafitado "Joias do Bairro" (`public/logo-joias.svg`, branco). Como a logo é branca, foi composta sobre o fundo da marca (`#050505`) para ficar visível em qualquer aba/tema. Gerados em `storefront/src/app/`: `favicon.ico` (16/32/48px), `icon.svg` (vetor, cantos arredondados) e `apple-icon.png` (180px). O Next 16 (App Router) injeta os `<link>` automaticamente a partir desses arquivos — sem alterar `layout.tsx`.
- **Fix vídeo da hero no deploy Vercel (2026-06-28):** a hero não exibia o vídeo de fundo em produção. Causa raiz: o `<source>` lia `process.env.NEXT_PUBLIC_HERO_VIDEO_*`, que são injetadas em build-time e não existiam na Vercel (`.env.local` é gitignored). Correção: referência por caminho literal `/hero.webm` e `/hero.mp4` — arquivos em `public/` (commitados) sempre entram no deploy, sem env var nem config manual na Vercel ([ProductListPage.tsx](../../storefront/src/views/ProductListPage.tsx)). Nota: importar mídia como módulo (`import x from '@/assets/x.mp4'`) **não** funciona no Turbopack/Next 16 sem loader customizado.
- **Primeiro boot local concluído (2026-06-12):** migrações aplicadas (`medusa db:migrate`), seed inicial executado (região, sales channel, publishable key, produtos demo), usuário admin criado, `storefront/.env.local` criado com a publishable key. Backend (`:9000`), Admin (`:9000/app`) e storefront (`:3000`) sobem e o storefront consome o `/store/products` com sucesso. Postgres/Redis via Docker (`jdb-postgres`, `jdb-redis`).
- Correção de UI: vídeo do hero agora cobre toda a seção (`object`-cover via `h-full w-auto max-w-none`); causa raiz era o `max-width: 100%` do Preflight do Tailwind v4 travando a largura do vídeo na largura da tela ([ProductListPage.tsx](../../storefront/src/views/ProductListPage.tsx))
- Repositório Git inicializado
- Pasta `docs/` criada com estrutura de segundo cérebro
- `CLAUDE.md` criado com instruções para agentes
- Código do projeto Real Underground E-commerce duplicado para `backend/` e `storefront/`
- `package.json` e `docker-compose.yml` renomeados para identidade Joias do Bairro
- `medusa-config.ts` atualizado (appName, contactEmail)
- ADR-001 registrado (escolha do Medusa.js)
- Arquivos `.env` de exemplo criados
- Docs de arquitetura e tech stack preenchidos

## Próximos Passos

1. **Identidade visual:** adaptar Header, Footer, Logo, cores e tipografia no storefront
2. **Boot local:** instalar dependências (`pnpm install` em ambos) e testar o ambiente de dev
3. **Configurar SuperFrete** com os dados da Joias do Bairro (conta, token, CEP de origem)
4. **Seed de produtos** com o catálogo inicial da joalheria
