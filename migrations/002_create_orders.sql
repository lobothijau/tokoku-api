CREATE TABLE orders (
  id         SERIAL PRIMARY KEY,
  total      INTEGER NOT NULL CHECK (total >= 0), -- rupiah
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  order_id   INTEGER NOT NULL REFERENCES orders (id),
  product_id INTEGER NOT NULL REFERENCES products (id),
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0), -- harga saat dibeli
  PRIMARY KEY (order_id, product_id)
);
