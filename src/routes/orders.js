import { Router } from 'express';
import { withTransaction } from '../db.js';
import { lineSubtotal, orderTotal } from '../pricing.js';
import { validateOrder } from '../validation.js';

export function ordersRouter(pool) {
  const router = Router();

  router.post('/orders', async (req, res) => {
    const validated = validateOrder(req.body);
    if (validated.errors) {
      return res.status(400).json({ errors: validated.errors });
    }
    const { items } = validated;

    // Semua langkah di bawah berjalan dalam satu transaksi.
    const result = await withTransaction(pool, async (client) => {
      // Kunci baris produk (FOR UPDATE) supaya dua pesanan bersamaan
      // tidak bisa sama-sama mengambil stok terakhir.
      const ids = items.map((item) => item.productId);
      const { rows: products } = await client.query(
        `SELECT id, name, price, stock FROM products
         WHERE id = ANY($1) ORDER BY id FOR UPDATE`,
        [ids],
      );
      const byId = new Map(products.map((p) => [p.id, p]));

      const unknown = ids.filter((id) => !byId.has(id));
      if (unknown.length > 0) {
        return {
          status: 400,
          body: { errors: [`Produk tidak ditemukan: ${unknown.join(', ')}`] },
        };
      }

      const short = items.filter(
        (item) => byId.get(item.productId).stock < item.quantity,
      );
      if (short.length > 0) {
        return {
          status: 409,
          body: {
            error: 'Stok tidak cukup',
            products: short.map((item) => {
              const p = byId.get(item.productId);
              return { productId: p.id, name: p.name, available: p.stock };
            }),
          },
        };
      }

      const lines = items.map((item) => {
        const p = byId.get(item.productId);
        return {
          productId: p.id,
          name: p.name,
          quantity: item.quantity,
          unitPrice: p.price,
          subtotal: lineSubtotal(p.price, item.quantity),
        };
      });
      const total = orderTotal(lines);

      const { rows } = await client.query(
        'INSERT INTO orders (total) VALUES ($1) RETURNING id, created_at',
        [total],
      );
      const order = rows[0];

      for (const line of lines) {
        await client.query(
          'UPDATE products SET stock = stock - $1 WHERE id = $2',
          [line.quantity, line.productId],
        );
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4)`,
          [order.id, line.productId, line.quantity, line.unitPrice],
        );
      }

      return {
        status: 201,
        body: {
          id: order.id,
          items: lines,
          total,
          createdAt: order.created_at,
        },
      };
    });

    res.status(result.status).json(result.body);
  });

  return router;
}
