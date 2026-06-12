# Status do Projeto

> Este arquivo é o **termômetro vivo** do projeto. Atualize-o toda vez que uma feature for concluída, um bloqueio surgir ou uma decisão mudar o rumo.

## Estado Atual

**Fase:** Base do projeto estabelecida — código base importado, adaptações de identidade visual pendentes  
**Última atualização:** 2026-06-11

## Milestones

| # | Milestone | Status | Data alvo |
|---|-----------|--------|-----------|
| 1 | Estrutura do repositório e docs | ✅ Concluído | 2026-06-10 |
| 2 | Código base importado (Medusa + Storefront) | ✅ Concluído | 2026-06-10 |
| 3 | Identidade visual — layout da Joias do Bairro | 🔄 Em progresso | — |
| 4 | Instalação de dependências e primeiro boot local | ⬜ Pendente | — |
| 5 | Configuração SuperFrete (conta da Joias do Bairro) | ⬜ Pendente | — |
| 6 | Seed inicial com produtos da loja | ⬜ Pendente | — |
| 7 | Configurar infraestrutura de produção (VPS + Traefik) | ⬜ Pendente | — |
| 8 | Deploy do storefront na Vercel | ⬜ Pendente | — |
| 9 | Configurar Stripe (conta da Joias do Bairro) | ⬜ Pendente | — |
| 10 | Go-live em produção | ⬜ Pendente | — |

## Em Progresso

- **Identidade visual do storefront** — adaptar cores, tipografia, logo, componentes de UI para a marca Joias do Bairro

## Bloqueios

_Nenhum bloqueio identificado._

## Concluído Recentemente

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
