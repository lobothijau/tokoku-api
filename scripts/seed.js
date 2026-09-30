// Mengisi database dengan 12 produk contoh.
// PERHATIAN: semua produk dan pesanan yang ada akan DIHAPUS lebih dulu.

import { loadConfig } from '../src/config.js';
import { createPool } from '../src/db.js';

// [nama, kategori, harga (rupiah), stok, nama file gambar]
const products = [
  ['Kopi Gayo 250g', 'makanan', 85000, 40, 'kopi-gayo-250g.webp'],
  ['Teh Melati Celup', 'makanan', 18000, 120, 'teh-melati-celup.webp'],
  ['Keripik Tempe', 'makanan', 15000, 80, 'keripik-tempe.webp'],
  ['Sambal Bawang Botol', 'makanan', 27500, 60, 'sambal-bawang-botol.webp'],
  ['Mi Instan Goreng', 'makanan', 3500, 500, 'mi-instan-goreng.webp'],
  ['Es Teh Manis Botol', 'minuman', 6000, 200, 'es-teh-manis-botol.webp'],
  ['Jus Jambu 1L', 'minuman', 22000, 50, 'jus-jambu-1l.webp'],
  ['Air Mineral 600ml', 'minuman', 4000, 400, 'air-mineral-600ml.webp'],
  ['Sabun Cuci Piring', 'kebutuhan-rumah', 12500, 90, 'sabun-cuci-piring.webp'],
  [
    'Deterjen Bubuk 800g',
    'kebutuhan-rumah',
    24000,
    70,
    'deterjen-bubuk-800g.webp',
  ],
  ['Tisu Wajah', 'kebutuhan-rumah', 9500, 150, 'tisu-wajah.webp'],
  ['Lampu LED 9 Watt', 'kebutuhan-rumah', 32000, 45, 'lampu-led-9-watt.webp'],
];

export async function seed(pool) {
  await pool.query('TRUNCATE order_items, orders, products RESTART IDENTITY');

  for (const [name, category, price, stock, image] of products) {
    await pool.query(
      `INSERT INTO products (name, category, price, stock, image)
       VALUES ($1, $2, $3, $4, $5)`,
      [name, category, price, stock, image],
    );
  }
  console.log(`Seed selesai: ${products.length} produk.`);
}

if (import.meta.main) {
  const pool = createPool(loadConfig().databaseUrl);
  try {
    await seed(pool);
  } finally {
    await pool.end();
  }
}
