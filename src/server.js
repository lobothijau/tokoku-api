import { loadConfig } from './config.js';
import { createPool } from './db.js';
import { createApp } from './app.js';

let config;
try {
  config = loadConfig();
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}

const pool = createPool(config.databaseUrl);
const app = createApp({ pool });

const server = app.listen(config.port, config.host, () => {
  console.log(
    `tokoku-api berjalan di http://${config.host}:${config.port} (${config.nodeEnv})`,
  );
});

// Shutdown rapi: berhenti menerima koneksi baru, tutup pool database, keluar.
function shutdown(signal) {
  console.log(`${signal} diterima, menutup server...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  // Putuskan koneksi keep-alive yang menganggur agar close() tidak menggantung.
  server.closeIdleConnections();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
