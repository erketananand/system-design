# PARKING LOT SYSTEM - DATABASE SCHEMA

## Overview
This schema represents a normalized (3NF) relational database design for the Parking Lot System. All tables include timestamps and proper indexing for optimal performance.

---

## Table: parking_lots

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | Unique identifier (UUID) |
| name | VARCHAR(200) | NOT NULL | Parking lot name |
| created_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `name`

**Notes:** Singleton pattern enforced at application level (only one active instance)

---

## Table: floors

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | Unique identifier (UUID) |
| parking_lot_id | VARCHAR(36) | NOT NULL, FOREIGN KEY | Reference to parking_lots(id) |
| floor_number | INT | NOT NULL | Floor number (1, 2, 3...) |
| created_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on (`parking_lot_id`, `floor_number`)
- FOREIGN KEY: `parking_lot_id` REFERENCES `parking_lots(id)` ON DELETE CASCADE

---

## Table: gates

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | Unique identifier (UUID) |
| parking_lot_id | VARCHAR(36) | NOT NULL, FOREIGN KEY | Reference to parking_lots(id) |
| floor_id | VARCHAR(36) | NOT NULL, FOREIGN KEY | Reference to floors(id) |
| gate_number | INT | NOT NULL | Gate number |
| name | VARCHAR(100) | NOT NULL | Gate name |
| gate_type | ENUM('ENTRY', 'EXIT') | NOT NULL | Type of gate |
| created_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `gate_type`
- UNIQUE INDEX on (`parking_lot_id`, `gate_number`)
- FOREIGN KEY: `parking_lot_id` REFERENCES `parking_lots(id)` ON DELETE CASCADE
- FOREIGN KEY: `floor_id` REFERENCES `floors(id)` ON DELETE CASCADE

---

## Table: parking_spots

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | Unique identifier (UUID) |
| floor_id | VARCHAR(36) | NOT NULL, FOREIGN KEY | Reference to floors(id) |
| spot_number | VARCHAR(20) | NOT NULL | Spot number/identifier |
| spot_type | ENUM('COMPACT', 'STANDARD', 'LARGE', 'HANDICAPPED') | NOT NULL | Type of parking spot |
| spot_state | ENUM('AVAILABLE', 'RESERVED', 'OCCUPIED', 'OUT_OF_SERVICE') | NOT NULL DEFAULT 'AVAILABLE' | Current state |
| accessibility_level | ENUM('HIGH', 'MEDIUM', 'LOW') | NOT NULL | Accessibility from entry/exit |
| distance_score | DECIMAL(5,2) | NOT NULL DEFAULT 50.00 | Distance score (0-100) |
| current_vehicle_id | VARCHAR(36) | NULL, FOREIGN KEY | Currently parked vehicle |
| current_ticket_id | VARCHAR(36) | NULL, FOREIGN KEY | Active ticket |
| created_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on (`floor_id`, `spot_number`)
- INDEX on `spot_state`
- INDEX on (`spot_type`, `spot_state`)
- INDEX on (`accessibility_level`, `spot_state`)
- FOREIGN KEY: `floor_id` REFERENCES `floors(id)` ON DELETE CASCADE
- FOREIGN KEY: `current_vehicle_id` REFERENCES `vehicles(id)` ON DELETE SET NULL
- FOREIGN KEY: `current_ticket_id` REFERENCES `tickets(id)` ON DELETE SET NULL

---

## Table: vehicles

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | Unique identifier (UUID) |
| license_plate | VARCHAR(20) | NOT NULL, UNIQUE | Vehicle license plate |
| vehicle_type | ENUM('CAR', 'BIKE', 'TRUCK', 'VAN') | NOT NULL | Type of vehicle |
| color | VARCHAR(50) | NULL | Vehicle color |
| created_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `license_plate`
- INDEX on `vehicle_type`

---

## Table: tickets

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | Unique identifier (UUID) |
| ticket_number | VARCHAR(50) | NOT NULL, UNIQUE | Human-readable ticket number |
| vehicle_id | VARCHAR(36) | NOT NULL, FOREIGN KEY | Reference to vehicles(id) |
| spot_id | VARCHAR(36) | NOT NULL, FOREIGN KEY | Reference to parking_spots(id) |
| entry_gate_id | VARCHAR(36) | NOT NULL, FOREIGN KEY | Reference to gates(id) |
| exit_gate_id | VARCHAR(36) | NULL, FOREIGN KEY | Reference to gates(id) |
| entry_time | TIMESTAMP | NOT NULL | Entry timestamp |
| exit_time | TIMESTAMP | NULL | Exit timestamp |
| expected_duration_hours | DECIMAL(5,2) | NOT NULL | Expected parking duration |
| actual_duration_hours | DECIMAL(5,2) | NULL | Actual parking duration |
| status | ENUM('OPEN', 'CLOSED', 'LOST') | NOT NULL DEFAULT 'OPEN' | Ticket status |
| created_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `ticket_number`
- INDEX on `status`
- INDEX on `entry_time`
- INDEX on (`vehicle_id`, `status`)
- FOREIGN KEY: `vehicle_id` REFERENCES `vehicles(id)` ON DELETE CASCADE
- FOREIGN KEY: `spot_id` REFERENCES `parking_spots(id)` ON DELETE CASCADE
- FOREIGN KEY: `entry_gate_id` REFERENCES `gates(id)` ON DELETE CASCADE
- FOREIGN KEY: `exit_gate_id` REFERENCES `gates(id)` ON DELETE SET NULL

---

## Table: payments

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | Unique identifier (UUID) |
| ticket_id | VARCHAR(36) | NOT NULL, FOREIGN KEY, UNIQUE | Reference to tickets(id) |
| amount | DECIMAL(10,2) | NOT NULL | Total payment amount |
| base_amount | DECIMAL(10,2) | NOT NULL | Base parking fee |
| overstay_penalty | DECIMAL(10,2) | NOT NULL DEFAULT 0.00 | Overstay penalty |
| discounts | DECIMAL(10,2) | NOT NULL DEFAULT 0.00 | Applied discounts |
| status | ENUM('PENDING', 'PAID', 'FAILED') | NOT NULL DEFAULT 'PENDING' | Payment status |
| method | ENUM('CASH', 'CARD', 'WALLET') | NULL | Payment method |
| created_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `ticket_id`
- INDEX on `status`
- INDEX on `created_at`
- FOREIGN KEY: `ticket_id` REFERENCES `tickets(id)` ON DELETE CASCADE

---

## Table: reservations

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | Unique identifier (UUID) |
| vehicle_id | VARCHAR(36) | NOT NULL, FOREIGN KEY | Reference to vehicles(id) |
| spot_id | VARCHAR(36) | NOT NULL, FOREIGN KEY | Reference to parking_spots(id) |
| reserved_from | TIMESTAMP | NOT NULL | Reservation start time |
| reserved_to | TIMESTAMP | NOT NULL | Reservation end time |
| status | ENUM('ACTIVE', 'CANCELLED', 'COMPLETED') | NOT NULL DEFAULT 'ACTIVE' | Reservation status |
| created_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `status`
- INDEX on (`spot_id`, `status`)
- INDEX on (`reserved_from`, `reserved_to`)
- FOREIGN KEY: `vehicle_id` REFERENCES `vehicles(id)` ON DELETE CASCADE
- FOREIGN KEY: `spot_id` REFERENCES `parking_spots(id)` ON DELETE CASCADE

**Constraints:**
- CHECK: `reserved_to > reserved_from`

---

## Table: display_boards

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | Unique identifier (UUID) |
| floor_id | VARCHAR(36) | NOT NULL, FOREIGN KEY, UNIQUE | Reference to floors(id) |
| last_updated_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | Last update timestamp |
| created_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `floor_id`
- FOREIGN KEY: `floor_id` REFERENCES `floors(id)` ON DELETE CASCADE

---

## Table: display_board_data

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | Unique identifier (UUID) |
| display_board_id | VARCHAR(36) | NOT NULL, FOREIGN KEY | Reference to display_boards(id) |
| vehicle_type | ENUM('CAR', 'BIKE', 'TRUCK', 'VAN') | NOT NULL | Vehicle type |
| available_count | INT | NOT NULL DEFAULT 0 | Available spots count |
| updated_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on (`display_board_id`, `vehicle_type`)
- FOREIGN KEY: `display_board_id` REFERENCES `display_boards(id)` ON DELETE CASCADE

---

## Table: admin_users

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | Unique identifier (UUID) |
| name | VARCHAR(100) | NOT NULL | Admin user name |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Email address |
| role | ENUM('SUPER_ADMIN', 'LOT_MANAGER') | NOT NULL | Admin role |
| created_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `email`
- INDEX on `role`

---

## Relationships Summary

### One-to-Many (1:M)
- `parking_lots` (1) → (M) `floors`
- `parking_lots` (1) → (M) `gates`
- `floors` (1) → (M) `parking_spots`
- `vehicles` (1) → (M) `tickets`
- `vehicles` (1) → (M) `reservations`
- `parking_spots` (1) → (M) `tickets`
- `parking_spots` (1) → (M) `reservations`
- `gates` (1) → (M) `tickets` (as entry_gate_id)
- `gates` (1) → (M) `tickets` (as exit_gate_id)
- `display_boards` (1) → (M) `display_board_data`

### One-to-One (1:1)
- `floors` (1) → (1) `display_boards`
- `tickets` (1) → (1) `payments`

### Many-to-Many (M:N)
None (normalized through junction entities where needed)

---

## Normalization Details

### First Normal Form (1NF)
✓ All attributes are atomic (no multi-valued attributes)
✓ Each column contains only one value
✓ Each row is unique (PRIMARY KEY enforced)

### Second Normal Form (2NF)
✓ Meets 1NF requirements
✓ No partial dependencies (all non-key attributes depend on entire PRIMARY KEY)
✓ Composite keys used where appropriate with proper indexing

### Third Normal Form (3NF)
✓ Meets 2NF requirements
✓ No transitive dependencies
✓ `display_board_data` separated from `display_boards` (availability counts depend on vehicle_type)
✓ All foreign key relationships properly established

---

## Key Design Decisions

1. **ENUMs for Type Safety**: Used ENUMs for status fields, types, and levels to ensure data integrity
2. **Soft Deletes**: Can be implemented via `deleted_at` column if needed (not shown for simplicity)
3. **Timestamps**: All tables include `created_at` and `updated_at` for audit trail
4. **UUID Primary Keys**: VARCHAR(36) for distributed system compatibility
5. **Cascading Deletes**: Used strategically (e.g., deleting floor deletes its spots)
6. **SET NULL on Deletes**: Used where relationship should persist but reference can be removed
7. **Display Board Separation**: `display_boards` and `display_board_data` normalized to avoid redundancy

---

## Performance Optimization

### Indexes Strategy
- Primary keys on all tables (clustered index)
- Unique indexes on natural keys (license_plate, ticket_number, email)
- Composite indexes on frequently queried combinations (floor_id + spot_number)
- Status field indexes for filtering active records
- Foreign key indexes for JOIN performance

### Query Optimization Tips
- Use `spot_state` and `spot_type` composite index for availability queries
- Use `accessibility_level` and `spot_state` composite index for duration-aware allocation
- Use `vehicle_id` and `status` composite index for active ticket lookups
- Partition `tickets` and `payments` tables by date for historical data management

---

## Sample Queries

### Find Available Spots by Type and Accessibility
```sql
SELECT ps.* 
FROM parking_spots ps
JOIN floors f ON ps.floor_id = f.id
WHERE ps.spot_type = 'STANDARD'
  AND ps.spot_state = 'AVAILABLE'
  AND ps.accessibility_level = 'HIGH'
ORDER BY ps.distance_score ASC
LIMIT 10;
```

### Calculate Parking Fee (used by application)
```sql
SELECT 
  t.id,
  t.ticket_number,
  v.vehicle_type,
  t.entry_time,
  t.exit_time,
  t.expected_duration_hours,
  TIMESTAMPDIFF(HOUR, t.entry_time, t.exit_time) as actual_hours
FROM tickets t
JOIN vehicles v ON t.vehicle_id = v.id
WHERE t.id = ?;
```

### Get Floor Availability Summary
```sql
SELECT 
  ps.spot_type,
  COUNT(*) as total_spots,
  SUM(CASE WHEN ps.spot_state = 'AVAILABLE' THEN 1 ELSE 0 END) as available_spots
FROM parking_spots ps
WHERE ps.floor_id = ?
GROUP BY ps.spot_type;
```

---

**Document Version:** 1.0  
**Last Updated:** December 10, 2025  
**Status:** Ready for Implementation Phase
