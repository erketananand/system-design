# SQL Transaction Isolation Levels

## Read Uncommitted

**Characteristics:** Allows dirty reads; transactions can see uncommitted changes from other transactions.

| Time | Transaction T1 (READ UNCOMMITTED) Action | Transaction T2 (READ COMMITTED) Action | DB State (Committed) ACC001:Balance | T1 View ACC001:Balance | T2 View ACC001:Balance | Notes |
|------|------------------------------------------|----------------------------------------|-------------------------------------|------------------------|------------------------|-------|
| T0   | BEGIN TRANSACTION;                       |                                        | 1000                                |                        |                        | T1 starts. |
| T1   | SELECT Balance FROM Accounts WHERE AccountNumber = 'ACC001'; |            | 1000                                | 1000 (reads latest committed)      |                        | T1 reads the initial balance. |
| T2   |                                          | BEGIN TRANSACTION;                     | 1000                                | 1000                    |                        | T2 starts. |
| T3   |                                          | UPDATE Accounts SET Balance = Balance - 200 WHERE AccountNumber = 'ACC001'; | 1000 | 1000 | 800 (uncommitted) | T2 updates balance to 800 and holds an exclusive lock. |
| T4   | SELECT Balance FROM Accounts WHERE AccountNumber = 'ACC001'; |            | 1000                                | 800 (dirty read)       | 800 (uncommitted)      | T1 reads T2’s uncommitted change. |
| T5   |                                          | ROLLBACK;                             | 1000                                | 800                    |                        | T2 rolls back; balance reverts to 1000 and lock is released. |
| T6   | SELECT Balance FROM Accounts WHERE AccountNumber = 'ACC001'; |            | 1000                                | 1000 (reads latest committed)      |                        | T1 now sees 1000 again, showing inconsistency. |
| T7   | COMMIT;                                  |                                        | 1000                                |                        |                        | T1 commits. |

---

## Read Committed

**Characteristics:** Prevents dirty reads but allows non-repeatable reads and phantom reads.

| Time | T1 (READ COMMITTED) | T2 (READ COMMITTED) | T3 (READ COMMITTED) | DB State R50 / R51 | T1 State (READ COMMITTED) | T2 State | T3 State | Notes |
|------|---------------------|---------------------|---------------------|--------------------|---------------------------|----------|----------|-------|
| T0   | BEGIN TRANSACTION;  |                     |                     | R50: 100 / R51: NA | N/A (no initial snapshot) |          |          | T1 starts. |
| T1   | SELECT price FROM product WHERE id >= 50; | BEGIN TRANSACTION; |                   | R50: 100 / R51: NA | R50: 100, R51: NA |          |          | T1 reads R50=100; T2 starts. |
| T2   |                     | UPDATE product SET price = price + 50 WHERE id = 50; | | R50: 100 / R51: NA | R50: 100, R51: NA | Updates R50 to 150 (uncommitted) | | T2 updates R50 and locks it. |
| T3   |                     | INSERT INTO product (id, price) VALUES (51, 50); | | R50: 100 / R51: NA | R50: 100, R51: NA | Inserts R51 (uncommitted) | | T2 inserts R51 and locks it. |
| T4   |                     | COMMIT;            |                     | R50: 150 / R51: 50 | R50: 100, R51: NA         |          |          | T2 commits; R50=150, R51=50 in DB. |
| T5   | SELECT price FROM product WHERE id >= 50; |                     |                   | R50: 150 / R51: 50 | R50: 150, R51: 50 |          |          | T1 now sees updated R50 and new R51 (non-repeatable and phantom reads). |
| T6   | UPDATE product SET price = price + 50 WHERE id = 50; | | BEGIN TRANSACTION; | R50: 150 / R51: 50 | R50: 200 (uncommitted), R51: 50 | | | T1 updates R50 to 200 and locks; T3 starts. |
| T7   | SELECT price FROM product WHERE id >= 50; |                     | UPDATE product SET price = price + 50 WHERE id = 50; | R50: 150 / R51: 50 | R50: 200, R51: 50 | | Blocked | T3 blocks waiting for T1’s lock. |
| T8   | COMMIT;            |                     |                     | R50: 200 / R51: 50 |                           |          | Reads 200, calculates 250 | T1 commits; T3 continues. |
| T9   |                     |                     | COMMIT;             | R50: 250 / R51: 50 |                           |          |          | T3 commits; R50=250. |

---

## Repeatable Read

**Characteristics:** Prevents dirty and non-repeatable reads; phantom reads can still occur.

| Time | T1 (REPEATABLE READ) | T2 (READ COMMITTED) | T3 (READ COMMITTED) | DB State R50 / R51 | T1 Snapshot State | T2 State | T3 State | Notes |
|------|----------------------|---------------------|---------------------|--------------------|-------------------|----------|----------|-------|
| T0   | BEGIN TRANSACTION;   |                     |                     | R50: 100 / R51: NA | R50: 100, R51: NA |          |          | T1 takes a consistent snapshot. |
| T1   | SELECT price FROM product WHERE id >= 50; | BEGIN TRANSACTION; | | R50: 100 / R51: NA | R50: 100, R51: NA | | | T1 reads using snapshot; T2 starts. |
| T2   |                      | UPDATE product SET price = price + 50 WHERE id = 50; | | R50: 100 / R51: NA | R50: 100, R51: NA | Updates R50 to 150 (uncommitted) | | T2 updates R50. |
| T3   |                      | INSERT INTO product (id, price) VALUES (51, 50); | | R50: 100 / R51: NA | R50: 100, R51: NA | Inserts R51 (uncommitted) | | T2 inserts R51. |
| T4   |                      | COMMIT;            |                     | R50: 150 / R51: 50 | R50: 100, R51: NA |          |          | T2 commits; DB updated. |
| T5   | SELECT price FROM product WHERE id >= 50; |                     |                   | R50: 150 / R51: 50 | R50: 100, R51: 50 |          |          | T1 still sees R50=100 (snapshot) but sees new R51=50 (phantom). |
| T6   | UPDATE product SET price = price + 50 WHERE id = 50; | | BEGIN TRANSACTION; | R50: 150 / R51: 50 | R50: 200 (uncommitted), R51: 50 | | | T1 updates R50 to 200; T3 starts. |
| T7   | SELECT price FROM product WHERE id >= 50; |                     | UPDATE product SET price = price + 50 WHERE id = 50; | R50: 150 / R51: 50 | R50: 200, R51: 50 | | Blocked | T3 blocks on R50. |
| T8   | COMMIT;            |                     |                     | R50: 200 / R51: 50 |                   |          | Reads 200, calculates 250 | T1 commits; T3 proceeds. |
| T9   |                      |                     | COMMIT;             | R50: 250 / R51: 50 |                   |          |          | T3 commits. |

---

## Serializable

**Characteristics:** Highest isolation level; prevents dirty, non-repeatable, and phantom reads via range locks.[web:20]

| Time | T1 (SERIALIZABLE) | T2 (READ COMMITTED) | T3 (READ COMMITTED) | DB State (id/name/category) | T1 View | T2 View | T3 View | Notes |
|------|-------------------|---------------------|---------------------|-----------------------------|---------|---------|---------|-------|
| T0   | BEGIN TRANSACTION; |                    |                     | 1/Laptop/Elec, 2/Smartphone/Elec |         |         |         | T1 starts in SERIALIZABLE mode. |
| T1   | SELECT COUNT(*) FROM products WHERE category = 'Electronics'; | BEGIN TRANSACTION; | BEGIN TRANSACTION; | 1/Laptop/Elec, 2/Smartphone/Elec | Count: 2 |         |         | T1 counts 2 and acquires range lock on Electronics. |
| T2   |                   | INSERT INTO products (id, name, category) VALUES (4, 'Tablet', 'Electronics'); | INSERT INTO products (id, name, category) VALUES (3, 'Plate', 'Utensils'); | 1/Laptop/Elec, 2/Smartphone/Elec | Count: 2 | Blocked | 3/Plate/Utensils (uncommitted) | T2 blocked by range lock; T3 inserts in another category. |
| T4   |                   |                     | COMMIT;             | 1/Laptop/Elec, 2/Smartphone/Elec, 3/Plate/Utensils | Count: 2 | Blocked |         | T3 commits; Electronics range unaffected. |
| T5   | SELECT COUNT(*) FROM products WHERE category = 'Electronics'; | | | 1/Laptop/Elec, 2/Smartphone/Elec, 3/Plate/Utensils | Count: 2 | Blocked | | T1 still sees 2; no phantom reads. |
| T6   | COMMIT;            |                     |                     | 1/Laptop/Elec, 2/Smartphone/Elec, 3/Plate/Utensils |         | Blocked |         | T1 commits; releases range lock. |
| T7   |                   | INSERT proceeds     |                     | 1/Laptop/Elec, 2/Smartphone/Elec, 3/Plate/Utensils |         | 4/Tablet/Elec (uncommitted) | | T2’s insert now executes. |
| T8   |                   | COMMIT;            |                     | 1/Laptop/Elec, 2/Smartphone/Elec, 3/Plate/Utensils, 4/Tablet/Elec | | | | T2 commits; Tablet is added. |

---
