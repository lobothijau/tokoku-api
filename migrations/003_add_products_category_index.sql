-- Index supaya filter GET /products?category=... cepat.
CREATE INDEX IF NOT EXISTS products_category_idx ON products (category);
