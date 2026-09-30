CREATE TABLE products (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  category   TEXT NOT NULL,
  price      INTEGER NOT NULL CHECK (price >= 0), -- rupiah, tanpa desimal
  stock      INTEGER NOT NULL CHECK (stock >= 0),
  image      TEXT NOT NULL,                       -- nama file di public/images
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
