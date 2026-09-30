import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { createPool } from '../../src/db.js';
import { runMigrations } from '../../scripts/migrate.js';
import { seed } from '../../scripts/seed.js';

let pool;
let app;
before(async () => {
  pool = createPool(process.env.DATABASE_URL);
  await runMigrations(pool);
  await seed(pool); // reset data: produk 1 = Kopi Gayo (85000, stok 40)
  app = createApp({ pool });
});
after(() => pool.end());

async function stockOf(id) {
  const { rows } = await pool.query(
    'SELECT stock FROM products WHERE id = $1',
    [id],
  );
  return rows[0].stock;
}

test('POST /orders membuat pesanan dan mengurangi stok', async () => {
  const res = await request(app)
    .post('/orders')
    .send({
      items: [
        { productId: 1, quantity: 2 }, // 2 x 85000
        { productId: 5, quantity: 10 }, // 10 x 3500
      ],
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.total, 205000);
  assert.equal(res.body.items.length, 2);
  assert.equal(res.body.items[0].subtotal, 170000);
  assert.ok(res.body.id);
  assert.equal(await stockOf(1), 38);
  assert.equal(await stockOf(5), 490);
});

test('POST /orders menolak body tidak valid dengan 400', async () => {
  const res = await request(app).post('/orders').send({ items: [] });
  assert.equal(res.status, 400);
  assert.ok(res.body.errors.length > 0);
});

test('POST /orders menolak JSON rusak dengan 400', async () => {
  const res = await request(app)
    .post('/orders')
    .set('Content-Type', 'application/json')
    .send('{rusak');
  assert.equal(res.status, 400);
});

test('POST /orders menolak produk yang tidak ada dengan 400', async () => {
  const res = await request(app)
    .post('/orders')
    .send({ items: [{ productId: 999, quantity: 1 }] });
  assert.equal(res.status, 400);
});

test('POST /orders mengembalikan 409 kalau stok kurang dan tidak mengubah stok', async () => {
  const stockBefore = await stockOf(2);
  const res = await request(app)
    .post('/orders')
    .send({
      items: [
        { productId: 1, quantity: 1 },
        { productId: 2, quantity: 100 }, // stok hanya 120 -> cukup
        { productId: 12, quantity: 100 }, // stok hanya 45 -> kurang
      ],
    });

  assert.equal(res.status, 409);
  assert.equal(res.body.products[0].productId, 12);
  // Transaksi batal: stok produk lain tidak berubah.
  assert.equal(await stockOf(2), stockBefore);
  assert.equal(await stockOf(1), 38);
});
