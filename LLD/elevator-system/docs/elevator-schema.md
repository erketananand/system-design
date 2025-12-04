# Elevator System - Database Schema

## Schema Diagram (Tabular Format)

---

## Table: Building

| Column Name   | Data Type    | Constraints           | Description                          |
|---------------|--------------|----------------------|--------------------------------------|
| id            | VARCHAR(36)  | PRIMARY KEY          | Unique building identifier (UUID)    |
| name          | VARCHAR(100) | NOT NULL             | Building name                        |
| total_floors  | INTEGER      | NOT NULL, CHECK > 0  | Total number of floors in building   |
| created_at    | TIMESTAMP    | NOT NULL, DEFAULT NOW| Record creation timestamp            |
| updated_at    | TIMESTAMP    | NOT NULL, DEFAULT NOW| Record last update timestamp         |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `name`

---

## Table: Floor

| Column Name   | Data Type    | Constraints           | Description                          |
|---------------|--------------|----------------------|--------------------------------------|
| id            | VARCHAR(36)  | PRIMARY KEY          | Unique floor identifier (UUID)       |
| building_id   | VARCHAR(36)  | NOT NULL, FOREIGN KEY| References Building.id               |
| floor_number  | INTEGER      | NOT NULL             | Floor number (e.g., 0=Ground, -1=B1) |
| created_at    | TIMESTAMP    | NOT NULL, DEFAULT NOW| Record creation timestamp            |
| updated_at    | TIMESTAMP    | NOT NULL, DEFAULT NOW| Record last update timestamp         |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on (`building_id`, `floor_number`)
- FOREIGN KEY: `building_id` REFERENCES `Building(id)` ON DELETE CASCADE

---

## Table: Elevator

| Column Name      | Data Type    | Constraints           | Description                              |
|------------------|--------------|----------------------|------------------------------------------|
| id               | VARCHAR(36)  | PRIMARY KEY          | Unique elevator identifier (UUID)        |
| building_id      | VARCHAR(36)  | NOT NULL, FOREIGN KEY| References Building.id                   |
| elevator_code    | VARCHAR(50)  | NOT NULL             | Elevator name/code (e.g., "E1", "E2")    |
| capacity         | INTEGER      | NOT NULL, CHECK > 0  | Maximum passenger capacity               |
| current_floor    | INTEGER      | NOT NULL, DEFAULT 0  | Current floor number                     |
| direction        | VARCHAR(10)  | NOT NULL, DEFAULT 'IDLE'| Direction: UP, DOWN, IDLE            |
| state            | VARCHAR(20)  | NOT NULL, DEFAULT 'IDLE'| State: MOVING_UP, MOVING_DOWN, IDLE, MAINTENANCE |
| door_status      | VARCHAR(10)  | NOT NULL, DEFAULT 'CLOSED'| Door status: OPEN, CLOSED          |
| current_load     | INTEGER      | NOT NULL, DEFAULT 0  | Current passenger load                   |
| created_at       | TIMESTAMP    | NOT NULL, DEFAULT NOW| Record creation timestamp                |
| updated_at       | TIMESTAMP    | NOT NULL, DEFAULT NOW| Record last update timestamp             |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on (`building_id`, `elevator_code`)
- INDEX on `building_id`
- INDEX on `current_floor`
- FOREIGN KEY: `building_id` REFERENCES `Building(id)` ON DELETE CASCADE

---

## Table: Panel

| Column Name   | Data Type    | Constraints           | Description                              |
|---------------|--------------|----------------------|------------------------------------------|
| id            | VARCHAR(36)  | PRIMARY KEY          | Unique panel identifier (UUID)           |
| panel_type    | VARCHAR(20)  | NOT NULL             | Panel type: FLOOR, CABIN                 |
| floor_id      | VARCHAR(36)  | NULLABLE, FOREIGN KEY| References Floor.id (NULL for CABIN)     |
| elevator_id   | VARCHAR(36)  | NULLABLE, FOREIGN KEY| References Elevator.id (NULL for FLOOR)  |
| created_at    | TIMESTAMP    | NOT NULL, DEFAULT NOW| Record creation timestamp                |
| updated_at    | TIMESTAMP    | NOT NULL, DEFAULT NOW| Record last update timestamp             |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `floor_id`
- INDEX on `elevator_id`
- FOREIGN KEY: `floor_id` REFERENCES `Floor(id)` ON DELETE CASCADE
- FOREIGN KEY: `elevator_id` REFERENCES `Elevator(id)` ON DELETE CASCADE

**Constraints:**
- CHECK: `(panel_type = 'FLOOR' AND floor_id IS NOT NULL AND elevator_id IS NULL) OR (panel_type = 'CABIN' AND elevator_id IS NOT NULL AND floor_id IS NULL)`

---

## Table: Button

| Column Name      | Data Type    | Constraints           | Description                              |
|------------------|--------------|----------------------|------------------------------------------|
| id               | VARCHAR(36)  | PRIMARY KEY          | Unique button identifier (UUID)          |
| panel_id         | VARCHAR(36)  | NOT NULL, FOREIGN KEY| References Panel.id                      |
| button_type      | VARCHAR(20)  | NOT NULL             | Button type: UP, DOWN, FLOOR, EMERGENCY  |
| target_floor     | INTEGER      | NULLABLE             | Target floor number (NULL for UP/DOWN/EMERGENCY) |
| label            | VARCHAR(10)  | NOT NULL             | Button label (e.g., "1", "G", "Up")      |
| is_pressed       | BOOLEAN      | NOT NULL, DEFAULT FALSE| Current button state                  |
| created_at       | TIMESTAMP    | NOT NULL, DEFAULT NOW| Record creation timestamp                |
| updated_at       | TIMESTAMP    | NOT NULL, DEFAULT NOW| Record last update timestamp             |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `panel_id`
- FOREIGN KEY: `panel_id` REFERENCES `Panel(id)` ON DELETE CASCADE

---

## Table: Request

| Column Name          | Data Type    | Constraints           | Description                              |
|----------------------|--------------|----------------------|------------------------------------------|
| id                   | VARCHAR(36)  | PRIMARY KEY          | Unique request identifier (UUID)         |
| request_type         | VARCHAR(20)  | NOT NULL             | Request type: EXTERNAL, INTERNAL         |
| building_id          | VARCHAR(36)  | NOT NULL, FOREIGN KEY| References Building.id                   |
| elevator_id          | VARCHAR(36)  | NULLABLE, FOREIGN KEY| References Elevator.id (NULL until assigned for EXTERNAL) |
| source_floor         | INTEGER      | NULLABLE             | Source floor number (NULL for INTERNAL)  |
| destination_floor    | INTEGER      | NULLABLE             | Destination floor (NULL for EXTERNAL without known destination) |
| direction            | VARCHAR(10)  | NULLABLE             | Direction: UP, DOWN (NULL for INTERNAL)  |
| status               | VARCHAR(20)  | NOT NULL, DEFAULT 'PENDING'| Status: PENDING, ASSIGNED, COMPLETED, CANCELLED |
| created_at           | TIMESTAMP    | NOT NULL, DEFAULT NOW| Request creation timestamp               |
| updated_at           | TIMESTAMP    | NOT NULL, DEFAULT NOW| Request last update timestamp            |
| completed_at         | TIMESTAMP    | NULLABLE             | Request completion timestamp             |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `building_id`
- INDEX on `elevator_id`
- INDEX on `status`
- INDEX on `created_at`
- FOREIGN KEY: `building_id` REFERENCES `Building(id)` ON DELETE CASCADE
- FOREIGN KEY: `elevator_id` REFERENCES `Elevator(id)` ON DELETE SET NULL

---

## Table: SchedulingStrategy

| Column Name   | Data Type    | Constraints           | Description                              |
|---------------|--------------|----------------------|------------------------------------------|
| id            | VARCHAR(36)  | PRIMARY KEY          | Unique strategy identifier (UUID)        |
| building_id   | VARCHAR(36)  | NOT NULL, FOREIGN KEY| References Building.id                   |
| strategy_name | VARCHAR(50)  | NOT NULL             | Strategy name: NEAREST, SCAN, LOOK, FCFS |
| is_active     | BOOLEAN      | NOT NULL, DEFAULT FALSE| Whether this strategy is currently active |
| created_at    | TIMESTAMP    | NOT NULL, DEFAULT NOW| Record creation timestamp                |
| updated_at    | TIMESTAMP    | NOT NULL, DEFAULT NOW| Record last update timestamp             |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on (`building_id`, `strategy_name`)
- INDEX on (`building_id`, `is_active`)
- FOREIGN KEY: `building_id` REFERENCES `Building(id)` ON DELETE CASCADE

**Constraints:**
- Only one active strategy per building: CHECK via application logic or trigger

---

## Relationships

### One-to-Many Relationships

1. **Building → Floor**
   - One building has many floors
   - `Floor.building_id` references `Building.id`

2. **Building → Elevator**
   - One building has many elevators
   - `Elevator.building_id` references `Building.id`

3. **Building → Request**
   - One building has many requests
   - `Request.building_id` references `Building.id`

4. **Building → SchedulingStrategy**
   - One building has many scheduling strategies (but only one active)
   - `SchedulingStrategy.building_id` references `Building.id`

5. **Floor → Panel**
   - One floor has one floor panel
   - `Panel.floor_id` references `Floor.id`

6. **Elevator → Panel**
   - One elevator has one cabin panel
   - `Panel.elevator_id` references `Elevator.id`

7. **Panel → Button**
   - One panel has many buttons
   - `Button.panel_id` references `Panel.id`

8. **Elevator → Request**
   - One elevator can be assigned many requests
   - `Request.elevator_id` references `Elevator.id`

---

## Entity Relationship Summary

```
Building (1) ──→ (M) Floor
Building (1) ──→ (M) Elevator
Building (1) ──→ (M) Request
Building (1) ──→ (M) SchedulingStrategy

Floor (1) ──→ (1) Panel [FLOOR type]
Elevator (1) ──→ (1) Panel [CABIN type]

Panel (1) ──→ (M) Button

Elevator (1) ──→ (M) Request [assigned]
```

---

## Normalization Notes

- **3rd Normal Form (3NF)** achieved
- No transitive dependencies
- Each non-key attribute depends only on the primary key
- Panel type design allows flexible extension for future panel types
- Request table handles both EXTERNAL and INTERNAL requests with appropriate nullable fields

---

## Additional Considerations

### For In-Memory Implementation:
- Use Maps/Dictionaries keyed by `id` for O(1) lookups
- Maintain indexes manually using additional Maps
- Implement CASCADE deletes in application logic
- Validate CHECK constraints in application layer

### Future Enhancements:
- Add `ElevatorLog` table for tracking elevator movements
- Add `MaintenanceSchedule` table for planned maintenance
- Add `User` table if implementing access control
- Add `Alert` table for system notifications

---

Document Version: 1.0
Last Updated: December 04, 2025
