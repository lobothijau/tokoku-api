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
  await seed(pool);
  app = createApp({ pool });
});
after(() => pool.end());

test('GET /products mengembalikan 12 produk', async () => {
  const res = await request(app).get('/products');
  assert.equal(res.status, 200);
  assert.equal(res.body.length, 12);
  assert.deepEqual(Object.keys(res.body[0]).sort(), [
    'category',
    'id',
    'image',
    'name',
    'price',
    'stock',
  ]);
});

test('GET /products/:id mengembalikan satu produk', async () => {
  const res = await request(app).get('/products/1');
  assert.equal(res.status, 200);
  assert.equal(res.body.id, 1);
  assert.equal(typeof res.body.price, 'number');
});

test('GET /products/:id mengembalikan 404 kalau tidak ada', async () => {
  const res = await request(app).get('/products/999');
  assert.equal(res.status, 404);
});

test('GET /products/:id mengembalikan 404 kalau id bukan angka', async () => {
  const res = await request(app).get('/products/abc');
  assert.equal(res.status, 404);
});

test('route tidak dikenal mengembalikan 404 JSON', async () => {
  const res = await request(app).get('/tidak-ada');
  assert.equal(res.status, 404);
  assert.ok(res.body.error);
});

test('GET / menyajikan landing page', async () => {
  const res = await request(app).get('/');
  assert.equal(res.status, 200);
  assert.match(res.headers['content-type'], /html/);
  assert.match(res.text, /Tokoku API/);
});

test('gambar produk disajikan sebagai webp', async () => {
  const { body: product } = await request(app).get('/products/1');
  const res = await request(app).get(`/images/${product.image}`);
  assert.equal(res.status, 200);
  assert.equal(res.headers['content-type'], 'image/webp');
});
