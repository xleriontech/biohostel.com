// Tipos de entorno Cloudflare (generados a mano; `npm run cf-typegen` los regenera).
interface CloudflareEnv {
  DB?: D1Database;
  UPLOADS?: R2Bucket;
  ASSETS?: Fetcher;
  ADMIN_SETUP_KEY?: string;
  NEXTJS_ENV?: string;
}
