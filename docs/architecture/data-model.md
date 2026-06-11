# Modelo de Dados

> Descreve as entidades do domínio e seus relacionamentos. Atualize sempre que o schema mudar.

## Status

**Modelo não definido ainda.** Preencher após spec de catálogo de produtos.

## Entidades Previstas

### Product
Representa uma joia à venda.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | Identificador único |
| name | string | Nome do produto |
| description | text | Descrição detalhada |
| price | decimal | Preço em reais |
| stock | int | Quantidade disponível |
| category | enum/FK | Categoria (anel, colar, brinco…) |
| material | enum/FK | Material (ouro, prata, folheado…) |
| images | array | URLs das fotos |
| created_at | datetime | |

### Order
Pedido realizado por um cliente.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | |
| customer_id | FK → User | |
| status | enum | pending · paid · shipped · delivered · cancelled |
| total | decimal | |
| created_at | datetime | |

### OrderItem
Linha de um pedido.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| order_id | FK → Order | |
| product_id | FK → Product | |
| quantity | int | |
| unit_price | decimal | Preço no momento da compra |

### User
Cliente ou admin.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | |
| email | string | |
| role | enum | customer · admin |
| name | string | |
| created_at | datetime | |

## Relacionamentos

```
User ──< Order ──< OrderItem >── Product
```

---
_Última atualização: 2026-06-10_
