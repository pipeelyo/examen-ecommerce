CREATE SCHEMA IF NOT EXISTS catalog;

CREATE TABLE catalog.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE catalog.products (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  category_id TEXT NOT NULL REFERENCES catalog.categories(id),
  stock INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);
