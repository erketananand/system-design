# IRCTC TRAIN TICKETING SYSTEM - DATABASE SCHEMA

## TABLE: users

| Column Name   | Data Type      | Constraints                     | Description                         |
|--------------|----------------|----------------------------------|-------------------------------------|
| id           | VARCHAR(36)    | PRIMARY KEY, NOT NULL           | UUID for user                       |
| name         | VARCHAR(100)   | NOT NULL                        | Full name                           |
| email        | VARCHAR(150)   | NOT NULL, UNIQUE                | Email address                       |
| phone        | VARCHAR(15)    | NOT NULL, UNIQUE                | Mobile number                       |
| password_hash| VARCHAR(255)   | NOT NULL                        | Hashed password                     |
| date_of_birth| DATE           | NULL                            | Date of birth                       |
| created_at   | TIMESTAMP      | NOT NULL                        | Creation timestamp                  |
| updated_at   | TIMESTAMP      | NOT NULL                        | Last update timestamp               |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `email`
- UNIQUE INDEX on `phone`

---

## TABLE: stations

| Column Name     | Data Type      | Constraints                     | Description                         |
|-----------------|----------------|----------------------------------|-------------------------------------|
| id              | VARCHAR(36)    | PRIMARY KEY, NOT NULL           | UUID for station                    |
| station_code    | VARCHAR(10)    | NOT NULL, UNIQUE                | Unique station code                 |
| station_name    | VARCHAR(150)   | NOT NULL                        | Station full name                   |
| city            | VARCHAR(100)   | NOT NULL                        | City name                           |
| state           | VARCHAR(100)   | NOT NULL                        | State name                          |
| platform_count  | INT            | NOT NULL DEFAULT 1              | Number of platforms                 |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `station_code`

---

## TABLE: trains

| Column Name      | Data Type      | Constraints                     | Description                         |
|------------------|----------------|----------------------------------|-------------------------------------|
| id               | VARCHAR(36)    | PRIMARY KEY, NOT NULL           | UUID for train                      |
| train_number     | VARCHAR(20)    | NOT NULL, UNIQUE                | Train number                        |
| train_name       | VARCHAR(150)   | NOT NULL                        | Train name                          |
| source_station_id| VARCHAR(36)    | NOT NULL, FK → stations(id)     | Source station                      |
| dest_station_id  | VARCHAR(36)    | NOT NULL, FK → stations(id)     | Destination station                 |
| train_type       | VARCHAR(30)    | NOT NULL                        | Express, Superfast, etc.            |
| created_at       | TIMESTAMP      | NOT NULL                        | Creation timestamp                  |
| updated_at       | TIMESTAMP      | NOT NULL                        | Last update timestamp               |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `train_number`
- INDEX on `source_station_id`
- INDEX on `dest_station_id`

---

## TABLE: train_schedules

| Column Name     | Data Type      | Constraints                     | Description                         |
|-----------------|----------------|----------------------------------|-------------------------------------|
| id              | VARCHAR(36)    | PRIMARY KEY, NOT NULL           | UUID for schedule                   |
| train_id        | VARCHAR(36)    | NOT NULL, FK → trains(id)       | Associated train                    |
| operating_days  | VARCHAR(50)    | NOT NULL                        | CSV of days (e.g., MON,TUE,...)    |
| effective_from  | DATE           | NOT NULL                        | Schedule start date                 |
| effective_to    | DATE           | NULL                            | Schedule end date                   |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `train_id`

---

## TABLE: route_stations

| Column Name         | Data Type      | Constraints                     | Description                         |
|---------------------|----------------|----------------------------------|-------------------------------------|
| id                  | VARCHAR(36)    | PRIMARY KEY, NOT NULL           | UUID for route station              |
| train_schedule_id   | VARCHAR(36)    | NOT NULL, FK → train_schedules(id)| Related schedule                  |
| station_id          | VARCHAR(36)    | NOT NULL, FK → stations(id)     | Station on route                    |
| stop_number         | INT            | NOT NULL                        | Order in route                      |
| arrival_time        | VARCHAR(10)    | NULL                            | Arrival time (HH:MM)                |
| departure_time      | VARCHAR(10)    | NULL                            | Departure time (HH:MM)              |
| platform            | INT            | NULL                            | Platform number                     |
| distance_from_origin| INT            | NOT NULL                        | Distance in km from origin          |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `train_schedule_id`
- INDEX on `station_id`
- UNIQUE INDEX on (`train_schedule_id`, `stop_number`)

---

## TABLE: coaches

| Column Name    | Data Type      | Constraints                     | Description                         |
|----------------|----------------|----------------------------------|-------------------------------------|
| id             | VARCHAR(36)    | PRIMARY KEY, NOT NULL           | UUID for coach                      |
| train_id       | VARCHAR(36)    | NOT NULL, FK → trains(id)       | Parent train                        |
| coach_number   | VARCHAR(10)    | NOT NULL                        | Coach identifier (e.g., S1, A2)     |
| coach_type     | VARCHAR(30)    | NOT NULL                        | SL, 3A, 2A, 1A, CC, etc.            |
| total_seats    | INT            | NOT NULL                        | Number of seats/berths              |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `train_id`
- UNIQUE INDEX on (`train_id`, `coach_number`)

---

## TABLE: seats

| Column Name | Data Type      | Constraints                     | Description                         |
|------------|----------------|----------------------------------|-------------------------------------|
| id         | VARCHAR(36)    | PRIMARY KEY, NOT NULL           | UUID for seat                       |
| coach_id   | VARCHAR(36)    | NOT NULL, FK → coaches(id)      | Parent coach                        |
| seat_number| VARCHAR(10)    | NOT NULL                        | Seat/berth number                   |
| berth_type | VARCHAR(20)    | NOT NULL                        | LOWER, MIDDLE, UPPER, SIDE-LOWER   |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `coach_id`
- UNIQUE INDEX on (`coach_id`, `seat_number`)

---

## TABLE: bookings

| Column Name       | Data Type      | Constraints                     | Description                         |
|-------------------|----------------|----------------------------------|-------------------------------------|
| id                | VARCHAR(36)    | PRIMARY KEY, NOT NULL           | UUID for booking                    |
| pnr               | VARCHAR(12)    | NOT NULL, UNIQUE                | PNR number                          |
| user_id           | VARCHAR(36)    | NOT NULL, FK → users(id)        | Booking user                        |
| train_id          | VARCHAR(36)    | NOT NULL, FK → trains(id)       | Train booked                        |
| journey_date      | DATE           | NOT NULL                        | Date of journey                     |
| source_station_id | VARCHAR(36)    | NOT NULL, FK → stations(id)     | Source station                      |
| dest_station_id   | VARCHAR(36)    | NOT NULL, FK → stations(id)     | Destination station                 |
| coach_type        | VARCHAR(30)    | NOT NULL                        | Booked coach type                   |
| status            | VARCHAR(20)    | NOT NULL                        | CONFIRMED/RAC/WAITLIST/CANCELLED   |
| total_fare        | DECIMAL(10,2)  | NOT NULL                        | Total fare amount                   |
| payment_id        | VARCHAR(36)    | NULL, FK → payments(id)         | Related payment                     |
| booked_at         | TIMESTAMP      | NOT NULL                        | Booking timestamp                   |
| updated_at        | TIMESTAMP      | NOT NULL                        | Last update timestamp               |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `pnr`
- INDEX on `user_id`
- INDEX on `train_id`
- INDEX on (`train_id`, `journey_date`)
- INDEX on `status`

---

## TABLE: passengers

| Column Name       | Data Type      | Constraints                     | Description                         |
|-------------------|----------------|----------------------------------|-------------------------------------|
| id                | VARCHAR(36)    | PRIMARY KEY, NOT NULL           | UUID for passenger                  |
| booking_id        | VARCHAR(36)    | NOT NULL, FK → bookings(id)     | Parent booking                      |
| name              | VARCHAR(100)   | NOT NULL                        | Passenger name                      |
| age               | INT            | NOT NULL                        | Age                                 |
| gender            | VARCHAR(10)    | NOT NULL                        | Gender                              |
| berth_preference  | VARCHAR(20)    | NULL                            | Preferred berth type                |
| coach_number      | VARCHAR(10)    | NULL                            | Allotted coach number               |
| seat_number       | VARCHAR(10)    | NULL                            | Allotted seat number                |
| status            | VARCHAR(20)    | NOT NULL                        | CONFIRMED/RAC/WAITLIST/CANCELLED   |
| waitlist_position | INT            | NULL                            | Waitlist position (if applicable)   |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `booking_id`
- INDEX on `status`

---

## TABLE: seat_reservations

| Column Name  | Data Type      | Constraints                     | Description                         |
|-------------|----------------|----------------------------------|-------------------------------------|
| id          | VARCHAR(36)    | PRIMARY KEY, NOT NULL           | UUID for reservation                |
| seat_id     | VARCHAR(36)    | NOT NULL, FK → seats(id)        | Reserved seat                       |
| booking_id  | VARCHAR(36)    | NOT NULL, FK → bookings(id)     | Related booking                     |
| journey_date| DATE           | NOT NULL                        | Journey date                        |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on (`seat_id`, `journey_date`)
- INDEX on `booking_id`

---

## TABLE: payments

| Column Name    | Data Type      | Constraints                     | Description                         |
|----------------|----------------|----------------------------------|-------------------------------------|
| id             | VARCHAR(36)    | PRIMARY KEY, NOT NULL           | UUID for payment                    |
| booking_id     | VARCHAR(36)    | NOT NULL, FK → bookings(id)     | Related booking                     |
| amount         | DECIMAL(10,2)  | NOT NULL                        | Payment amount                      |
| method         | VARCHAR(30)    | NOT NULL                        | CREDIT_CARD/UPI/NET_BANKING         |
| status         | VARCHAR(20)    | NOT NULL                        | PENDING/SUCCESS/FAILED/REFUNDED    |
| transaction_id | VARCHAR(100)   | NULL                            | External transaction reference      |
| processed_at   | TIMESTAMP      | NULL                            | Payment processed time              |
| created_at     | TIMESTAMP      | NOT NULL                        | Creation timestamp                  |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `booking_id`
- INDEX on `status`

---

## TABLE: quotas

| Column Name | Data Type      | Constraints                     | Description                         |
|------------|----------------|----------------------------------|-------------------------------------|
| id         | VARCHAR(36)    | PRIMARY KEY, NOT NULL           | UUID for quota                      |
| name       | VARCHAR(50)    | NOT NULL, UNIQUE                | Quota name (GENERAL,TATKAL,...)     |
| code       | VARCHAR(20)    | NOT NULL, UNIQUE                | Short code                          |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `name`
- UNIQUE INDEX on `code`

---

## TABLE: train_quotas

| Column Name | Data Type      | Constraints                     | Description                         |
|------------|----------------|----------------------------------|-------------------------------------|
| id         | VARCHAR(36)    | PRIMARY KEY, NOT NULL           | UUID for train quota mapping        |
| train_id   | VARCHAR(36)    | NOT NULL, FK → trains(id)       | Train                               |
| coach_type | VARCHAR(30)    | NOT NULL                        | Coach type                          |
| quota_id   | VARCHAR(36)    | NOT NULL, FK → quotas(id)       | Quota                               |
| seat_limit | INT            | NOT NULL                        | Seats reserved under this quota     |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `train_id`
- INDEX on `quota_id`
- UNIQUE INDEX on (`train_id`, `coach_type`, `quota_id`)

---

## TABLE: waitlists

| Column Name       | Data Type      | Constraints                     | Description                         |
|-------------------|----------------|----------------------------------|-------------------------------------|
| id                | VARCHAR(36)    | PRIMARY KEY, NOT NULL           | UUID for waitlist record            |
| train_id          | VARCHAR(36)    | NOT NULL, FK → trains(id)       | Train                               |
| journey_date      | DATE           | NOT NULL                        | Journey date                        |
| coach_type        | VARCHAR(30)    | NOT NULL                        | Coach type                          |
| passenger_id      | VARCHAR(36)    | NOT NULL, FK → passengers(id)   | Passenger                           |
| position          | INT            | NOT NULL                        | Waitlist position                   |
| status            | VARCHAR(20)    | NOT NULL                        | ACTIVE/PROMOTED/CANCELLED           |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on (`train_id`, `journey_date`, `coach_type`)
- INDEX on `passenger_id`
- UNIQUE INDEX on (`train_id`, `journey_date`, `coach_type`, `position`)

---

## RELATIONSHIPS SUMMARY

- users (1) → (M) bookings
- stations (1) → (M) trains (as source/destination)
- trains (1) → (M) train_schedules
- train_schedules (1) → (M) route_stations
- stations (1) → (M) route_stations
- trains (1) → (M) coaches
- coaches (1) → (M) seats
- trains (1) → (M) bookings
- bookings (1) → (M) passengers
- seats (1) → (M) seat_reservations
- bookings (1) → (1) payments
- quotas (1) → (M) train_quotas
- trains (1) → (M) train_quotas
- trains (1) → (M) waitlists
- passengers (1) → (M) waitlists

All tables are normalized to **3NF**: no repeating groups, non-key attributes depend only on the key, and there are no transitive dependencies.
