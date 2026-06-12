# Storefront Environment Variables

Copy this content to `storefront/.env.local`:

```bash
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_STRIPE_PK=pk_test_SUBSTITUA_PELA_SUA_CHAVE_PUBLICA

# Asset URLs — em dev aponta para /public, em prod para S3 ou Vercel Blob
NEXT_PUBLIC_HERO_VIDEO_WEBM=/hero.webm
NEXT_PUBLIC_HERO_VIDEO_MP4=/hero.mp4
NEXT_PUBLIC_BANNER_VIDEO_MP4=/banner.mp4
NEXT_PUBLIC_LOGO_URL=/logo-joias.svg
```

See [Vercel Deployment Guide](./vercel-deployment.md) for production values.
