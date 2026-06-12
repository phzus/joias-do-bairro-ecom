# Convenções de Desenvolvimento

> Padrões de trabalho acordados para o projeto. Atualize quando um novo padrão for estabelecido.

## Fluxo de Trabalho

### Antes de Implementar
1. Verifique se existe um spec aprovado em `docs/specs/` para a feature
2. Se não existir, crie o spec e aguarde aprovação antes de codar
3. Leia os ADRs relevantes em `docs/decisions/`
4. Atualize `docs/project/status.md` movendo a tarefa para "Em Progresso"

### Durante a Implementação
- Uma feature por branch
- Commits atômicos e com mensagem clara
- Testes antes de considerar pronto

### Ao Finalizar
1. Atualize o status do spec para `Implementado`
2. Atualize `docs/project/status.md`
3. Crie um ADR se tomou uma decisão arquitetural significativa
4. Atualize `docs/architecture/` se mudou a estrutura do sistema

## Branches

| Prefixo | Uso |
|---------|-----|
| `feat/` | Nova feature |
| `fix/` | Correção de bug |
| `chore/` | Manutenção, deps, configs |
| `docs/` | Apenas documentação |
| `refactor/` | Refatoração sem mudança de comportamento |

## Commits

Seguimos Conventional Commits:

```
feat(catalog): add product listing with pagination
fix(cart): prevent duplicate items on add
docs(adr): record decision on payment gateway
```

## Nomenclatura

### Geral
- **Arquivos e pastas:** `kebab-case` (`product-card.tsx`, `use-cart.ts`)
- **Componentes React:** `PascalCase` (`ProductCard`, `CheckoutForm`)
- **Hooks:** prefixo `use` + `camelCase` (`useCart`, `useProductList`)
- **Variáveis e funções:** `camelCase` (`productList`, `handleAddToCart`)
- **Constantes globais:** `UPPER_SNAKE_CASE` (`MAX_CART_ITEMS`)
- **Tipos e interfaces TypeScript:** `PascalCase` (`CartItem`, `ProductVariant`)

### Medusa (backend)
- **Módulos:** pasta em `src/modules/<nome-do-modulo>/`
- **Rotas customizadas:** `src/api/<versao>/<recurso>/route.ts`
- **Workflows:** `src/workflows/<nome-do-workflow>.ts`
- **Subscribers:** `src/subscribers/<evento>.ts`

### Storefront (Next.js)
- **Views/páginas:** `src/views/<NomeDaView>/index.tsx`
- **Componentes:** `src/components/<NomeDoComponente>/index.tsx`
- **Utilitários:** `src/lib/<nome-do-util>.ts`

## Testes

Stack ainda não definida formalmente para testes. Por ora:
- Prioridade em testes manuais via storefront antes de marcar feature como concluída
- Backend: testar endpoints via `curl` ou Postman contra o servidor local
- Critério de aceite: todos os critérios do spec devem ser validados manualmente

> Atualizar quando uma biblioteca de testes for adotada (ex: Vitest, Playwright).

---
_Última atualização: 2026-06-12_
