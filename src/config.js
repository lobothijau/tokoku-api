// Membaca konfigurasi dari environment variable.
// Di lokal, variabel dimuat lewat `node --env-file=.env` (tanpa dotenv).

export function loadConfig(env = process.env) {
  if (!env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL belum diatur. Salin .env.example menjadi .env, atau set variabel ini di server.',
    );
  }

  return {
    host: env.HOST || '127.0.0.1',
    port: Number(env.PORT) || 3000,
    databaseUrl: env.DATABASE_URL,
    nodeEnv: env.NODE_ENV || 'development',
  };
}
