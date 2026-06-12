# Assets — Vídeos, Logo e Arquivos Estáticos

Este guia explica como gerenciar assets grandes (vídeos, logo) do projeto.

## 📋 Visão Geral

- **Em desenvolvimento local**: Assets ficam em `storefront/public/` (não versionados)
- **Em produção**: Assets são servidos via S3 + CloudFront
- **No Git**: Assets estão no `.gitignore` (não commitados)

## 🏃 Quick Start

### 1. Desenvolvimento Local

Coloque os arquivos diretamente em `storefront/public/`:

```
storefront/public/
├── hero.mp4          (serve http://localhost:3000/hero.mp4)
├── hero.webm         (fallback para hero.mp4)
├── banner.mp4
└── logo-joias.svg
```

Isso funciona imediatamente, Next.js serve via `/public`.

### 2. Produção (S3)

Configure as env vars do backend (`.env.production`):

```bash
S3_FILE_URL=https://seu-bucket.s3.region.amazonaws.com
S3_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
S3_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3_REGION=us-east-1
S3_BUCKET=joias-do-bairro-assets
S3_ENDPOINT=https://s3.amazonaws.com
```

Quando essas vars estão preenchidas, Medusa automaticamente:
- Serve uploads de admin via S3
- Usa o provider S3 para arquivos

### 3. Upload de Assets para S3

Use a CLI do AWS ou um script:

```bash
# Com AWS CLI
aws s3 cp storefront/public/hero.mp4 s3://joias-do-bairro-assets/hero.mp4
aws s3 cp storefront/public/hero.webm s3://joias-do-bairro-assets/hero.webm
aws s3 cp storefront/public/banner.mp4 s3://joias-do-bairro-assets/banner.mp4
aws s3 cp storefront/public/logo-joias.svg s3://joias-do-bairro-assets/logo-joias.svg
```

Ou use o painel AWS S3 → Upload.

## 🎯 URLs dos Assets

### Em Desenvolvimento
```
http://localhost:3000/hero.mp4
http://localhost:3000/logo-joias.svg
```

### Em Produção
```
https://seu-bucket.s3.region.amazonaws.com/hero.mp4
https://seu-bucket.s3.region.amazonaws.com/logo-joias.svg
```

(Com CloudFront, usa a distribuição: `https://d123.cloudfront.net/hero.mp4`)

## 📁 Arquivos Gerenciados

- `storefront/public/hero.mp4` — Vídeo hero em MP4
- `storefront/public/hero.webm` — Vídeo hero em WebM (fallback)
- `storefront/public/banner.mp4` — Vídeo do banner
- `storefront/public/logo-joias.svg` — Logo da marca

## ⚠️ Não Commite Esses Arquivos

Eles estão em `.gitignore`. Se aparecerem como "untracked files", não adicione ao git.

```bash
# ❌ Não faça isso
git add storefront/public/hero.mp4

# ✅ Apenas use localmente ou suba em S3
```

## 🔗 Relacionado

- [medusa-config.ts](../../backend/medusa-config.ts) — Configuração de file providers
- [.env template](../../backend/.env) — Variáveis de ambiente
