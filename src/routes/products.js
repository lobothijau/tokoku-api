import { Router } from 'express';

export function productsRouter(pool) {
  const router = Router();

  router.get('/products', async (req, res) => {
    const { rows } = await pool.query(
      'SELECT id, name, category, price, stock, image FROM products ORDER BY id',
    );
    res.json(rows);
  });

  router.get('/products/:id', async (req, res) => {
    // Id harus bilangan bulat positif, kalau tidak anggap tidak ditemukan.
    if (!/^[1-9]\d{0,8}$/.test(req.params.id)) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }

    const { rows } = await pool.query(
      'SELECT id, name, category, price, stock, image FROM products WHERE id = $1',
      [req.params.id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }
    res.json(rows[0]);
  });

  return router;
}
