-- ============================================================
-- SteelFlow — DDL-скрипт ініціалізації бази даних
-- База даних: steelflow_db (PostgreSQL)
-- Нормалізація: 3NF
-- ============================================================

-- Видаляємо таблиці у зворотному порядку залежностей (якщо існують)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders      CASCADE;
DROP TABLE IF EXISTS products    CASCADE;
DROP TABLE IF EXISTS categories  CASCADE;
DROP TABLE IF EXISTS clients     CASCADE;
DROP TABLE IF EXISTS employees   CASCADE;

-- ============================================================
-- 1. Категорії металу
-- ============================================================
CREATE TABLE categories (
    category_id   SERIAL       PRIMARY KEY,
    name          VARCHAR(100) NOT NULL UNIQUE,
    description   TEXT
);

COMMENT ON TABLE  categories              IS 'Довідник категорій металопродукції';
COMMENT ON COLUMN categories.name         IS 'Назва категорії (наприклад: Арматура, Труби, Листовий прокат)';
COMMENT ON COLUMN categories.description  IS 'Опис категорії';

-- ============================================================
-- 2. Товари (металопродукція)
-- ============================================================
CREATE TABLE products (
    product_id     SERIAL        PRIMARY KEY,
    category_id    INT           NOT NULL,
    name           VARCHAR(200)  NOT NULL,
    unit           VARCHAR(20)   NOT NULL DEFAULT 'кг',
    price_per_unit NUMERIC(12,2) NOT NULL,
    stock_quantity NUMERIC(12,3) NOT NULL DEFAULT 0,

    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id)
        REFERENCES categories (category_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_products_price
        CHECK (price_per_unit >= 0),

    CONSTRAINT chk_products_stock
        CHECK (stock_quantity >= 0)
);

COMMENT ON TABLE  products                IS 'Каталог металопродукції';
COMMENT ON COLUMN products.unit           IS 'Одиниця виміру: кг, т, м, шт тощо';
COMMENT ON COLUMN products.price_per_unit IS 'Поточна ціна за одиницю (грн)';
COMMENT ON COLUMN products.stock_quantity IS 'Залишок на складі';

CREATE INDEX idx_products_category ON products (category_id);

-- ============================================================
-- 3. Працівники
-- ============================================================
CREATE TABLE employees (
    employee_id SERIAL       PRIMARY KEY,
    first_name  VARCHAR(100) NOT NULL,
    last_name   VARCHAR(100) NOT NULL,
    position    VARCHAR(100) NOT NULL,
    phone       VARCHAR(20),
    hire_date   DATE         NOT NULL DEFAULT CURRENT_DATE
);

COMMENT ON TABLE  employees           IS 'Працівники металобази';
COMMENT ON COLUMN employees.position  IS 'Посада: менеджер, комірник, бухгалтер тощо';

-- ============================================================
-- 4. Клієнти
-- ============================================================
CREATE TABLE clients (
    client_id      SERIAL       PRIMARY KEY,
    company_name   VARCHAR(200) NOT NULL,
    contact_person VARCHAR(200),
    phone          VARCHAR(20),
    email          VARCHAR(100),
    discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,

    CONSTRAINT chk_clients_discount
        CHECK (discount_percent >= 0 AND discount_percent <= 100)
);

COMMENT ON TABLE  clients                    IS 'Клієнти металобази';
COMMENT ON COLUMN clients.discount_percent   IS 'Персональний відсоток знижки для постійного клієнта (0–100)';

-- ============================================================
-- 5. Замовлення
-- ============================================================
CREATE TABLE orders (
    order_id     SERIAL         PRIMARY KEY,
    client_id    INT            NOT NULL,
    employee_id  INT            NOT NULL,
    order_date   TIMESTAMP      NOT NULL DEFAULT NOW(),
    total_amount NUMERIC(14,2)  NOT NULL DEFAULT 0,
    status       VARCHAR(30)    NOT NULL DEFAULT 'нове',

    CONSTRAINT fk_orders_client
        FOREIGN KEY (client_id)
        REFERENCES clients (client_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_orders_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees (employee_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_orders_total
        CHECK (total_amount >= 0),

    CONSTRAINT chk_orders_status
        CHECK (status IN ('нове', 'в обробці', 'завершено', 'скасовано'))
);

COMMENT ON TABLE  orders              IS 'Замовлення клієнтів';
COMMENT ON COLUMN orders.total_amount IS 'Фінальна сума замовлення з урахуванням знижки (грн)';
COMMENT ON COLUMN orders.status       IS 'Статус: нове, в обробці, завершено, скасовано';

CREATE INDEX idx_orders_client   ON orders (client_id);
CREATE INDEX idx_orders_employee ON orders (employee_id);
CREATE INDEX idx_orders_date     ON orders (order_date);

-- ============================================================
-- 6. Позиції замовлення (деталізація)
-- ============================================================
CREATE TABLE order_items (
    order_item_id    SERIAL        PRIMARY KEY,
    order_id         INT           NOT NULL,
    product_id       INT           NOT NULL,
    quantity         NUMERIC(12,3) NOT NULL,
    unit_price       NUMERIC(12,2) NOT NULL,
    discount_percent NUMERIC(5,2)  NOT NULL DEFAULT 0,
    line_total       NUMERIC(14,2) NOT NULL,

    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id)
        REFERENCES orders (order_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_order_items_product
        FOREIGN KEY (product_id)
        REFERENCES products (product_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_order_items_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_order_items_price
        CHECK (unit_price >= 0),

    CONSTRAINT chk_order_items_discount
        CHECK (discount_percent >= 0 AND discount_percent <= 100),

    CONSTRAINT chk_order_items_total
        CHECK (line_total >= 0)
);

COMMENT ON TABLE  order_items                    IS 'Позиції (рядки) замовлення';
COMMENT ON COLUMN order_items.unit_price         IS 'Зафіксована ціна за одиницю на момент продажу (грн)';
COMMENT ON COLUMN order_items.discount_percent   IS 'Знижка клієнта, зафіксована на момент оформлення (%)';
COMMENT ON COLUMN order_items.line_total         IS 'Вартість позиції = quantity × unit_price × (1 - discount_percent/100)';

CREATE INDEX idx_order_items_order   ON order_items (order_id);
CREATE INDEX idx_order_items_product ON order_items (product_id);

-- ============================================================
-- Готово! Усі таблиці створено.
-- ============================================================
