// Menjalankan file SQL di folder migrations/ secara berurutan.
// File yang sudah pernah dijalankan dicatat di tabel schema_migrations,
// jadi aman dijalankan berkali-kali.

import { readdir, readFile } from 'node:fs/promises';
import { loadConfig } from '../src/config.js';
import { createPool, withTransaction } from '../src/db.js';

const migrationsDir = new URL('../migrations/', import.meta.url);

export async function runMigrations(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const { rows } = await pool.query('SELECT name FROM schema_migrations');
  const applied = new Set(rows.map((row) => row.name));

  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  const newlyApplied = [];
  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = await readFile(new URL(file, migrationsDir), 'utf8');
    // Satu migrasi = satu transaksi: berhasil semua atau batal semua.
    await withTransaction(pool, async (client) => {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [
        file,
      ]);
    });
    console.log(`Migrasi diterapkan: ${file}`);
    newlyApplied.push(file);
  }

  if (newlyApplied.length === 0) console.log('Tidak ada migrasi baru.');
  return newlyApplied;
}

// Hanya jalan kalau file ini dieksekusi langsung (npm run migrate).
if (import.meta.main) {
  const pool = createPool(loadConfig().databaseUrl);
  try {
    await runMigrations(pool);
  } finally {
    await pool.end();
  }
}
