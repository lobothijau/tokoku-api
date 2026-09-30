# Tokoku API

Tokoku adalah API toko online sederhana yang dibuat dengan Node.js, Express 5, dan PostgreSQL. Proyek ini dipakai sebagai contoh dalam kursus video tentang deploy ke VPS dan CI/CD dengan GitHub Actions, jadi kodenya sengaja dibuat singkat dan mudah dibaca.

Fitur: daftar produk, detail produk, pembuatan pesanan (dengan pengecekan dan pengurangan stok dalam satu transaksi), serta endpoint `/health`.

## Prasyarat

- Node.js 24 atau lebih baru
- PostgreSQL (contoh di sini memakai versi 14)

Tidak ada ORM dan tidak ada dotenv. File `.env` dimuat langsung oleh Node lewat `--env-file`.

## Setup lokal

```bash
# 1. Pasang dependensi
npm install

# 2. Buat database
createdb tokoku_dev

# 3. Siapkan environment
cp .env.example .env
# lalu sesuaikan DATABASE_URL di .env

# 4. Buat tabel dan isi data contoh
npm run migrate
npm run seed

# 5. Jalankan server (auto-restart saat file berubah)
npm run dev
```

Buka http://127.0.0.1:3000 untuk melihat halaman depan.

Catatan: `npm run seed` akan **menghapus** semua produk dan pesanan yang ada, lalu mengisi ulang 12 produk contoh. Jangan jalankan di database yang berisi data asli.

## Environment variable

| Nama           | Keterangan                               | Default       |
| -------------- | ---------------------------------------- | ------------- |
| `DATABASE_URL` | Koneksi PostgreSQL (wajib)               | -             |
| `HOST`         | Alamat bind server                       | `127.0.0.1`   |
| `PORT`         | Port server                              | `3000`        |
| `NODE_ENV`     | `development`, `test`, atau `production` | `development` |

Kalau `DATABASE_URL` tidak diatur, aplikasi langsung berhenti dengan pesan error yang jelas.

## Script

| Perintah          | Fungsi                                                   |
| ----------------- | -------------------------------------------------------- |
| `npm start`       | Menjalankan server (memakai environment variable sistem) |
| `npm run dev`     | Menjalankan server dengan `.env` dan `--watch`           |
| `npm run migrate` | Menerapkan file SQL di `migrations/` secara berurutan    |
| `npm run seed`    | Mengisi 12 produk contoh (menghapus data lama)           |
| `npm test`        | Menjalankan unit test dan integration test               |
| `npm run lint`    | Memeriksa kode dengan ESLint                             |
| `npm run format`  | Merapikan kode dengan Prettier                           |

`npm run migrate` aman dijalankan berulang kali. Migrasi yang sudah diterapkan dicatat di tabel `schema_migrations` dan tidak dijalankan lagi.

## Endpoint

| Method | Path            | Keterangan                                                       |
| ------ | --------------- | ---------------------------------------------------------------- |
| GET    | `/health`       | `200 {"status":"ok"}`, atau `503` jika database tidak terjangkau |
| GET    | `/products`     | Daftar produk, bisa difilter dengan `?category=minuman`          |
| GET    | `/products/:id` | Detail produk, `404` jika tidak ada                              |
| POST   | `/orders`       | Membuat pesanan                                                  |
| GET    | `/`             | Halaman depan (file statis di `public/`)                         |

Contoh:

```bash
curl http://127.0.0.1:3000/health
curl http://127.0.0.1:3000/products
curl 'http://127.0.0.1:3000/products?category=minuman'
curl http://127.0.0.1:3000/products/1

curl -X POST http://127.0.0.1:3000/orders \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"productId":1,"quantity":2},{"productId":5,"quantity":10}]}'
```

Aturan `POST /orders`:

- `items` wajib berupa array berisi 1 sampai 20 item.
- `productId` bilangan bulat positif, tidak boleh duplikat. `quantity` bilangan bulat 1 sampai 100.
- Input tidak valid atau produk tidak ada: `400`.
- Stok tidak cukup: `409` (stok tidak berubah sama sekali).
- Berhasil: `201` beserta `total` dalam rupiah (bilangan bulat).

Semua harga adalah rupiah bulat, tanpa desimal.

## Testing

Test memakai PostgreSQL sungguhan, bukan mock. Buat database terpisah dan file `.env.test`:

```bash
createdb tokoku_test
echo 'DATABASE_URL=postgres://user@localhost:5432/tokoku_test' > .env.test
npm test
```

Setiap integration test menjalankan migrasi dan seed terlebih dulu, jadi **jangan** arahkan `.env.test` ke database yang berisi data penting.

## Catatan produksi

- Atur environment variable langsung di server (misalnya lewat systemd), bukan lewat file `.env`: `DATABASE_URL`, `HOST`, `PORT`, dan `NODE_ENV=production`.
- Jalankan dengan `npm start`, setelah `npm run migrate`.
- Aplikasi sebaiknya di-bind ke `127.0.0.1` dan diletakkan di belakang reverse proxy seperti Nginx. Nginx yang menangani domain dan HTTPS. Nginx juga boleh langsung menyajikan folder `public/`.
- Express dikonfigurasi untuk mempercayai proxy dari loopback (`trust proxy`).
- Log ditulis ke stdout, satu baris per request. Kumpulkan dengan journald atau pengelola proses yang Anda pakai.
- Saat menerima `SIGTERM` (atau `SIGINT`), server berhenti menerima koneksi baru, menutup koneksi database, lalu keluar dengan kode 0.
