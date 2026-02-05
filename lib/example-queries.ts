export enum DatabaseDialect {
  MYSQL = 'mysql',
  POSTGRESQL = 'postgresql',
  SQLITE = 'sqlite',
}

export interface ExampleQuery {
  name: string;
  query: string;
  dialect: DatabaseDialect;
}

export const exampleQueries: ExampleQuery[] = [
  {
    name: 'MySQL',
    query: `CREATE TABLE ecommerce.orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id BIGINT UNSIGNED NOT NULL,
  billing_address_id BIGINT UNSIGNED NOT NULL,
  shipping_address_id BIGINT UNSIGNED NOT NULL,
  payment_method_id INT UNSIGNED NOT NULL,
  status ENUM('pending','paid','shipped','delivered','cancelled','refunded') NOT NULL DEFAULT 'pending',
  order_number VARCHAR(32) NOT NULL,
  external_reference VARCHAR(64) DEFAULT NULL,
  currency CHAR(3) NOT NULL,
  is_gift TINYINT(1) NOT NULL DEFAULT 0,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_orders_order_number (order_number),
  KEY idx_orders_customer_created (customer_id, created_at),
  KEY idx_orders_payment_method (payment_method_id),
  FULLTEXT KEY ft_orders_notes (notes),
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES ecommerce.customers (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_orders_billing_address FOREIGN KEY (billing_address_id) REFERENCES ecommerce.addresses (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_orders_shipping_address FOREIGN KEY (shipping_address_id) REFERENCES ecommerce.addresses (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_orders_payment_method FOREIGN KEY (payment_method_id) REFERENCES ecommerce.payment_methods (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
    dialect: DatabaseDialect.MYSQL,
  },
  {
    name: 'PostgreSQL',
    query: `CREATE TABLE ecommerce.orders (
  id BIGINT NOT NULL,
  customer_id BIGINT NOT NULL,
  billing_address_id BIGINT NOT NULL,
  shipping_address_id BIGINT NOT NULL,
  payment_method_id INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','shipped','delivered','cancelled','refunded')),
  order_number VARCHAR(32) NOT NULL,
  external_reference VARCHAR(64) DEFAULT NULL,
  currency CHAR(3) NOT NULL,
  is_gift BOOLEAN NOT NULL DEFAULT false,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uniq_orders_order_number UNIQUE (order_number),
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES ecommerce.customers (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_orders_billing_address FOREIGN KEY (billing_address_id) REFERENCES ecommerce.addresses (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_orders_shipping_address FOREIGN KEY (shipping_address_id) REFERENCES ecommerce.addresses (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_orders_payment_method FOREIGN KEY (payment_method_id) REFERENCES ecommerce.payment_methods (id) ON UPDATE CASCADE ON DELETE RESTRICT
);`,
    dialect: DatabaseDialect.POSTGRESQL,
  },
  {
    name: 'SQLite',
    query: `CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  billing_address_id INTEGER NOT NULL,
  shipping_address_id INTEGER NOT NULL,
  payment_method_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','shipped','delivered','cancelled','refunded')),
  order_number TEXT NOT NULL UNIQUE,
  external_reference TEXT DEFAULT NULL,
  currency TEXT NOT NULL,
  is_gift INTEGER NOT NULL DEFAULT 0,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (billing_address_id) REFERENCES addresses (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (shipping_address_id) REFERENCES addresses (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods (id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX idx_orders_customer_created ON orders (customer_id, created_at);
CREATE INDEX idx_orders_payment_method ON orders (payment_method_id);

CREATE TRIGGER update_orders_updated_at 
AFTER UPDATE ON orders
BEGIN
  UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;`,
    dialect: DatabaseDialect.SQLITE,
  },
];

// Default query (MySQL/MariaDB)
export const DEFAULT_QUERY = exampleQueries[0].query;
