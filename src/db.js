import pg from 'pg';

// Membuat connection pool ke PostgreSQL.
export function createPool(connectionString) {
  return new pg.Pool({
    connectionString,
    // Gagal cepat kalau database tidak bisa dijangkau (dipakai /health).
    connectionTimeoutMillis: 2000,
  });
}

// Menjalankan fn di dalam satu transaksi.
// COMMIT kalau sukses, ROLLBACK kalau ada error.
export async function withTransaction(pool, fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
