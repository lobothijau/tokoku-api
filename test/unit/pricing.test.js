import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lineSubtotal, orderTotal } from '../../src/pricing.js';

test('lineSubtotal mengalikan harga dengan jumlah', () => {
  assert.equal(lineSubtotal(12500, 3), 37500);
});

test('orderTotal menjumlahkan semua subtotal', () => {
  const lines = [{ subtotal: 37500 }, { subtotal: 6000 }];
  assert.equal(orderTotal(lines), 43500);
});

test('orderTotal untuk daftar kosong adalah 0', () => {
  assert.equal(orderTotal([]), 0);
});
