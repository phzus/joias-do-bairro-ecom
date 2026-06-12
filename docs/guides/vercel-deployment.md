# Deploy no Vercel — Joias do Bairro Storefront

Guia para fazer deploy do storefront no Vercel.

## 📋 Pré-requisitos

- Conta no Vercel conectada ao GitHub
- Projeto linkado ao repositório `phzus/joias-do-bairro-ecom`
- Variáveis de ambiente configuradas

## 🚀 Configuração de Variáveis de Ambiente

No painel do Vercel, adicione as seguintes variáveis de ambiente:

### Obrigatórias

```
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.joiasdodobairro.com  # URL da API do Medusa em produção
NEXT_PUBLIC_STRIPE_PK=pk_live_...                               # Chave pública do Stripe em produção
```

### Assets — URLs dos Vídeos e Logo

```
NEXT_PUBLIC_HERO_VIDEO_WEBM=https://seu-bucket.s3.region.amazonaws.com/hero.webm
NEXT_PUBLIC_HERO_VIDEO_MP4=https://seu-bucket.s3.region.amazonaws.com/hero.mp4
NEXT_PUBLIC_BANNER_VIDEO_MP4=https://seu-bucket.s3.region.amazonaws.com/banner.mp4
NEXT_PUBLIC_LOGO_URL=https://seu-bucket.s3.region.amazonaws.com/logo-joias.svg
```

**Alternativa**: Use Vercel Blob Storage (sem custo extra para arquivos de até 1GB)

```
NEXT_PUBLIC_HERO_VIDEO_WEBM=https://blob.vercel-storage.com/...
NEXT_PUBLIC_HERO_VIDEO_MP4=https://blob.vercel-storage.com/...
```

## 📸 Upload de Assets

### Opção A: AWS S3 (Recomendado)

```bash
# Certifique-se de que as credenciais de AWS estão configuradas
aws s3 cp hero.webm s3://seu-bucket/hero.webm
aws s3 cp hero.mp4 s3://seu-bucket/hero.mp4
aws s3 cp banner.mp4 s3://seu-bucket/banner.mp4
aws s3 cp logo-joias.svg s3://seu-bucket/logo-joias.svg

# Fazer os arquivos públicos
aws s3api put-object-acl --bucket seu-bucket --key hero.webm --acl public-read
# ... repita para os outros arquivos
```

### Opção B: Vercel Blob Storage

1. Instale o CLI do Vercel: `npm i -g vercel`
2. Login: `vercel login`
3. Upload de arquivo:
   ```bash
   vercel env pull  # Sincroniza variáveis localmente
   # Use a API do Blob Storage para upload programático
   ```

## 🔧 Passo a Passo

### 1. Preparar o Repositório

```bash
git checkout main
git pull origin main
```

### 2. No Painel do Vercel

1. Vá para **Settings** → **Environment Variables**
2. Adicione as variáveis acima (não inclua variáveis locais de dev)
3. Verifique que está no **Production** environment

### 3. Fazer Deploy

O Vercel automaticamente deploya quando há push para `main`. Alternativamente:

```bash
vercel deploy --prod
```

## 🐛 Troubleshooting

### Build falha com "404 not found for hero.mp4"

**Causa**: Os vídeos ainda apontam para paths locais (`/hero.mp4`)

**Solução**: Verifique se as env vars estão configuradas no Vercel:
```bash
vercel env ls
```

### Vídeos mostram 404 em produção

**Causa**: As URLs do S3/Blob estão erradas ou os arquivos não existem lá

**Solução**: Teste a URL no navegador:
```
https://seu-bucket.s3.region.amazonaws.com/hero.webm
```

Se retornar 403 ou 404, o arquivo não foi upado corretamente.

## ✅ Checklist de Deploy

- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Assets upados para S3 ou Vercel Blob
- [ ] URLs dos assets apontam para os locais corretos
- [ ] Build passa localmente: `npm run build`
- [ ] Nenhum arquivo binário foi commitado (assets estão em `.gitignore`)

## 🔗 Relacionado

- [docs/guides/assets-setup.md](./assets-setup.md) — Gerenciamento de assets
- [storefront/.env.local](../../storefront/.env.local) — Template de env vars
