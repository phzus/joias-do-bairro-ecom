# CLAUDE.md — Joias do Bairro E-commerce

Este arquivo define como agentes Claude devem trabalhar neste projeto. Leia-o completamente antes de qualquer ação.

---

## 1. Contexto do Projeto

**Joias do Bairro** é um e-commerce de joias. Antes de começar qualquer trabalho, leia o segundo cérebro do projeto:

1. [docs/README.md](docs/README.md) — guia de navegação dos docs
2. [docs/project/overview.md](docs/project/overview.md) — visão, objetivos, personas
3. [docs/project/status.md](docs/project/status.md) — estado atual e próximos passos

Não assuma nada que não esteja nos docs ou no código. Se encontrar conflito entre docs e código, o código é a fonte de verdade — mas atualize os docs para refletir a realidade.

---

## 2. Regra de Ouro: Specs Antes de Código

Toda feature significativa precisa de um spec aprovado antes da implementação.

**Feature significativa = qualquer coisa que:**
- Adicione uma nova página, rota ou endpoint
- Introduza uma nova entidade no banco de dados
- Altere um fluxo de negócio existente (checkout, auth, pedidos)
- Impacte múltiplos módulos ao mesmo tempo

**Para features menores** (ajuste de UI, correção de bug, texto, estilo): pode implementar diretamente, mas registre no status.

---

## 3. Quando e Como Atualizar os Docs

Este é o protocolo de auto-alimentação do segundo cérebro. Siga-o rigorosamente.

### 3.1 `docs/project/status.md`
**Atualize sempre que:**
- Iniciar trabalho em uma feature → mova para "Em Progresso"
- Concluir uma feature ou milestone → marque como ✅ e mova para "Concluído"
- Identificar um bloqueio → adicione na seção "Bloqueios" com contexto
- O escopo de um milestone mudar → atualize a tabela

### 3.2 `docs/decisions/` — ADRs
**Crie um novo ADR sempre que:**
- Escolher um framework, biblioteca ou serviço externo relevante
- Tomar uma decisão sobre arquitetura de sistema (monolito vs microserviços, REST vs GraphQL, etc.)
- Adotar um padrão de design significativo
- Decidir **não** usar uma tecnologia que seria óbvia ou esperada
- Reverter ou mudar uma decisão anterior

**Como criar um ADR:**
1. Copie `docs/decisions/_template.md`
2. Nomeie como `docs/decisions/NNN-titulo-kebab-case.md` (sequencial, ex: `001-escolha-do-framework-frontend.md`)
3. Preencha todos os campos — especialmente "Alternativas Consideradas"
4. Atualize `docs/architecture/tech-stack.md` para referenciar o ADR

**Nunca edite um ADR aceito.** Se a decisão mudar, crie um novo que supersede o anterior.

### 3.3 `docs/specs/`
**Crie um spec antes de implementar qualquer feature significativa.**
**Atualize o status do spec** quando implementado (`Status: Implementado`).

### 3.4 `docs/architecture/`
**Atualize `overview.md` quando:**
- A estrutura de alto nível do sistema mudar
- Novos módulos forem introduzidos

**Atualize `tech-stack.md` quando:**
- Qualquer tecnologia for adicionada, substituída ou removida

**Atualize `data-model.md` quando:**
- Novas entidades forem criadas
- Campos relevantes forem adicionados ou removidos
- Relacionamentos entre entidades mudarem

### 3.5 `docs/project/overview.md`
**Atualize quando:**
- Os objetivos do projeto ficarem mais claros ou mudarem
- O escopo for expandido ou reduzido formalmente
- Novas personas forem identificadas

### 3.6 `docs/conventions/development.md`
**Atualize quando:**
- Uma nova convenção de código for estabelecida
- O fluxo de trabalho mudar
- Padrões de teste ou nomenclatura forem definidos

---

## 4. Protocolo de Início de Sessão

Todo agente que iniciar uma nova sessão de trabalho deve:

1. **Ler** `docs/project/status.md` para entender o estado atual
2. **Verificar** se há specs pendentes de aprovação em `docs/specs/`
3. **Checar** se há bloqueios registrados
4. **Confirmar** com o usuário qual é a tarefa antes de começar

Se os docs estiverem desatualizados em relação ao código (ex: uma feature está implementada mas não marcada como concluída), **corrija os docs primeiro**.

---

## 5. Checklist Antes de Considerar uma Tarefa Concluída

- [ ] O código funciona conforme os critérios de aceitação do spec?
- [ ] `docs/project/status.md` foi atualizado?
- [ ] Houve decisão arquitetural que precisa de ADR?
- [ ] Houve mudança no modelo de dados que precisa atualizar `data-model.md`?
- [ ] Houve mudança de tech stack que precisa atualizar `tech-stack.md`?
- [ ] O spec da feature foi marcado como `Implementado`?

---

## 6. Arquitetura do Projeto (resumo rápido)

```
joias-do-bairro-ecom/
├── backend/          # Medusa.js v2.13.1 — API + Admin dashboard
│   ├── medusa-config.ts       # Config central: DB, Redis, Stripe, SuperFrete, S3
│   ├── src/modules/superfrete/ # Módulo custom de frete BR (não tocar no core Medusa)
│   └── docker-compose.yml     # Containers: jdb-medusa, jdb-postgres, jdb-redis
│
├── storefront/       # Next.js 16 + React 19 — interface do cliente
│   ├── src/lib/medusa.ts      # SDK client → aponta para NEXT_PUBLIC_MEDUSA_BACKEND_URL
│   ├── src/views/             # Páginas: ProductList, ProductDetail, Cart, Checkout…
│   └── src/components/        # Header, Footer, Navbar, ProductCard…
│
└── docs/             # Segundo cérebro — leia antes de qualquer ação
```

### Regras de ouro para o código Medusa

- **Nunca modifique arquivos dentro de `node_modules/@medusajs/`**. Extensões ficam SEMPRE em `src/`.
- Para adicionar funcionalidade: crie módulo em `src/modules/`, rotas em `src/api/`, widgets em `src/admin/widgets/`.
- Para alterar o fluxo de um pedido/checkout: use `src/workflows/` e subscribers em `src/subscribers/`.
- O módulo SuperFrete em `src/modules/superfrete/` é um exemplo de módulo customizado completo — use como referência.

### Variáveis de ambiente

- Backend: `.env` (dev) | `.env.production` (prod — não commitar)
- Storefront: `.env.local` (dev) | variáveis no painel da Vercel (prod)

---

## 7. Princípios de Trabalho

- **Não invente contexto.** Se não está nos docs ou no código, não assuma.
- **Docs desatualizados são bugs.** Trate-os como tal.
- **Specs são contratos.** Mudanças de escopo exigem atualização do spec antes de implementar.
- **ADRs são imutáveis.** O histórico de decisões não é reescrito, é acumulado.
- **Status é comunicação.** `status.md` é a primeira coisa que qualquer pessoa lerá; mantenha-o honesto e atual.
