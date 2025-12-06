# STOCK BROKER (ZERODHA) - Database Schema

## Table: users

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| name | VARCHAR(100) | NOT NULL | Full name |
| email | VARCHAR(100) | NOT NULL, UNIQUE | Email address |
| pan | VARCHAR(10) | NOT NULL, UNIQUE | PAN card number |
| bank_account_number | VARCHAR(20) | NOT NULL | Bank account |
| created_at | TIMESTAMP | NOT NULL | Account creation time |
| updated_at | TIMESTAMP | NOT NULL | Last update time |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `email`
- UNIQUE INDEX on `pan`

---

## Table: accounts

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| user_id | VARCHAR(36) | NOT NULL, UNIQUE | User reference |
| balance | DECIMAL(15,2) | NOT NULL, DEFAULT 0.00 | Available balance |
| blocked_amount | DECIMAL(15,2) | NOT NULL, DEFAULT 0.00 | Amount blocked for orders |
| created_at | TIMESTAMP | NOT NULL | Account creation time |
| updated_at | TIMESTAMP | NOT NULL | Last update time |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `user_id`
- FOREIGN KEY: `user_id` REFERENCES `users(id)` ON DELETE CASCADE

**Constraints:**
- CHECK: `balance >= 0`
- CHECK: `blocked_amount >= 0`
- CHECK: `blocked_amount <= balance`

---

## Table: stocks

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| symbol | VARCHAR(20) | PRIMARY KEY | Stock symbol (e.g., RELIANCE) |
| company_name | VARCHAR(200) | NOT NULL | Company full name |
| sector | VARCHAR(100) | NOT NULL | Industry sector |
| last_traded_price | DECIMAL(10,2) | NOT NULL | Current LTP |
| day_open_price | DECIMAL(10,2) | NOT NULL | Opening price |
| day_high_price | DECIMAL(10,2) | NOT NULL | Day's high |
| day_low_price | DECIMAL(10,2) | NOT NULL | Day's low |
| previous_close_price | DECIMAL(10,2) | NOT NULL | Previous close |
| day_volume | BIGINT | NOT NULL, DEFAULT 0 | Trading volume |
| last_updated_at | TIMESTAMP | NOT NULL | Last price update |

**Indexes:**
- PRIMARY KEY on `symbol`
- INDEX on `sector`

**Constraints:**
- CHECK: `last_traded_price > 0`
- CHECK: `day_volume >= 0`

---

## Table: holdings

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| user_id | VARCHAR(36) | NOT NULL | User reference |
| stock_symbol | VARCHAR(20) | NOT NULL | Stock reference |
| quantity | INT | NOT NULL | Number of shares |
| average_buy_price | DECIMAL(10,2) | NOT NULL | Avg purchase price |
| created_at | TIMESTAMP | NOT NULL | Holding creation time |
| updated_at | TIMESTAMP | NOT NULL | Last update time |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on (`user_id`, `stock_symbol`)
- INDEX on `user_id`
- FOREIGN KEY: `user_id` REFERENCES `users(id)` ON DELETE CASCADE
- FOREIGN KEY: `stock_symbol` REFERENCES `stocks(symbol)` ON DELETE RESTRICT

**Constraints:**
- CHECK: `quantity > 0`
- CHECK: `average_buy_price > 0`

---

## Table: portfolios

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| user_id | VARCHAR(36) | NOT NULL, UNIQUE | User reference |
| created_at | TIMESTAMP | NOT NULL | Portfolio creation time |
| updated_at | TIMESTAMP | NOT NULL | Last update time |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `user_id`
- FOREIGN KEY: `user_id` REFERENCES `users(id)` ON DELETE CASCADE

**Note:** Portfolio is a container for holdings. Actual holdings stored in `holdings` table.

---

## Table: orders

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| user_id | VARCHAR(36) | NOT NULL | User reference |
| stock_symbol | VARCHAR(20) | NOT NULL | Stock reference |
| order_type | ENUM | NOT NULL | MARKET, LIMIT, STOP_LOSS, BRACKET, COVER |
| side | ENUM | NOT NULL | BUY, SELL |
| quantity | INT | NOT NULL | Number of shares |
| price | DECIMAL(10,2) | NULL | Limit price (null for MARKET) |
| trigger_price | DECIMAL(10,2) | NULL | Stop-loss trigger price |
| status | ENUM | NOT NULL | PENDING, SENT_TO_EXCHANGE, EXECUTED, CANCELLED, REJECTED |
| validity | ENUM | NOT NULL | DAY, GTC, IOC |
| exchange_order_id | VARCHAR(36) | NULL | Exchange reference ID |
| remarks | TEXT | NULL | Cancellation/rejection reason |
| created_at | TIMESTAMP | NOT NULL | Order placement time |
| updated_at | TIMESTAMP | NOT NULL | Last status update |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `user_id`
- INDEX on `stock_symbol`
- INDEX on `status`
- INDEX on `exchange_order_id`
- INDEX on `created_at`
- FOREIGN KEY: `user_id` REFERENCES `users(id)` ON DELETE CASCADE
- FOREIGN KEY: `stock_symbol` REFERENCES `stocks(symbol)` ON DELETE RESTRICT

**Constraints:**
- CHECK: `quantity > 0`
- CHECK: `price IS NULL OR price > 0`
- CHECK: `trigger_price IS NULL OR trigger_price > 0`

---

## Table: trades

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| user_id | VARCHAR(36) | NOT NULL | User reference |
| order_id | VARCHAR(36) | NOT NULL | Order reference |
| stock_symbol | VARCHAR(20) | NOT NULL | Stock reference |
| side | ENUM | NOT NULL | BUY, SELL |
| quantity | INT | NOT NULL | Number of shares traded |
| price | DECIMAL(10,2) | NOT NULL | Execution price |
| brokerage | DECIMAL(10,2) | NOT NULL | Brokerage charges |
| taxes | DECIMAL(10,2) | NOT NULL | STT + GST + other taxes |
| total_charges | DECIMAL(10,2) | NOT NULL | Total charges |
| executed_at | TIMESTAMP | NOT NULL | Trade execution time |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `user_id`
- INDEX on `order_id`
- INDEX on `stock_symbol`
- INDEX on `executed_at`
- FOREIGN KEY: `user_id` REFERENCES `users(id)` ON DELETE CASCADE
- FOREIGN KEY: `order_id` REFERENCES `orders(id)` ON DELETE CASCADE
- FOREIGN KEY: `stock_symbol` REFERENCES `stocks(symbol)` ON DELETE RESTRICT

**Constraints:**
- CHECK: `quantity > 0`
- CHECK: `price > 0`
- CHECK: `brokerage >= 0`
- CHECK: `taxes >= 0`
- CHECK: `total_charges = brokerage + taxes`

---

## Table: watchlists

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| user_id | VARCHAR(36) | NOT NULL | User reference |
| name | VARCHAR(100) | NOT NULL | Watchlist name |
| created_at | TIMESTAMP | NOT NULL | Creation time |
| updated_at | TIMESTAMP | NOT NULL | Last update time |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `user_id`
- UNIQUE INDEX on (`user_id`, `name`)
- FOREIGN KEY: `user_id` REFERENCES `users(id)` ON DELETE CASCADE

---

## Table: watchlist_stocks

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| watchlist_id | VARCHAR(36) | NOT NULL | Watchlist reference |
| stock_symbol | VARCHAR(20) | NOT NULL | Stock reference |
| added_at | TIMESTAMP | NOT NULL | When stock was added |

**Indexes:**
- PRIMARY KEY on (`watchlist_id`, `stock_symbol`)
- INDEX on `watchlist_id`
- INDEX on `stock_symbol`
- FOREIGN KEY: `watchlist_id` REFERENCES `watchlists(id)` ON DELETE CASCADE
- FOREIGN KEY: `stock_symbol` REFERENCES `stocks(symbol)` ON DELETE CASCADE

---

## Table: transactions

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| user_id | VARCHAR(36) | NOT NULL | User reference |
| type | ENUM | NOT NULL | DEPOSIT, WITHDRAWAL, CHARGE, ADJUSTMENT |
| amount | DECIMAL(15,2) | NOT NULL | Transaction amount |
| description | TEXT | NOT NULL | Transaction details |
| created_at | TIMESTAMP | NOT NULL | Transaction time |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `user_id`
- INDEX on `type`
- INDEX on `created_at`
- FOREIGN KEY: `user_id` REFERENCES `users(id)` ON DELETE CASCADE

**Constraints:**
- CHECK: `amount != 0`

---

## Relationships Summary

### One-to-One (1:1)
- `users` (1) → (1) `accounts`
- `users` (1) → (1) `portfolios`

### One-to-Many (1:M)
- `users` (1) → (M) `orders`
- `users` (1) → (M) `trades`
- `users` (1) → (M) `watchlists`
- `users` (1) → (M) `holdings`
- `users` (1) → (M) `transactions`
- `stocks` (1) → (M) `orders`
- `stocks` (1) → (M) `trades`
- `stocks` (1) → (M) `holdings`
- `orders` (1) → (M) `trades`
- `watchlists` (1) → (M) `watchlist_stocks`

### Many-to-Many (M:N)
- `watchlists` (M) ↔ (N) `stocks` (via `watchlist_stocks` junction table)

---

## Normalization

**Normalization Level:** 3NF (Third Normal Form)

**Key Design Decisions:**
1. **Separate holdings from portfolio**: Holdings table stores individual stock positions
2. **Junction table for watchlists**: `watchlist_stocks` enables M:N relationship
3. **Order-Trade separation**: One order can result in multiple trades (partial fills)
4. **Transaction log**: Separate table for all account balance changes
5. **Denormalized stock prices**: Stock table stores current market data for quick access

**Referential Integrity:**
- CASCADE DELETE: When user deleted, all related data removed
- RESTRICT DELETE: Stocks cannot be deleted if referenced in orders/trades/holdings

---

## Performance Considerations

### Frequently Accessed Queries
1. Get user portfolio with current prices
2. Fetch open orders for a user
3. Retrieve trade history for a user
4. Display watchlist with real-time prices
5. Calculate P&L for holdings

### Optimization Strategy
- Composite indexes on (`user_id`, `stock_symbol`) for holdings
- Indexes on timestamps for time-based queries
- Indexes on status for filtering active orders
- Denormalized current prices in stocks table (updated via background job)

---

✅ **Document Status:** Complete and ready for Implementation phase
