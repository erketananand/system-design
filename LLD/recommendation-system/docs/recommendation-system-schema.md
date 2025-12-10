# RECOMMENDATION SYSTEM - DATABASE SCHEMA

## Table: users

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| name | VARCHAR(255) | NOT NULL | User's name |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update time |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `name`

---

## Table: user_attributes

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| user_id | VARCHAR(36) | NOT NULL | Foreign key to users |
| attribute_key | VARCHAR(255) | NOT NULL | Attribute name |
| attribute_value | TEXT | NOT NULL | Attribute value |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Record creation time |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY: `user_id` REFERENCES `users(id)` ON DELETE CASCADE
- INDEX on `user_id`
- INDEX on `attribute_key`
- UNIQUE INDEX on (`user_id`, `attribute_key`)

---

## Table: items

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| name | VARCHAR(255) | NOT NULL | Item's name |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update time |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `name`

---

## Table: item_attributes

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| item_id | VARCHAR(36) | NOT NULL | Foreign key to items |
| attribute_key | VARCHAR(255) | NOT NULL | Attribute name |
| attribute_value | TEXT | NOT NULL | Attribute value |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Record creation time |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY: `item_id` REFERENCES `items(id)` ON DELETE CASCADE
- INDEX on `item_id`
- INDEX on `attribute_key`
- UNIQUE INDEX on (`item_id`, `attribute_key`)

---

## Table: item_tags

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| item_id | VARCHAR(36) | NOT NULL | Foreign key to items |
| tag | VARCHAR(255) | NOT NULL | Tag name |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Record creation time |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY: `item_id` REFERENCES `items(id)` ON DELETE CASCADE
- INDEX on `item_id`
- INDEX on `tag`
- UNIQUE INDEX on (`item_id`, `tag`)

---

## Table: interactions

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| user_id | VARCHAR(36) | NOT NULL | Foreign key to users |
| item_id | VARCHAR(36) | NOT NULL | Foreign key to items |
| interaction_type | ENUM('VIEW', 'CLICK', 'LIKE', 'DISLIKE', 'RATING', 'PURCHASE') | NOT NULL | Type of interaction |
| weight | DECIMAL(5,2) | NOT NULL, DEFAULT 1.0, CHECK (weight >= 0 AND weight <= 5.0) | Interaction weight/rating |
| timestamp | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | When interaction occurred |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY: `user_id` REFERENCES `users(id)` ON DELETE CASCADE
- FOREIGN KEY: `item_id` REFERENCES `items(id)` ON DELETE CASCADE
- INDEX on `user_id`
- INDEX on `item_id`
- INDEX on `interaction_type`
- INDEX on `timestamp`
- COMPOSITE INDEX on (`user_id`, `item_id`)
- COMPOSITE INDEX on (`user_id`, `timestamp`)

---

## Table: interaction_metadata

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| interaction_id | VARCHAR(36) | NOT NULL | Foreign key to interactions |
| metadata_key | VARCHAR(255) | NOT NULL | Metadata key |
| metadata_value | TEXT | NOT NULL | Metadata value |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Record creation time |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY: `interaction_id` REFERENCES `interactions(id)` ON DELETE CASCADE
- INDEX on `interaction_id`
- INDEX on `metadata_key`

---

## Table: recommendations

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| user_id | VARCHAR(36) | NOT NULL | Foreign key to users |
| item_id | VARCHAR(36) | NOT NULL | Foreign key to items |
| score | DECIMAL(10,6) | NOT NULL, CHECK (score >= 0 AND score <= 1.0) | Recommendation score |
| strategy_name | VARCHAR(100) | NOT NULL | Strategy used for recommendation |
| generated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | When recommendation was generated |
| expires_at | TIMESTAMP | NULL | Cache expiration time |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY: `user_id` REFERENCES `users(id)` ON DELETE CASCADE
- FOREIGN KEY: `item_id` REFERENCES `items(id)` ON DELETE CASCADE
- INDEX on `user_id`
- INDEX on `strategy_name`
- INDEX on `generated_at`
- INDEX on `expires_at`
- COMPOSITE INDEX on (`user_id`, `strategy_name`, `generated_at`)

---

## Table: similarity_cache

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| entity_type | ENUM('USER', 'ITEM') | NOT NULL | Type of entity |
| entity_id_a | VARCHAR(36) | NOT NULL | First entity ID |
| entity_id_b | VARCHAR(36) | NOT NULL | Second entity ID |
| metric | ENUM('COSINE', 'JACCARD', 'EUCLIDEAN') | NOT NULL | Similarity metric used |
| score | DECIMAL(10,6) | NOT NULL, CHECK (score >= -1.0 AND score <= 1.0) | Similarity score |
| computed_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | When similarity was computed |
| expires_at | TIMESTAMP | NULL | Cache expiration time |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `entity_type`
- INDEX on `metric`
- INDEX on `computed_at`
- INDEX on `expires_at`
- UNIQUE INDEX on (`entity_type`, `entity_id_a`, `entity_id_b`, `metric`)
- COMPOSITE INDEX on (`entity_type`, `entity_id_a`, `metric`)

---

## Relationships

### One-to-Many Relationships:

- **users (1) → (M) user_attributes**
  - One user can have multiple attributes
  - CASCADE DELETE: When user is deleted, all attributes are deleted

- **items (1) → (M) item_attributes**
  - One item can have multiple attributes
  - CASCADE DELETE: When item is deleted, all attributes are deleted

- **items (1) → (M) item_tags**
  - One item can have multiple tags
  - CASCADE DELETE: When item is deleted, all tags are deleted

- **users (1) → (M) interactions**
  - One user can have multiple interactions
  - CASCADE DELETE: When user is deleted, all interactions are deleted

- **items (1) → (M) interactions**
  - One item can be interacted with by multiple users
  - CASCADE DELETE: When item is deleted, all interactions are deleted

- **interactions (1) → (M) interaction_metadata**
  - One interaction can have multiple metadata entries
  - CASCADE DELETE: When interaction is deleted, all metadata is deleted

- **users (1) → (M) recommendations**
  - One user can have multiple recommendations
  - CASCADE DELETE: When user is deleted, all recommendations are deleted

- **items (1) → (M) recommendations**
  - One item can be recommended to multiple users
  - CASCADE DELETE: When item is deleted, all recommendations are deleted

### Many-to-Many Relationships:

- **users (M) ↔ (N) items** (through interactions table)
  - Many users can interact with many items
  - The interactions table serves as the junction table

---

## Normalization

This schema is normalized to **Third Normal Form (3NF)**:

### 1NF (First Normal Form):
- All tables have primary keys
- All columns contain atomic values (no repeating groups)
- Each column contains values of a single type

### 2NF (Second Normal Form):
- All non-key attributes are fully dependent on the primary key
- No partial dependencies exist

### 3NF (Third Normal Form):
- No transitive dependencies
- All non-key attributes depend only on the primary key
- Attributes like `user_attributes` and `item_attributes` are separated to avoid repeating groups

---

## Entity-Attribute-Value (EAV) Pattern

The schema uses **EAV pattern** for flexible attributes:

- `user_attributes`: Stores user-specific attributes dynamically
- `item_attributes`: Stores item-specific attributes dynamically
- `interaction_metadata`: Stores interaction-specific metadata dynamically

**Benefits:**
- Domain-agnostic design (works for any item type)
- Easy to add new attributes without schema changes
- Flexible querying based on attribute keys and values

**Trade-offs:**
- Slightly more complex queries (JOIN required)
- Attribute validation must be done at application layer

---

## Performance Considerations

### Indexes Strategy:

1. **Primary Keys**: All tables have UUID primary keys for distributed systems compatibility
2. **Foreign Keys**: All foreign keys have indexes for fast JOIN operations
3. **Composite Indexes**: Used for common query patterns:
   - `(user_id, item_id)` in interactions for finding user-item pairs
   - `(user_id, timestamp)` for temporal user activity queries
   - `(user_id, strategy_name, generated_at)` for recommendation retrieval

### Query Optimization:

- Use `interactions` table indexes for:
  - Finding all interactions by user: `SELECT * FROM interactions WHERE user_id = ?`
  - Finding all interactions for an item: `SELECT * FROM interactions WHERE item_id = ?`
  - Temporal queries: `SELECT * FROM interactions WHERE user_id = ? AND timestamp > ?`

- Use `item_tags` for tag-based filtering:
  - `SELECT item_id FROM item_tags WHERE tag = ?`

---

## Cache Tables

### recommendations
- Acts as a persistent cache for generated recommendations
- `expires_at` field allows TTL-based cache invalidation
- Reduces computation for frequently requested recommendations

### similarity_cache
- Stores pre-computed similarity scores
- Avoids expensive similarity computations
- `expires_at` allows periodic recalculation

---

## Data Constraints

### Data Integrity:
- All foreign keys have CASCADE DELETE to maintain referential integrity
- UNIQUE constraints prevent duplicate attribute keys per entity
- CHECK constraints ensure valid ranges for weights and scores

### Business Rules:
- Interaction weight: 0.0 to 5.0 (supports ratings)
- Recommendation score: 0.0 to 1.0 (normalized)
- Similarity score: -1.0 to 1.0 (supports negative correlations)

---

## Migration Considerations

### From In-Memory to Database:

1. **Data Migration**: Export in-memory Maps to SQL INSERT statements
2. **Connection Pooling**: Add database connection management
3. **Transaction Support**: Wrap multi-table operations in transactions
4. **Query Builder**: Consider using ORM (TypeORM, Prisma) or query builder

### Future Scalability:

- Add **partitioning** on `interactions` table by `timestamp` (time-series data)
- Add **sharding** on `users` and `items` tables by `id` hash
- Move `similarity_cache` to Redis for faster access
- Move `recommendations` cache to Redis with TTL

---

**Schema Version:** 1.0  
**Database Engine:** MySQL 8.0+ / PostgreSQL 12+  
**Character Set:** UTF8MB4  
**Collation:** utf8mb4_unicode_ci
