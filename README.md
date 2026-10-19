# Mobile App Manager Frontend

Koçum Benim, Trinkow ve diğer mobil uygulamalar için React tabanlı yönetim paneli.

## Local development

Node.js 24 ve pnpm 12 gerekir.

```bash
cp .env.example .env
corepack pnpm install
corepack pnpm dev
```

Panel varsayılan olarak `http://localhost:5173` adresinde çalışır. Backend adresi
`VITE_API_URL` ile belirlenir.

## Production image

```bash
docker build --build-arg VITE_API_URL=https://apps-backend.triworkster.com -t mobile-app-manager .
docker run --rm -p 3100:80 mobile-app-manager
```
