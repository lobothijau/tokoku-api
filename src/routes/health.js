import { Router } from 'express';

// Cek apakah app hidup DAN database bisa dijangkau.
export function healthRouter(pool) {
  const router = Router();

  router.get('/health', async (req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok' });
    } catch (err) {
      console.error('Health check gagal:', err.message);
      res.status(503).json({ status: 'error' });
    }
  });

  return router;
}
