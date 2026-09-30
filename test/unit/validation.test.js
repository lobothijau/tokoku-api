import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateOrder } from '../../src/validation.js';

test('body valid diterima', () => {
  const result = validateOrder({ items: [{ productId: 1, quantity: 2 }] });
  assert.deepEqual(result, { items: [{ productId: 1, quantity: 2 }] });
});

test('body kosong atau tanpa items ditolak', () => {
  assert.ok(validateOrder(undefined).errors);
  assert.ok(validateOrder({}).errors);
  assert.ok(validateOrder({ items: [] }).errors);
  assert.ok(validateOrder({ items: 'abc' }).errors);
});

test('lebih dari 20 item ditolak', () => {
  const items = Array.from({ length: 21 }, (_, i) => ({
    productId: i + 1,
    quantity: 1,
  }));
  assert.ok(validateOrder({ items }).errors);
});

test('productId harus bilangan bulat positif', () => {
  for (const productId of [0, -1, 1.5, '1', null]) {
    const result = validateOrder({ items: [{ productId, quantity: 1 }] });
    assert.ok(result.errors, `productId ${productId} seharusnya ditolak`);
  }
});

test('quantity harus bilangan bulat 1-100', () => {
  for (const quantity of [0, -1, 101, 1.5, '2', undefined]) {
    const result = validateOrder({ items: [{ productId: 1, quantity }] });
    assert.ok(result.errors, `quantity ${quantity} seharusnya ditolak`);
  }
  assert.ok(validateOrder({ items: [{ productId: 1, quantity: 100 }] }).items);
});

test('productId duplikat ditolak', () => {
  const result = validateOrder({
    items: [
      { productId: 1, quantity: 1 },
      { productId: 1, quantity: 2 },
    ],
  });
  assert.ok(result.errors);
});
