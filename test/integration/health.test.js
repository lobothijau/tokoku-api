import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { createPool } from '../../src/db.js';

let pool;
before(() => {
  pool = createPool(process.env.DATABASE_URL);
});
after(() => pool.end());

test('GET /health mengembalikan 200 saat database hidup', async () => {
  const res = await request(createApp({ pool })).get('/health');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { status: 'ok' });
});

test('GET /health mengembalikan 503 saat database tidak terjangkau', async () => {
  // Port 1 tidak ada yang mendengarkan.
  const badPool = createPool('postgres://bagus@127.0.0.1:1/tokoku_test');
  try {
    const res = await request(createApp({ pool: badPool })).get('/health');
    assert.equal(res.status, 503);
    assert.deepEqual(res.body, { status: 'error' });
  } finally {
    await badPool.end();
  }
});
