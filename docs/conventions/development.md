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

_Preencher conforme tech stack for definida._

## Testes

_Preencher conforme tech stack for definida._

---
_Última atualização: 2026-06-10_
