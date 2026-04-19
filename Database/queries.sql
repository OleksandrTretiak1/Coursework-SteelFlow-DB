-- ============================================================
-- SteelFlow — 27 SQL-запитів для курсової роботи
-- Виконувати в pgAdmin після seed.sql
-- ============================================================

-- 1. Простий запит на вибірку
SELECT product_id, name, price_per_unit, stock_quantity
FROM products
ORDER BY product_id;

-- 2. Запит з використанням BETWEEN...AND
SELECT name, price_per_unit
FROM products
WHERE price_per_unit BETWEEN 20000 AND 25000;

-- 3. Запит з використанням IN
SELECT name, description
FROM categories
WHERE name IN ('Арматура', 'Труби', 'Кутики');

-- 4. Запит з використанням LIKE
SELECT product_id, name, price_per_unit
FROM products
WHERE name LIKE '%труба%' OR name LIKE '%Труба%';

-- 5. Запит з двома умовами через AND
SELECT name, price_per_unit, stock_quantity
FROM products
WHERE price_per_unit > 20000 AND stock_quantity > 5;

-- 6. Запит з двома умовами через OR
SELECT first_name, last_name, position
FROM employees
WHERE position = 'менеджер з продажу' OR position = 'комірник';

-- 7. Запит з використанням DISTINCT
SELECT DISTINCT unit
FROM products;

-- 8. Запит з функцією MIN / MAX
SELECT MAX(price_per_unit) AS max_price,
       MIN(price_per_unit) AS min_price
FROM products;

-- 9. Запит з функцією SUM / AVG
SELECT SUM(total_amount) AS total_revenue,
       AVG(total_amount) AS avg_order
FROM orders
WHERE status = 'завершено';

-- 10. Запит з функцією COUNT
SELECT COUNT(*) AS total_products
FROM products;

-- 11. Агрегатна функція з виведенням декількох полів
SELECT category_id,
       COUNT(*) AS product_count,
       AVG(price_per_unit) AS avg_price
FROM products
GROUP BY category_id;

-- 12. Агрегатна функція з умовою на вибірку поля
SELECT category_id,
       SUM(stock_quantity) AS total_stock
FROM products
WHERE unit = 'т'
GROUP BY category_id;

-- 13. Агрегатна функція з умовою на агрегатну функцію (HAVING)
SELECT client_id,
       COUNT(*) AS order_count
FROM orders
GROUP BY client_id
HAVING COUNT(*) > 1;

-- 14. Агрегатна функція + HAVING + WHERE + ORDER BY
SELECT client_id,
       COUNT(*) AS order_count,
       SUM(total_amount) AS total_spent
FROM orders
WHERE status = 'завершено'
GROUP BY client_id
HAVING SUM(total_amount) > 50000
ORDER BY total_spent DESC;

-- 15. INNER JOIN
SELECT p.name AS product_name,
       c.name AS category_name,
       p.price_per_unit
FROM products p
INNER JOIN categories c ON p.category_id = c.category_id;

-- 16. LEFT JOIN
SELECT c.name AS category_name,
       p.name AS product_name
FROM categories c
LEFT JOIN products p ON c.category_id = p.category_id;

-- 17. RIGHT JOIN
SELECT p.name AS product_name,
       c.name AS category_name
FROM products p
RIGHT JOIN categories c ON p.category_id = c.category_id;

-- 18. INNER JOIN з умовою
SELECT o.order_id,
       cl.company_name,
       o.total_amount,
       o.status
FROM orders o
INNER JOIN clients cl ON o.client_id = cl.client_id
WHERE o.status = 'завершено';

-- 19. INNER JOIN з умовою LIKE
SELECT o.order_id,
       cl.company_name,
       o.total_amount
FROM orders o
INNER JOIN clients cl ON o.client_id = cl.client_id
WHERE cl.company_name LIKE '%ТОВ%';

-- 20. INNER JOIN з агрегатною функцією
SELECT cl.company_name,
       COUNT(o.order_id) AS order_count,
       SUM(o.total_amount) AS total_spent
FROM clients cl
INNER JOIN orders o ON cl.client_id = o.client_id
GROUP BY cl.company_name;

-- 21. INNER JOIN з агрегатною функцією та HAVING
SELECT cl.company_name,
       SUM(o.total_amount) AS total_spent
FROM clients cl
INNER JOIN orders o ON cl.client_id = o.client_id
GROUP BY cl.company_name
HAVING SUM(o.total_amount) > 50000;

-- 22. Підзапит з використанням > 
SELECT name, price_per_unit
FROM products
WHERE price_per_unit > (SELECT AVG(price_per_unit) FROM products);

-- 23. Підзапит з агрегатною функцією
SELECT company_name, discount_percent
FROM clients
WHERE discount_percent = (SELECT MAX(discount_percent) FROM clients);

-- 24. Підзапит з використанням EXISTS
SELECT first_name, last_name, position
FROM employees e
WHERE EXISTS (
    SELECT 1 FROM orders o WHERE o.employee_id = e.employee_id
);

-- 25. Підзапит з використанням ANY
SELECT name, price_per_unit
FROM products
WHERE price_per_unit > ANY (
    SELECT AVG(price_per_unit) FROM products GROUP BY category_id
);

-- 26. Підзапит з використанням IN
SELECT company_name, contact_person
FROM clients
WHERE client_id IN (
    SELECT DISTINCT client_id FROM orders WHERE status = 'завершено'
);

-- 27. Підзапит зі зв'язком INNER JOIN
SELECT p.name AS product_name,
       c.name AS category_name,
       p.price_per_unit
FROM products p
INNER JOIN categories c ON p.category_id = c.category_id
WHERE p.product_id IN (
    SELECT oi.product_id
    FROM order_items oi
    INNER JOIN orders o ON oi.order_id = o.order_id
    WHERE o.status = 'завершено'
);
