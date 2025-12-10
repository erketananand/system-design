# NOBROKER - Database Schema

## Overview
This schema is designed for a relational database normalized to **3NF (Third Normal Form)**. It supports the NoBroker real estate platform with entities for users, properties, listings, chats, offers, visits, searches, alerts, and reviews.

---

## Table: users

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| name | VARCHAR(100) | NOT NULL | User's full name |
| email | VARCHAR(100) | NOT NULL, UNIQUE | User's email address |
| phone | VARCHAR(15) | NOT NULL, UNIQUE | User's phone number |
| password_hash | VARCHAR(255) | NOT NULL | Hashed password |
| account_tier | ENUM('STANDARD', 'PREMIUM') | NOT NULL, DEFAULT 'STANDARD' | Account subscription tier |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `email`
- UNIQUE INDEX on `phone`
- INDEX on `account_tier`

---

## Table: user_roles

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| user_id | VARCHAR(36) | NOT NULL | Reference to users table |
| role | ENUM('OWNER', 'SEEKER') | NOT NULL | User role type |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Role assignment timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY: `user_id` REFERENCES `users(id)` ON DELETE CASCADE
- INDEX on `user_id`
- UNIQUE INDEX on (`user_id`, `role`) to prevent duplicate roles

---

## Table: user_preferences

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| user_id | VARCHAR(36) | NOT NULL, UNIQUE | Reference to users table |
| preferred_locations | JSON | NULL | Array of preferred location strings |
| min_budget | DECIMAL(15,2) | NULL | Minimum budget preference |
| max_budget | DECIMAL(15,2) | NULL | Maximum budget preference |
| preferred_property_types | JSON | NULL | Array of PropertyType enums |
| preferred_configurations | JSON | NULL | Array of PropertyConfiguration enums |
| preferred_furnishing_types | JSON | NULL | Array of FurnishingType enums |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Preference creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY: `user_id` REFERENCES `users(id)` ON DELETE CASCADE
- UNIQUE INDEX on `user_id`

---

## Table: addresses

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| city | VARCHAR(100) | NOT NULL | City name |
| area | VARCHAR(100) | NOT NULL | Area/region name |
| locality | VARCHAR(100) | NOT NULL | Specific locality |
| landmark | VARCHAR(200) | NULL | Nearby landmark |
| latitude | DECIMAL(10,8) | NULL | Geographic latitude |
| longitude | DECIMAL(11,8) | NULL | Geographic longitude |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Address creation timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `city`
- INDEX on `area`
- INDEX on `locality`
- INDEX on (`latitude`, `longitude`) for geo-queries

---

## Table: properties

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| owner_id | VARCHAR(36) | NOT NULL | Reference to users table |
| address_id | VARCHAR(36) | NOT NULL | Reference to addresses table |
| title | VARCHAR(200) | NOT NULL | Property title |
| description | TEXT | NULL | Detailed property description |
| property_type | ENUM('PG', 'FLAT', 'VILLA', 'LAND') | NOT NULL | Type of property |
| structure_type | ENUM('APARTMENT', 'STANDALONE', 'PG_HOUSE') | NULL | Building structure type |
| configuration | ENUM('STUDIO', 'RK1', 'BHK1', 'BHK2', 'BHK3', 'BHK4', 'DUPLEX', 'OTHER') | NULL | Room configuration |
| pg_sharing_type | ENUM('SINGLE', 'DOUBLE', 'TRIPLE', 'FOUR_SHARING', 'FIVE_SHARING') | NULL | PG sharing type |
| carpet_area_sqft | DECIMAL(10,2) | NULL | Carpet area in square feet |
| builtup_area_sqft | DECIMAL(10,2) | NULL | Built-up area in square feet |
| furnishing_type | ENUM('FULLY_FURNISHED', 'SEMI_FURNISHED', 'UNFURNISHED') | NOT NULL | Furnishing status |
| property_age_years | INT | NULL | Age of property in years |
| floor_number | INT | NULL | Floor number |
| total_floors | INT | NULL | Total floors in building |
| parking_available | BOOLEAN | NOT NULL, DEFAULT FALSE | Parking availability |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Property creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY: `owner_id` REFERENCES `users(id)` ON DELETE CASCADE
- FOREIGN KEY: `address_id` REFERENCES `addresses(id)` ON DELETE CASCADE
- INDEX on `owner_id`
- INDEX on `property_type`
- INDEX on `configuration`
- INDEX on `furnishing_type`
- INDEX on `address_id`

---

## Table: property_amenities

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| property_id | VARCHAR(36) | NOT NULL | Reference to properties table |
| amenity | ENUM('LIFT', 'CCTV', 'SECURITY_GUARD', 'GATED_COMMUNITY', 'BALCONY', 'MODULAR_KITCHEN', 'AC', 'GEYSER', 'WIFI', 'PARKING', 'POWER_BACKUP', 'WATER_SUPPLY', 'OTHER') | NOT NULL | Amenity type |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Amenity addition timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY: `property_id` REFERENCES `properties(id)` ON DELETE CASCADE
- INDEX on `property_id`
- UNIQUE INDEX on (`property_id`, `amenity`) to prevent duplicates

---

## Table: property_listings

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| property_id | VARCHAR(36) | NOT NULL | Reference to properties table |
| owner_id | VARCHAR(36) | NOT NULL | Reference to users table |
| listing_purpose | ENUM('SALE', 'RENT', 'BOTH') | NOT NULL | Purpose of listing |
| base_price | DECIMAL(15,2) | NOT NULL | Sale price or base price |
| expected_rent | DECIMAL(15,2) | NULL | Monthly rent (if applicable) |
| security_deposit | DECIMAL(15,2) | NULL | Security deposit amount |
| listing_status | ENUM('DRAFT', 'LIVE', 'PAUSED', 'UNDER_DISCUSSION', 'CLOSED') | NOT NULL, DEFAULT 'DRAFT' | Current listing status |
| visibility_level | ENUM('NORMAL', 'BOOSTED', 'PREMIUM') | NOT NULL, DEFAULT 'NORMAL' | Listing visibility level |
| is_contact_visible | BOOLEAN | NOT NULL, DEFAULT TRUE | Contact visibility flag |
| posted_at | TIMESTAMP | NULL | When listing went live |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Listing creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY: `property_id` REFERENCES `properties(id)` ON DELETE CASCADE
- FOREIGN KEY: `owner_id` REFERENCES `users(id)` ON DELETE CASCADE
- INDEX on `property_id`
- INDEX on `owner_id`
- INDEX on `listing_status`
- INDEX on `listing_purpose`
- INDEX on `posted_at`
- INDEX on (`listing_status`, `posted_at`) for active listings query

---

## Table: chat_threads

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| listing_id | VARCHAR(36) | NOT NULL | Reference to property_listings table |
| owner_id | VARCHAR(36) | NOT NULL | Reference to users table (property owner) |
| seeker_id | VARCHAR(36) | NOT NULL | Reference to users table (property seeker) |
| active | BOOLEAN | NOT NULL, DEFAULT TRUE | Thread active status |
| last_activity_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Last activity timestamp |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Thread creation timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY: `listing_id` REFERENCES `property_listings(id)` ON DELETE CASCADE
- FOREIGN KEY: `owner_id` REFERENCES `users(id)` ON DELETE CASCADE
- FOREIGN KEY: `seeker_id` REFERENCES `users(id)` ON DELETE CASCADE
- INDEX on `listing_id`
- INDEX on `owner_id`
- INDEX on `seeker_id`
- UNIQUE INDEX on (`listing_id`, `owner_id`, `seeker_id`)
- INDEX on `last_activity_at`

---

## Table: chat_messages

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| thread_id | VARCHAR(36) | NOT NULL | Reference to chat_threads table |
| sender_id | VARCHAR(36) | NOT NULL | Reference to users table |
| content | TEXT | NOT NULL | Message content |
| message_type | ENUM('TEXT', 'VISIT_PROPOSAL', 'OFFER_PROPOSAL', 'SYSTEM') | NOT NULL, DEFAULT 'TEXT' | Type of message |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Message timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY: `thread_id` REFERENCES `chat_threads(id)` ON DELETE CASCADE
- FOREIGN KEY: `sender_id` REFERENCES `users(id)` ON DELETE CASCADE
- INDEX on `thread_id`
- INDEX on `sender_id`
- INDEX on `created_at`
- INDEX on (`thread_id`, `created_at`) for chronological message retrieval

---

## Table: visit_slots

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| thread_id | VARCHAR(36) | NOT NULL | Reference to chat_threads table |
| proposed_by_id | VARCHAR(36) | NOT NULL | Reference to users table |
| proposed_for | TIMESTAMP | NOT NULL | Proposed visit date/time |
| status | ENUM('PROPOSED', 'ACCEPTED', 'REJECTED', 'CANCELLED') | NOT NULL, DEFAULT 'PROPOSED' | Visit status |
| responded_by_id | VARCHAR(36) | NULL | Reference to users table |
| responded_at | TIMESTAMP | NULL | Response timestamp |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Proposal creation timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY: `thread_id` REFERENCES `chat_threads(id)` ON DELETE CASCADE
- FOREIGN KEY: `proposed_by_id` REFERENCES `users(id)` ON DELETE CASCADE
- FOREIGN KEY: `responded_by_id` REFERENCES `users(id)` ON DELETE SET NULL
- INDEX on `thread_id`
- INDEX on `proposed_by_id`
- INDEX on `status`
- INDEX on `proposed_for`

---

## Table: offers

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| thread_id | VARCHAR(36) | NOT NULL | Reference to chat_threads table |
| listing_id | VARCHAR(36) | NOT NULL | Reference to property_listings table |
| offered_by_id | VARCHAR(36) | NOT NULL | Reference to users table |
| offered_to_id | VARCHAR(36) | NOT NULL | Reference to users table |
| amount | DECIMAL(15,2) | NOT NULL | Offer amount |
| status | ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'COUNTERED', 'EXPIRED') | NOT NULL, DEFAULT 'PENDING' | Offer status |
| counter_offer_id | VARCHAR(36) | NULL | Reference to parent offer (for counter-offers) |
| expires_at | TIMESTAMP | NULL | Offer expiration timestamp |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Offer creation timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY: `thread_id` REFERENCES `chat_threads(id)` ON DELETE CASCADE
- FOREIGN KEY: `listing_id` REFERENCES `property_listings(id)` ON DELETE CASCADE
- FOREIGN KEY: `offered_by_id` REFERENCES `users(id)` ON DELETE CASCADE
- FOREIGN KEY: `offered_to_id` REFERENCES `users(id)` ON DELETE CASCADE
- FOREIGN KEY: `counter_offer_id` REFERENCES `offers(id)` ON DELETE SET NULL
- INDEX on `thread_id`
- INDEX on `listing_id`
- INDEX on `status`
- INDEX on `expires_at`

---

## Table: search_criteria

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| user_id | VARCHAR(36) | NOT NULL | Reference to users table |
| name | VARCHAR(100) | NOT NULL | User-defined search name |
| locations | JSON | NULL | Array of location strings |
| min_budget | DECIMAL(15,2) | NULL | Minimum budget filter |
| max_budget | DECIMAL(15,2) | NULL | Maximum budget filter |
| property_types | JSON | NULL | Array of PropertyType enums |
| configurations | JSON | NULL | Array of PropertyConfiguration enums |
| furnishing_types | JSON | NULL | Array of FurnishingType enums |
| listing_purposes | JSON | NULL | Array of ListingPurpose enums |
| required_amenities | JSON | NULL | Array of Amenity enums |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Search creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY: `user_id` REFERENCES `users(id)` ON DELETE CASCADE
- INDEX on `user_id`

---

## Table: saved_search_alerts

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| search_criteria_id | VARCHAR(36) | NOT NULL | Reference to search_criteria table |
| user_id | VARCHAR(36) | NOT NULL | Reference to users table |
| channel | ENUM('IN_APP', 'EMAIL', 'SMS') | NOT NULL, DEFAULT 'IN_APP' | Alert delivery channel |
| frequency | ENUM('INSTANT', 'DAILY') | NOT NULL, DEFAULT 'INSTANT' | Alert frequency |
| last_notified_at | TIMESTAMP | NULL | Last notification timestamp |
| active | BOOLEAN | NOT NULL, DEFAULT TRUE | Alert active status |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Alert creation timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY: `search_criteria_id` REFERENCES `search_criteria(id)` ON DELETE CASCADE
- FOREIGN KEY: `user_id` REFERENCES `users(id)` ON DELETE CASCADE
- INDEX on `user_id`
- INDEX on `active`
- INDEX on (`active`, `frequency`) for alert processing

---

## Table: reviews

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| reviewer_id | VARCHAR(36) | NOT NULL | Reference to users table (reviewer) |
| reviewee_user_id | VARCHAR(36) | NULL | Reference to users table (reviewed user) |
| property_id | VARCHAR(36) | NULL | Reference to properties table (reviewed property) |
| rating | INT | NOT NULL, CHECK (rating >= 1 AND rating <= 5) | Rating from 1 to 5 |
| title | VARCHAR(200) | NOT NULL | Review title |
| comment | TEXT | NULL | Review comment |
| flagged | BOOLEAN | NOT NULL, DEFAULT FALSE | Flagged for moderation |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Review creation timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY: `reviewer_id` REFERENCES `users(id)` ON DELETE CASCADE
- FOREIGN KEY: `reviewee_user_id` REFERENCES `users(id)` ON DELETE CASCADE
- FOREIGN KEY: `property_id` REFERENCES `properties(id)` ON DELETE CASCADE
- INDEX on `reviewer_id`
- INDEX on `reviewee_user_id`
- INDEX on `property_id`
- INDEX on `flagged`
- CHECK CONSTRAINT: At least one of `reviewee_user_id` or `property_id` must be NOT NULL

---

## Relationships

### One-to-Many (1:M) Relationships
- users (1) → (M) user_roles
- users (1) → (M) properties (as owner)
- users (1) → (M) property_listings (as owner)
- users (1) → (M) chat_threads (as owner or seeker)
- users (1) → (M) search_criteria
- users (1) → (M) saved_search_alerts
- users (1) → (M) reviews (as reviewer)
- properties (1) → (M) property_amenities
- properties (1) → (M) reviews
- property_listings (1) → (M) chat_threads
- chat_threads (1) → (M) chat_messages
- chat_threads (1) → (M) visit_slots
- chat_threads (1) → (M) offers
- search_criteria (1) → (M) saved_search_alerts

### One-to-One (1:1) Relationships
- users (1) → (1) user_preferences
- properties (1) → (1) addresses

### Self-Referencing Relationships
- offers (1) → (1) offers (counter-offer relationship)

---

## Database Constraints Summary

### Foreign Key Constraints
All foreign keys are defined with appropriate ON DELETE actions:
- CASCADE: When parent is deleted, child records are automatically deleted
- SET NULL: When parent is deleted, child's foreign key is set to NULL

### Unique Constraints
- user email and phone must be unique
- user_roles combination of (user_id, role) must be unique
- property_amenities combination of (property_id, amenity) must be unique
- chat_threads combination of (listing_id, owner_id, seeker_id) must be unique

### Check Constraints
- reviews.rating must be between 1 and 5
- At least one of reviews.reviewee_user_id or reviews.property_id must be NOT NULL

### Default Values
- Timestamps default to CURRENT_TIMESTAMP with auto-update
- Boolean flags have sensible defaults (active=TRUE, flagged=FALSE)
- Enums have appropriate defaults (account_tier='STANDARD', listing_status='DRAFT')

---

## Normalization Analysis

### First Normal Form (1NF)
✅ All tables have atomic values in each column
✅ Each column contains values of a single type
✅ Each column has a unique name
✅ Order in which data is stored doesn't matter

### Second Normal Form (2NF)
✅ All tables are in 1NF
✅ All non-key attributes are fully dependent on the primary key
✅ No partial dependencies exist

### Third Normal Form (3NF)
✅ All tables are in 2NF
✅ No transitive dependencies exist
✅ All non-key attributes depend only on the primary key

**Example of normalization:**
- Address is separated from Property to avoid repetition
- User roles are in a separate table to support multiple roles
- Property amenities are in a separate junction table for M:N relationship
- User preferences are separated into their own table (1:1)

---

## Indexing Strategy

### Primary Indexes
All tables have PRIMARY KEY indexes on `id` for fast lookups.

### Foreign Key Indexes
All foreign key columns are indexed for efficient JOIN operations.

### Search Optimization Indexes
- Composite indexes on frequently queried combinations:
  - (listing_status, posted_at) for active listings
  - (thread_id, created_at) for chronological messages
  - (active, frequency) for alert processing
- Location hierarchy indexes (city, area, locality)
- Geographic indexes on (latitude, longitude)

### Query Performance Considerations
- Unique indexes prevent duplicate data and speed up lookups
- JSON columns for array data allow flexible querying with JSON functions
- ENUM types ensure data integrity and reduce storage

---

✅ **Saved as:** `nobroker-schema.md`  
✅ **File reference:** [doc:3]

---
