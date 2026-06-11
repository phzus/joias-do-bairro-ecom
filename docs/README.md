# Docs — Segundo Cérebro do Projeto

Este diretório é o **segundo cérebro** do projeto Joias do Bairro. Todo agente ou desenvolvedor que chegar ao projeto **deve começar aqui** antes de qualquer ação.

## Como usar este diretório

Leia na ordem abaixo para ter contexto completo antes de trabalhar:

1. [project/overview.md](project/overview.md) — visão geral, objetivos e contexto do negócio
2. [project/status.md](project/status.md) — estado atual: o que está pronto, em progresso e bloqueado
3. [architecture/overview.md](architecture/overview.md) — design de alto nível do sistema
4. [architecture/tech-stack.md](architecture/tech-stack.md) — escolhas tecnológicas e justificativas
5. [architecture/data-model.md](architecture/data-model.md) — entidades e relacionamentos do domínio
6. [decisions/](decisions/) — registro de decisões arquiteturais (ADRs)
7. [specs/](specs/) — especificações de features antes da implementação
8. [conventions/development.md](conventions/development.md) — fluxo de trabalho e padrões de código

## Estrutura

```
docs/
├── README.md                    ← você está aqui
├── project/
│   ├── overview.md              ← visão, metas, personas
│   └── status.md                ← progresso atual, milestones
├── specs/
│   ├── _template.md             ← template para escrever specs
│   └── (specs de features)
├── decisions/
│   ├── _template.md             ← template para ADRs
│   └── (ADRs numerados: 001-xyz.md)
├── architecture/
│   ├── overview.md              ← arquitetura de alto nível
│   ├── tech-stack.md            ← tecnologias e justificativas
│   └── data-model.md            ← modelo de domínio
└── conventions/
    └── development.md           ← padrões de desenvolvimento
```

## Regra de ouro

> **Specs antes de código.** Toda feature significativa precisa de um spec aprovado em `specs/` antes da implementação começar. O spec é o contrato; o código é a consequência.
