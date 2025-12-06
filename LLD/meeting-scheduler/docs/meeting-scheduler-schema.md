# MEETING SCHEDULER - DATABASE SCHEMA

## Table: users

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| name | VARCHAR(100) | NOT NULL | User's full name |
| email | VARCHAR(255) | NOT NULL, UNIQUE | User's email address |
| timezone | VARCHAR(50) | NOT NULL, DEFAULT 'UTC' | User's timezone |
| working_hours_start | INT | NOT NULL, DEFAULT 9 | Working hours start (0-23) |
| working_hours_end | INT | NOT NULL, DEFAULT 17 | Working hours end (0-23) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Last update time |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `email`
- INDEX on `timezone`

**Constraints:**
- CHECK: `working_hours_start >= 0 AND working_hours_start <= 23`
- CHECK: `working_hours_end >= 0 AND working_hours_end <= 23`
- CHECK: `working_hours_start < working_hours_end`

---

## Table: calendars

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| user_id | VARCHAR(36) | NOT NULL, UNIQUE | User reference |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Record creation time |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `user_id`
- FOREIGN KEY: `user_id` REFERENCES `users(id)` ON DELETE CASCADE

**Relationships:**
- One-to-One with users table

---

## Table: events

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| title | VARCHAR(200) | NOT NULL | Event title |
| description | TEXT | NULL | Event description |
| start_time | TIMESTAMP | NOT NULL | Event start time (UTC) |
| end_time | TIMESTAMP | NOT NULL | Event end time (UTC) |
| location | VARCHAR(255) | NULL | Event location |
| organizer_id | VARCHAR(36) | NOT NULL | Event organizer |
| room_id | VARCHAR(36) | NULL | Meeting room reference |
| is_recurring | BOOLEAN | NOT NULL, DEFAULT FALSE | Is recurring event |
| parent_event_id | VARCHAR(36) | NULL | Parent event for recurring instances |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'SCHEDULED' | Event status |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Last update time |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `organizer_id`
- INDEX on `room_id`
- INDEX on `parent_event_id`
- INDEX on `start_time, end_time`
- INDEX on `status`
- FOREIGN KEY: `organizer_id` REFERENCES `users(id)` ON DELETE CASCADE
- FOREIGN KEY: `room_id` REFERENCES `meeting_rooms(id)` ON DELETE SET NULL
- FOREIGN KEY: `parent_event_id` REFERENCES `events(id)` ON DELETE CASCADE

**Constraints:**
- CHECK: `end_time > start_time`
- CHECK: `status IN ('SCHEDULED', 'CANCELLED', 'COMPLETED')`

---

## Table: event_participants

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| event_id | VARCHAR(36) | NOT NULL | Event reference |
| user_id | VARCHAR(36) | NOT NULL | Participant reference |
| added_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | When participant was added |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `event_id, user_id`
- INDEX on `event_id`
- INDEX on `user_id`
- FOREIGN KEY: `event_id` REFERENCES `events(id)` ON DELETE CASCADE
- FOREIGN KEY: `user_id` REFERENCES `users(id)` ON DELETE CASCADE

**Relationships:**
- Many-to-Many junction table between events and users

---

## Table: calendar_events

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| calendar_id | VARCHAR(36) | NOT NULL | Calendar reference |
| event_id | VARCHAR(36) | NOT NULL | Event reference |
| added_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | When event was added |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `calendar_id, event_id`
- INDEX on `calendar_id`
- INDEX on `event_id`
- FOREIGN KEY: `calendar_id` REFERENCES `calendars(id)` ON DELETE CASCADE
- FOREIGN KEY: `event_id` REFERENCES `events(id)` ON DELETE CASCADE

**Relationships:**
- Many-to-Many junction table between calendars and events

---

## Table: recurrence_rules

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| event_id | VARCHAR(36) | NOT NULL, UNIQUE | Event reference |
| pattern | VARCHAR(20) | NOT NULL | Recurrence pattern |
| interval | INT | NOT NULL, DEFAULT 1 | Interval between occurrences |
| end_date | TIMESTAMP | NULL | Recurrence end date |
| occurrence_count | INT | NULL | Number of occurrences |
| days_of_week | VARCHAR(50) | NULL | Comma-separated days (for weekly) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Record creation time |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `event_id`
- INDEX on `pattern`
- FOREIGN KEY: `event_id` REFERENCES `events(id)` ON DELETE CASCADE

**Constraints:**
- CHECK: `pattern IN ('DAILY', 'WEEKLY', 'MONTHLY')`
- CHECK: `interval > 0`
- CHECK: `occurrence_count IS NULL OR occurrence_count > 0`

---

## Table: recurrence_exceptions

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| recurrence_rule_id | VARCHAR(36) | NOT NULL | Recurrence rule reference |
| exception_date | TIMESTAMP | NOT NULL | Date to skip |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Record creation time |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `recurrence_rule_id`
- UNIQUE INDEX on `recurrence_rule_id, exception_date`
- FOREIGN KEY: `recurrence_rule_id` REFERENCES `recurrence_rules(id)` ON DELETE CASCADE

---

## Table: invitations

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| event_id | VARCHAR(36) | NOT NULL | Event reference |
| user_id | VARCHAR(36) | NOT NULL | Invitee reference |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'PENDING' | Invitation status |
| sent_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | When invitation was sent |
| responded_at | TIMESTAMP | NULL | When user responded |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `event_id, user_id`
- INDEX on `event_id`
- INDEX on `user_id`
- INDEX on `status`
- FOREIGN KEY: `event_id` REFERENCES `events(id)` ON DELETE CASCADE
- FOREIGN KEY: `user_id` REFERENCES `users(id)` ON DELETE CASCADE

**Constraints:**
- CHECK: `status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'TENTATIVE')`

---

## Table: meeting_rooms

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| name | VARCHAR(100) | NOT NULL, UNIQUE | Room name |
| capacity | INT | NOT NULL | Maximum capacity |
| location | VARCHAR(255) | NOT NULL | Room location |
| amenities | TEXT | NULL | Comma-separated amenities |
| is_available | BOOLEAN | NOT NULL, DEFAULT TRUE | Room availability |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Last update time |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `name`
- INDEX on `capacity`
- INDEX on `location`
- INDEX on `is_available`

**Constraints:**
- CHECK: `capacity > 0`

---

## Table: room_bookings

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| room_id | VARCHAR(36) | NOT NULL | Room reference |
| event_id | VARCHAR(36) | NOT NULL, UNIQUE | Event reference |
| start_time | TIMESTAMP | NOT NULL | Booking start time |
| end_time | TIMESTAMP | NOT NULL | Booking end time |
| booked_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | When booking was made |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `event_id`
- INDEX on `room_id`
- INDEX on `room_id, start_time, end_time`
- FOREIGN KEY: `room_id` REFERENCES `meeting_rooms(id)` ON DELETE CASCADE
- FOREIGN KEY: `event_id` REFERENCES `events(id)` ON DELETE CASCADE

**Constraints:**
- CHECK: `end_time > start_time`

---

## Table: notifications

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| user_id | VARCHAR(36) | NOT NULL | Recipient reference |
| event_id | VARCHAR(36) | NOT NULL | Event reference |
| type | VARCHAR(30) | NOT NULL | Notification type |
| message | TEXT | NOT NULL | Notification message |
| sent_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | When notification was sent |
| is_read | BOOLEAN | NOT NULL, DEFAULT FALSE | Read status |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `user_id`
- INDEX on `event_id`
- INDEX on `user_id, is_read`
- INDEX on `type`
- FOREIGN KEY: `user_id` REFERENCES `users(id)` ON DELETE CASCADE
- FOREIGN KEY: `event_id` REFERENCES `events(id)` ON DELETE CASCADE

**Constraints:**
- CHECK: `type IN ('INVITATION', 'REMINDER', 'UPDATE', 'CANCELLATION', 'RESPONSE')`

---

## Table: notification_preferences

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| user_id | VARCHAR(36) | NOT NULL | User reference |
| notification_type | VARCHAR(30) | NOT NULL | Type of notification |
| minutes_before | INT | NOT NULL | Minutes before event |
| enabled | BOOLEAN | NOT NULL, DEFAULT TRUE | Preference enabled |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Record creation time |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `user_id`
- UNIQUE INDEX on `user_id, notification_type, minutes_before`
- FOREIGN KEY: `user_id` REFERENCES `users(id)` ON DELETE CASCADE

**Constraints:**
- CHECK: `minutes_before >= 0`
- CHECK: `notification_type IN ('INVITATION', 'REMINDER', 'UPDATE', 'CANCELLATION')`

---

## Relationships Summary

### One-to-One (1:1)
- users ↔ calendars
- events ↔ recurrence_rules (optional)
- events ↔ room_bookings (optional)

### One-to-Many (1:M)
- users → events (as organizer)
- users → invitations
- users → notifications
- users → notification_preferences
- events → invitations
- events → event_participants
- events → events (parent-child for recurring)
- meeting_rooms → room_bookings
- meeting_rooms → events
- calendars → calendar_events
- recurrence_rules → recurrence_exceptions

### Many-to-Many (M:N)
- users ↔ events (through event_participants) - participants
- calendars ↔ events (through calendar_events)

---

## Database Normalization

**Normalized to 3NF (Third Normal Form):**
- ✅ All tables have primary keys
- ✅ No repeating groups (1NF)
- ✅ All non-key attributes depend on the entire primary key (2NF)
- ✅ No transitive dependencies (3NF)
- ✅ Junction tables for many-to-many relationships
- ✅ Foreign key constraints maintain referential integrity

---

## Key Design Decisions

1. **Time Storage:** All timestamps stored in UTC to avoid timezone issues
2. **Recurring Events:** Parent-child relationship with recurrence_rules for flexible handling
3. **Room Booking:** Separate table to track room reservations independently
4. **Invitations:** Separate from participants to track invitation lifecycle
5. **Notifications:** Separate table for audit trail and notification history
6. **Calendar-Event Relationship:** Junction table allows events to appear in multiple calendars
7. **Soft Deletes:** Using CASCADE for data integrity; can add deleted_at for soft deletes if needed
8. **Indexing Strategy:** Composite indexes on frequently queried columns (date ranges, status)

---

## Total Tables: 13

1. users
2. calendars
3. events
4. event_participants
5. calendar_events
6. recurrence_rules
7. recurrence_exceptions
8. invitations
9. meeting_rooms
10. room_bookings
11. notifications
12. notification_preferences
13. (Total: 13 tables)
