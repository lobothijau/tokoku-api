import express from 'express';
import { healthRouter } from './routes/health.js';
import { productsRouter } from './routes/products.js';
import { ordersRouter } from './routes/orders.js';

const publicDir = new URL('../public/', import.meta.url).pathname;

// Membuat aplikasi Express. Pool database diberikan dari luar
// supaya mudah diganti saat testing.
export function createApp({ pool }) {
  const app = express();

  // App berjalan di belakang reverse proxy (Nginx) di server yang sama.
  app.set('trust proxy', 'loopback');

  // Satu baris log per request: METHOD url status durasi
  app.use((req, res, next) => {
    const start = performance.now();
    res.on('finish', () => {
      const ms = Math.round(performance.now() - start);
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
    });
    next();
  });

  app.use(express.json());
  app.use(express.static(publicDir));

  app.use(healthRouter(pool));
  app.use(productsRouter(pool));
  app.use(ordersRouter(pool));

  // Route tidak dikenal
  app.use((req, res) => {
    res.status(404).json({ error: 'Tidak ditemukan' });
  });

  // Penanganan error terakhir
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'JSON tidak valid' });
    }
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  });

  return app;
}
