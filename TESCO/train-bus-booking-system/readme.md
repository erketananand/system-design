## Generic Transportation Booking System Design (IRCTC/RedBus)

### **System Architecture**

```
┌──────────────────────────────────────────────────────────────┐
│                  CDN + Load Balancer                          │
│          (Geographic Traffic Distribution)                    │
└──────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼─────┐        ┌─────▼──────┐       ┌─────▼──────┐
   │  Web     │        │  Mobile    │       │  Partner   │
   │  Portal  │        │    App     │       │    API     │
   └────┬─────┘        └─────┬──────┘       └─────┬──────┘
        │                    │                     │
┌───────▼────────────────────▼─────────────────────▼───────┐
│          API Gateway (Auth, Rate Limiting)                │
└───────────────────────────┬───────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼─────┐      ┌─────▼──────┐     ┌─────▼──────┐
   │   Auth   │      │  Search    │     │  Booking   │
   │ Service  │      │  Service   │     │  Service   │
   └────┬─────┘      └─────┬──────┘     └─────┬──────┘
        │                  │                   │
   ┌────▼─────┐      ┌─────▼──────┐     ┌─────▼──────┐
   │  User    │      │ Vehicle    │     │   Seat     │
   │   DB     │      │  Cache     │     │ Inventory  │
   │(Postgres)│      │ (Redis)    │     │  Service   │
   └──────────┘      └─────┬──────┘     └─────┬──────┘
                           │                   │
                     ┌─────▼──────┐     ┌─────▼──────┐
                     │Elasticsearch│     │   Redis    │
                     │   Search    │     │   Locks    │
                     └────────────┘     └─────┬──────┘
                                              │
                                        ┌─────▼──────┐
                                        │  Booking   │
                                        │     DB     │
                                        │ (Postgres) │
                                        └────────────┘

┌──────────────────────────────────────────────────────────┐
│            Core Services Layer                            │
├──────────────┬────────────┬──────────────┬───────────────┤
│   Payment   │ Cancellation│ Notification │   Pricing     │
│   Service   │   Service   │   Service    │   Service     │
└──────────────┴────────────┴──────────────┴───────────────┘

┌──────────────────────────────────────────────────────────┐
│       Message Queue (Kafka/RabbitMQ)                      │
│  Topics: bookings, payments, cancellations, notifications│
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│    Background Jobs (Cron/Scheduler)                       │
│  - Departure reminders (24h before)                       │
│  - Seat release (expired locks)                           │
│  - Waitlist processing                                    │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│    External Integrations                                  │
│  - Payment Gateway (Stripe/Razorpay)                      │
│  - SMS Gateway (Twilio)                                   │
│  - Email Service (SendGrid)                               │
└──────────────────────────────────────────────────────────┘
```


***

## Key Components

### **1. Authentication Service**

- **Responsibilities**: User registration, login, session management[^1]
- **Features**:
    - Email/Phone + OTP authentication
    - OAuth integration (Google, Facebook)
    - JWT token-based authentication
    - Refresh token rotation
    - Multi-device session management
    - Password reset via OTP
- **Security**: Bcrypt password hashing, rate limiting on login attempts
- **Performance**: <100ms authentication

**API Endpoints**:

```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/verify-otp
POST /api/v1/auth/refresh-token
POST /api/v1/auth/logout
POST /api/v1/auth/forgot-password
```


### **2. Search Service**

- **Responsibilities**: Search vehicles (trains/buses) by route and date[^2] [^1]
- **Features**:
    - Source-destination-date based search
    - Multi-vehicle type support (train, bus, flight)
    - Date range search (±3 days)[^1]
    - Real-time seat availability
    - Class/category filtering (Sleeper, AC, Non-AC)
    - Price range filtering
    - Sort by departure time, duration, price
- **Data Source**: Vehicle schedules, routes, stations
- **Performance**: <500ms search with caching[^1]

**API Endpoints**:

```
GET /api/v1/search/vehicles
  ?source=Mumbai&destination=Delhi
  &date=2025-12-15&vehicleType=TRAIN
  &class=AC

GET /api/v1/vehicles/:id/availability
  ?date=2025-12-15&class=AC
```


### **3. Seat Inventory Service**

- **Responsibilities**: Real-time seat availability, locking, allocation[^4] [^5] [^1]
- **Features**:
    - Per-journey seat map with real-time status
    - Temporary seat locking (15-minute hold)[^5]
    - Concurrent booking prevention using distributed locks[^4]
    - RAC (Reservation Against Cancellation) and Waitlist management[^1]
    - Berth preference (Lower, Middle, Upper, Side)
    - Auto-release of expired locks
- **Concurrency**: Pessimistic locking with `SELECT FOR UPDATE SKIP LOCKED`[^4]
- **Algorithm**: Fair allocation considering preferences

**Seat States**:

```
AVAILABLE → LOCKED → CONFIRMED → OCCUPIED
           ↓
        EXPIRED (auto-release after 15 min)
           ↓
        AVAILABLE
```


### **4. Booking Service**

- **Responsibilities**: Create, manage, confirm bookings[^2] [^1]
- **Features**:
    - Multi-passenger booking support
    - PNR (Passenger Name Record) generation
    - Passenger details validation (Name, Age, Gender, ID)
    - Booking confirmation after payment
    - Partial booking (some confirmed, rest RAC/waitlist)[^1]
    - E-ticket generation (PDF)
- **Transaction**: SAGA pattern for distributed transactions
- **Performance**: <3s end-to-end booking

**Booking States**:

```
INITIATED → SEATS_LOCKED → PAYMENT_PENDING → CONFIRMED
              ↓                    ↓
           EXPIRED              FAILED → CANCELLED
```


### **5. Payment Service**

- **Responsibilities**: Payment processing, refunds[^1]
- **Features**:
    - Multiple payment methods (UPI, Cards, Wallets, Net Banking)[^1]
    - Payment gateway integration (Razorpay, Stripe)
    - Payment retry mechanism
    - Refund processing for cancellations
    - Transaction history
- **Security**: PCI-DSS compliance, tokenization
- **Performance**: <5s payment processing


### **6. Cancellation Service**

- **Responsibilities**: Handle booking cancellations, refunds[^1]
- **Features**:
    - Full/partial cancellation support
    - Dynamic cancellation fee calculation
    - Refund amount computation
    - Seat release back to inventory
    - RAC/Waitlist auto-confirmation on cancellation
- **Refund Rules**: Time-based (>24h: full, 12-24h: 50%, <12h: no refund)


### **7. Notification Service**

- **Responsibilities**: Multi-channel notifications[^2] [^1]
- **Features**:
    - Booking confirmation (SMS, Email, Push)
    - PNR status updates
    - **24-hour departure reminder** (scheduled job)
    - Payment status notifications
    - Cancellation confirmations
    - Seat upgrade notifications (RAC → Confirmed)
- **Channels**: SMS (Twilio), Email (SendGrid), Push Notifications
- **Delivery**: Async via message queue


### **8. Pricing Service**

- **Responsibilities**: Dynamic fare calculation[^1]
- **Features**:
    - Base fare by class/category
    - Dynamic pricing based on demand
    - Tatkal (last-minute) booking surcharge[^1]
    - Seasonal pricing
    - Tax and fee calculation
    - Discount/promo code application


### **9. Database Layer**

#### **Primary Database (PostgreSQL)**

- **Purpose**: Store users, bookings, vehicles, schedules[^1]
- **Sharding**: By vehicle operator or region
- **Replication**: Master-slave with 5+ read replicas[^1]
- **ACID**: Strong consistency for bookings and payments


#### **Cache Layer (Redis)**

- **Vehicle Search**: Popular routes cached (15-minute TTL)
- **Seat Availability**: Real-time sync with inventory
- **Seat Locks**: Distributed locks with TTL[^5] [^4]
- **Rate Limiting**: Per-user request counters


#### **Search Index (Elasticsearch)**

- **Purpose**: Fast vehicle search by route, date, class
- **Indexing**: Real-time updates via event stream


### **10. Background Jobs**

- **Departure Reminder Job**: Runs every hour, sends notifications 24h before departure
- **Seat Lock Expiry**: Releases expired locks every minute
- **Waitlist Processing**: Auto-confirms RAC/waitlist on cancellations
- **Schedule Sync**: Updates vehicle schedules from operators

***

## Key Workflows

### **Workflow 1: User Registration \& Authentication**

```
┌─────────────┐
│   User      │
│  Registers  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. Frontend sends registration request  │
│    POST /api/v1/auth/register            │
│    Body: {                               │
│      name: "John Doe",                   │
│      email: "john@example.com",          │
│      phone: "+919876543210",             │
│      password: "SecurePass123!"          │
│    }                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 2. Auth Service: Validate Input         │
│    - Email format validation             │
│    - Phone number validation (E.164)     │
│    - Password strength check             │
│    - Name validation                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 3. Check for Duplicate User             │
│    SELECT user_id FROM users             │
│    WHERE email = ? OR phone = ?          │
└──────┬──────────────────────────────────┘
       │
       ├─── Exists ───┐
       │              ▼
       │       ┌──────────────┐
       │       │ Return Error │
       │       │ "User exists"│
       │       └──────────────┘
       │
       └─── Not Exists ───┐
                          ▼
┌─────────────────────────────────────────┐
│ 4. Hash Password                        │
│    password_hash = bcrypt.hash(          │
│      password, saltRounds=10             │
│    )                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 5. Generate OTP for Phone Verification  │
│    otp = generateOTP(6)  // 6 digits     │
│    otp_hash = bcrypt.hash(otp, 10)       │
│    otp_expires = NOW() + 10 minutes      │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 6. Create User Record (Unverified)      │
│    BEGIN TRANSACTION                     │
│    INSERT INTO users (                   │
│      user_id, name, email, phone,        │
│      password_hash, is_verified,         │
│      created_at                          │
│    ) VALUES (                            │
│      UUID(), 'John Doe',                 │
│      'john@example.com',                 │
│      '+919876543210', $2b$10$...,        │
│      FALSE, NOW()                        │
│    )                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 7. Store OTP in Redis                   │
│    SET otp:+919876543210 {otp_hash}      │
│        EX 600  # 10 minutes              │
│    COMMIT TRANSACTION                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 8. Send OTP via SMS (Async)             │
│    kafka.publish('sms.send', {           │
│      phone: '+919876543210',             │
│      message: 'Your OTP is: 123456',     │
│      template: 'REGISTRATION_OTP'        │
│    })                                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 9. Return Response                      │
│    {                                     │
│      success: true,                      │
│      message: "OTP sent to phone",       │
│      userId,                             │
│      requiresVerification: true          │
│    }                                     │
└─────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 10. User submits OTP for verification   │
│     POST /api/v1/auth/verify-otp         │
│     Body: { phone, otp: "123456" }       │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 11. Verify OTP                          │
│     stored_hash = GET otp:+919876543210  │
│     if (bcrypt.compare(otp, stored_hash))│
│       UPDATE users SET is_verified=TRUE  │
│       WHERE phone = ?                    │
│       DEL otp:+919876543210              │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 12. Generate JWT Tokens                 │
│     accessToken = jwt.sign({             │
│       userId, email, phone               │
│     }, SECRET, { expiresIn: '1h' })      │
│                                          │
│     refreshToken = jwt.sign({ userId },  │
│       REFRESH_SECRET, { expiresIn: '7d' })│
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 13. Store Refresh Token in Redis        │
│     SET refresh_token:{userId} {token}   │
│         EX 604800  # 7 days              │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 14. Return Response                     │
│     {                                    │
│       success: true,                     │
│       user: { userId, name, email },     │
│       accessToken,                       │
│       refreshToken                       │
│     }                                    │
└─────────────────────────────────────────┘
```

**Performance**: <500ms registration + OTP[^1]

***

### **Workflow 2: Search Vehicles**

```
┌─────────────┐
│   User      │
│  Searches   │
│  Vehicles   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. Frontend sends search request        │
│    GET /api/v1/search/vehicles           │
│    ?source=Mumbai&destination=Delhi      │
│    &date=2025-12-15&vehicleType=TRAIN    │
│    &class=AC                             │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 2. API Gateway: Authenticate (Optional) │
│    - Check JWT if provided               │
│    - Allow guest searches                │
│    - Rate limit: 100 searches/hour       │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 3. Search Service: Validate & Normalize │
│    - Validate date >= today              │
│    - Normalize location codes            │
│      Mumbai → BOM, Delhi → DEL           │
│    - Validate vehicle type enum          │
│    - Validate class enum                 │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 4. Generate Cache Key                   │
│    key = "search:TRAIN:BOM:DEL:          │
│           2025-12-15:AC"                 │
│    GET {key}                             │
└──────┬──────────────────────────────────┘
       │
       ├─── Cache HIT (70% requests) ───┐
       │                                 ▼
       │                          ┌──────────────┐
       │                          │ Return cached│
       │                          │  results     │
       │                          │  <50ms       │
       │                          └──────┬───────┘
       │                                 │
       │                                 └───┐
       │                                     │
       └─── Cache MISS ───┐                 │
                          ▼                 │
┌─────────────────────────────────────────┐│
│ 5. Query Vehicles Database              ││
│    SELECT v.*, r.route_id, r.stops,      ││
│           s.departure_time, s.arrival_time││
│    FROM vehicles v                       ││
│    JOIN routes r ON v.vehicle_id         ││
│    JOIN schedules s ON v.vehicle_id      ││
│    WHERE r.source_code = 'BOM'           ││
│      AND r.destination_code = 'DEL'      ││
│      AND DATE(s.departure_time)          ││
│          = '2025-12-15'                  ││
│      AND v.vehicle_type = 'TRAIN'        ││
│      AND v.status = 'ACTIVE'             ││
│    ORDER BY s.departure_time             ││
│                                          ││
│    Results:                              ││
│    - Rajdhani Express (12951)            ││
│    - Shatabdi Express (12001)            ││
│    - Duronto Express (12217)             ││
│    ... (15 trains found)                 ││
└──────┬──────────────────────────────────┘│
       │                                    │
       ▼                                    │
┌─────────────────────────────────────────┐│
│ 6. Fetch Seat Availability (Parallel)   ││
│    For each vehicle:                     ││
│      SELECT class, available_seats,      ││
│             rac_available, wl_available  ││
│      FROM seat_inventory                 ││
│      WHERE vehicle_schedule_id = ?       ││
│        AND class = 'AC'                  ││
│        AND date = '2025-12-15'           ││
│                                          ││
│    Results:                              ││
│    Rajdhani: AC - 45 available           ││
│    Shatabdi: AC - 12 available           ││
│    Duronto: AC - 0 (RAC: 5, WL: 20)      ││
└──────┬──────────────────────────────────┘│
       │                                    │
       ▼                                    │
┌─────────────────────────────────────────┐│
│ 7. Fetch Pricing (Parallel)             ││
│    For each vehicle + class:             ││
│      SELECT base_fare, taxes, fees       ││
│      FROM pricing                        ││
│      WHERE vehicle_id = ?                ││
│        AND class = 'AC'                  ││
│        AND date = '2025-12-15'           ││
│                                          ││
│    Apply dynamic pricing:                ││
│      price = base_fare * demand_factor   ││
│                                          ││
│    Results:                              ││
│    Rajdhani: ₹1,500 (AC)                 ││
│    Shatabdi: ₹1,200 (AC)                 ││
│    Duronto: ₹1,800 (AC)                  ││
└──────┬──────────────────────────────────┘│
       │                                    │
       ▼                                    │
┌─────────────────────────────────────────┐│
│ 8. Enrich Vehicle Data                  ││
│    For each vehicle:                     ││
│      {                                   ││
│        vehicleId: "TRAIN_12951",         ││
│        vehicleName: "Rajdhani Express",  ││
│        vehicleNumber: "12951",           ││
│        vehicleType: "TRAIN",             ││
│        operator: "Indian Railways",      ││
│        source: {                         ││
│          code: "BOM",                    ││
│          name: "Mumbai Central",         ││
│          departureTime: "16:30:00"       ││
│        },                                ││
│        destination: {                    ││
│          code: "DEL",                    ││
│          name: "New Delhi",              ││
│          arrivalTime: "08:35:00" (next day)││
│        },                                ││
│        duration: "16h 5m",               ││
│        stops: 5,                         ││
│        availability: {                   ││
│          AC: { available: 45,            ││
│                rac: 10, waitlist: 0 },   ││
│          Sleeper: { available: 80,       ││
│                     rac: 15, waitlist: 0 }││
│        },                                ││
│        pricing: {                        ││
│          AC: { base: 1400, taxes: 80,    ││
│                fees: 20, total: 1500 },  ││
│          Sleeper: { total: 600 }         ││
│        },                                ││
│        amenities: ["WiFi", "Food",       ││
│                    "Blanket"]            ││
│      }                                   ││
└──────┬──────────────────────────────────┘│
       │                                    │
       ▼                                    │
┌─────────────────────────────────────────┐│
│ 9. Apply Filters & Sorting              ││
│    - Filter: Remove no-seat vehicles     ││
│    - Sort: By departure time (default)   ││
│    - Limit: Top 50 results               ││
└──────┬──────────────────────────────────┘│
       │                                    │
       ▼                                    │
┌─────────────────────────────────────────┐│
│ 10. Cache Results                       ││
│     SET "search:TRAIN:BOM:DEL:..."      ││
│         {vehicleResults}                 ││
│         EX 900  # 15 minutes             ││
└──────┬──────────────────────────────────┘│
       │                                    │
       ├────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 11. Return Response                     │
│     {                                    │
│       searchId: "SRCH_123456",           │
│       source: "Mumbai",                  │
│       destination: "Delhi",              │
│       date: "2025-12-15",                │
│       vehicleType: "TRAIN",              │
│       vehicles: [...],                   │
│       totalResults: 15                   │
│     }                                    │
└─────────────────────────────────────────┘
```

**Performance**: <500ms with cache, <2s without[^1]

***

### **Workflow 3: Book Seats**

```
┌─────────────┐
│   User      │
│   Books     │
│   Seats     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. User selects vehicle and seats       │
│    POST /api/v1/bookings                 │
│    Body: {                               │
│      vehicleScheduleId: "SCH_12951_15DEC"│
│      class: "AC",                        │
│      passengers: [                       │
│        { name: "John Doe", age: 35,      │
│          gender: "M", seatPreference:    │
│          "LOWER" },                      │
│        { name: "Jane Doe", age: 32,      │
│          gender: "F", seatPreference:    │
│          "LOWER" }                       │
│      ],                                  │
│      contactPhone: "+919876543210",      │
│      contactEmail: "john@example.com"    │
│    }                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 2. API Gateway: Authenticate            │
│    - Verify JWT token                    │
│    - Extract userId                      │
│    - Rate limit: 10 bookings/hour        │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 3. Booking Service: Validate Request    │
│    - Validate vehicle schedule exists    │
│    - Validate passenger count (1-6)      │
│    - Validate passenger details          │
│    - Check date >= today                 │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 4. Check Seat Availability              │
│    SELECT available_seats, rac_available,│
│           wl_available                   │
│    FROM seat_inventory                   │
│    WHERE vehicle_schedule_id = ?         │
│      AND class = 'AC'                    │
│      AND date = '2025-12-15'             │
│    FOR UPDATE  # Pessimistic lock        │
│                                          │
│    If available_seats >= 2:              │
│      Status = CONFIRMED                  │
│    Else if rac_available >= 2:           │
│      Status = RAC                        │
│    Else if wl_available >= 2:            │
│      Status = WAITLISTED                 │
│    Else:                                 │
│      Return "No seats available"         │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 5. Allocate Seats with Preference       │
│    SELECT seat_number, berth_type        │
│    FROM seats                            │
│    WHERE vehicle_schedule_id = ?         │
│      AND class = 'AC'                    │
│      AND status = 'AVAILABLE'            │
│      AND berth_type IN ('LOWER', 'MIDDLE')│
│    ORDER BY                              │
│      CASE WHEN berth_type = 'LOWER'      │
│           THEN 0 ELSE 1 END              │
│    LIMIT 2                               │
│    FOR UPDATE SKIP LOCKED # Concurrency  │
│                                          │
│    Allocated seats: 12A (Lower), 13B (Middle)│
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 6. Lock Seats with Distributed Lock     │
│    For each allocated seat:              │
│      SETNX seat:lock:SCH_12951:12A       │
│            {userId} EX 900  # 15 min     │
└──────┬──────────────────────────────────┘
       │
       ├─── Lock Failed ───┐
       │                   ▼
       │            ┌──────────────────┐
       │            │ Rollback & Retry │
       │            │ or Return Error  │
       │            └──────────────────┘
       │
       └─── Locks Acquired ───┐
                               ▼
┌─────────────────────────────────────────┐
│ 7. Generate PNR                         │
│    pnr = generatePNR()  # 10 digits      │
│    // Format: 1234567890                 │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 8. Create Booking Record                │
│    BEGIN TRANSACTION                     │
│    INSERT INTO bookings (                │
│      booking_id, pnr, user_id,           │
│      vehicle_schedule_id, class,         │
│      status, total_amount, passenger_count,│
│      contact_phone, contact_email,       │
│      created_at, expires_at              │
│    ) VALUES (                            │
│      UUID(), '1234567890', ?,            │
│      'SCH_12951_15DEC', 'AC',            │
│      'SEATS_LOCKED', 3000.00, 2,         │
│      '+919876543210', 'john@example.com',│
│      NOW(), NOW() + INTERVAL 15 MINUTE   │
│    )                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 9. Create Passenger Records             │
│    INSERT INTO booking_passengers (      │
│      booking_id, passenger_name, age,    │
│      gender, seat_number, berth_type     │
│    ) VALUES                              │
│      (?, 'John Doe', 35, 'M', '12A',     │
│       'LOWER'),                          │
│      (?, 'Jane Doe', 32, 'F', '13B',     │
│       'MIDDLE')                          │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 10. Update Seat Status                  │
│     UPDATE seats SET                     │
│       status = 'LOCKED',                 │
│       locked_by = ?,                     │
│       booking_id = ?,                    │
│       locked_at = NOW()                  │
│     WHERE seat_number IN ('12A', '13B')  │
│       AND vehicle_schedule_id = ?        │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 11. Update Seat Inventory               │
│     UPDATE seat_inventory SET            │
│       available_seats = available_seats-2│
│     WHERE vehicle_schedule_id = ?        │
│       AND class = 'AC'                   │
│     COMMIT TRANSACTION                   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 12. Calculate Pricing                   │
│     base_fare = 1400 * 2 = 2800          │
│     taxes = 80 * 2 = 160                 │
│     fees = 20 * 2 = 40                   │
│     total = 3000.00                      │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 13. Publish Events                      │
│     kafka.publish('booking.initiated', { │
│       bookingId, pnr, userId,            │
│       vehicleScheduleId, seats,          │
│       totalAmount: 3000, expiresAt       │
│     })                                   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 14. Return Booking Summary              │
│     {                                    │
│       bookingId, pnr: "1234567890",      │
│       status: "SEATS_LOCKED",            │
│       expiresAt: "2025-12-07T12:30:00Z", │
│       vehicleDetails: {...},             │
│       passengers: [...],                 │
│       seats: ["12A", "13B"],             │
│       totalAmount: 3000.00,              │
│       currency: "INR",                   │
│       paymentRequired: true,             │
│       paymentLink: "/payments/..."       │
│     }                                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 15. User proceeds to payment            │
│     POST /api/v1/payments                │
│     Body: { bookingId, paymentMethod }   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 16. Payment Service: Process Payment    │
│     - Call payment gateway (Razorpay)    │
│     - Await payment confirmation         │
└──────┬──────────────────────────────────┘
       │
       ├─── Payment Success ───┐
       │                       ▼
       │                ┌────────────────┐
       │                │ 17. Confirm    │
       │                │  Booking       │
       │                └────────┬───────┘
       │                         │
       │                         ▼
       │                ┌────────────────────┐
       │                │ UPDATE bookings    │
       │                │ SET status=        │
       │                │  'CONFIRMED'       │
       │                │ UPDATE seats       │
       │                │ SET status='BOOKED'│
       │                │ Release locks      │
       │                │ Generate e-ticket  │
       │                └────────┬───────────┘
       │                         │
       │                         ▼
       │                ┌────────────────────┐
       │                │ 18. Send           │
       │                │ Notifications      │
       │                │ - SMS: PNR+details │
       │                │ - Email: E-ticket  │
       │                └────────────────────┘
       │
       └─── Payment Failed ───┐
                              ▼
                       ┌────────────────┐
                       │ 19. Rollback   │
                       │ - Release seats│
                       │ - Update status│
                       │   = 'FAILED'   │
                       │ - Release locks│
                       └────────────────┘
```

**Performance**: <3s end-to-end with payment[^1]

***

### **Workflow 4: Cancel Booking**

```
┌─────────────┐
│   User      │
│  Cancels    │
│  Booking    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. User initiates cancellation          │
│    POST /api/v1/bookings/:id/cancel      │
│    Headers: { Authorization: Bearer JWT }│
│    Body: {                               │
│      reason: "Change of plans",          │
│      passengersToCancel: "ALL" // or IDs │
│    }                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 2. Authenticate & Validate              │
│    - Verify JWT token                    │
│    - Extract userId                      │
│    - Validate bookingId exists           │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 3. Fetch Booking Details                │
│    SELECT b.*, vs.departure_time         │
│    FROM bookings b                       │
│    JOIN vehicle_schedules vs             │
│      ON b.vehicle_schedule_id            │
│    WHERE b.booking_id = ?                │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 4. Validate Cancellation Eligibility    │
│    Check:                                │
│    - Booking belongs to user             │
│    - Status = 'CONFIRMED'                │
│    - Departure time > NOW()              │
│    - Not already cancelled               │
└──────┬──────────────────────────────────┘
       │
       ├─── Cannot Cancel ───┐
       │                     ▼
       │              ┌──────────────┐
       │              │ Return Error │
       │              │ with reason  │
       │              └──────────────┘
       │
       └─── Can Cancel ───┐
                          ▼
┌─────────────────────────────────────────┐
│ 5. Calculate Refund Amount              │
│    time_to_departure = departure_time    │
│                        - NOW()           │
│                                          │
│    original_amount = 3000.00             │
│                                          │
│    Cancellation Rules:                   │
│    if (time_to_departure > 24h):         │
│      cancellation_fee = 300.00 (10%)     │
│      refund = 2700.00                    │
│    else if (12h < time_to_departure < 24h):│
│      cancellation_fee = 1500.00 (50%)    │
│      refund = 1500.00                    │
│    else if (time_to_departure < 12h):    │
│      cancellation_fee = 3000.00 (100%)   │
│      refund = 0.00                       │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 6. Begin Cancellation Transaction       │
│    BEGIN TRANSACTION                     │
│    UPDATE bookings SET                   │
│      status = 'CANCELLED',               │
│      cancelled_at = NOW(),               │
│      cancellation_reason = ?,            │
│      refund_amount = 2700.00,            │
│      cancellation_fee = 300.00           │
│    WHERE booking_id = ?                  │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 7. Release Seats                        │
│    UPDATE seats SET                      │
│      status = 'AVAILABLE',               │
│      locked_by = NULL,                   │
│      booking_id = NULL                   │
│    WHERE booking_id = ?                  │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 8. Update Seat Inventory                │
│    UPDATE seat_inventory SET             │
│      available_seats = available_seats+2 │
│    WHERE vehicle_schedule_id = ?         │
│      AND class = 'AC'                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 9. Process Waitlist (If any)            │
│    SELECT booking_id, passenger_count    │
│    FROM bookings                         │
│    WHERE vehicle_schedule_id = ?         │
│      AND status IN ('RAC', 'WAITLISTED') │
│    ORDER BY created_at ASC               │
│    LIMIT 1                               │
│                                          │
│    If waitlist booking found:            │
│      Allocate released seats to waitlist │
│      UPDATE booking status to 'CONFIRMED'│
│      kafka.publish('booking.confirmed')  │
│    COMMIT TRANSACTION                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 10. Initiate Refund                     │
│     POST /api/v1/payments/refund         │
│     {                                    │
│       bookingId, paymentId,              │
│       refundAmount: 2700.00,             │
│       reason: "Booking cancellation"     │
│     }                                    │
│                                          │
│     Call payment gateway:                │
│     POST /refunds { amount: 270000 }     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 11. Publish Events                      │
│     kafka.publish('booking.cancelled', { │
│       bookingId, userId, pnr,            │
│       vehicleScheduleId,                 │
│       refundAmount: 2700.00,             │
│       seatsReleased: ['12A', '13B']      │
│     })                                   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 12. Send Notifications                  │
│     SMS:                                 │
│       "Booking PNR 1234567890 cancelled. │
│        Refund ₹2,700 in 5-7 days."       │
│                                          │
│     Email:                               │
│       Subject: "Cancellation Confirmed"  │
│       Body: Cancellation details,        │
│             refund breakdown             │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 13. Return Response                     │
│     {                                    │
│       success: true,                     │
│       bookingId, pnr,                    │
│       status: "CANCELLED",               │
│       cancellationFee: 300.00,           │
│       refundAmount: 2700.00,             │
│       refundETA: "5-7 business days",    │
│       cancelledAt                        │
│     }                                    │
└─────────────────────────────────────────┘
```

**Performance**: <2s cancellation[^1]

***

### **Workflow 5: Send Departure Reminders (24 Hours Before)**

```
┌─────────────┐
│   Cron Job  │
│  (Hourly)   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. Notification Scheduler Runs          │
│    Trigger: Every hour                   │
│    Time: XX:00:00                        │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 2. Query Upcoming Departures            │
│    SELECT b.booking_id, b.pnr, b.user_id,│
│           b.contact_phone, b.contact_email,│
│           vs.departure_time, v.vehicle_name,│
│           v.vehicle_number, r.source_name,│
│           r.destination_name,             │
│           GROUP_CONCAT(bp.passenger_name) │
│             AS passengers,                │
│           GROUP_CONCAT(bp.seat_number)    │
│             AS seats                      │
│    FROM bookings b                       │
│    JOIN vehicle_schedules vs             │
│      ON b.vehicle_schedule_id            │
│    JOIN vehicles v ON vs.vehicle_id      │
│    JOIN routes r ON vs.route_id          │
│    JOIN booking_passengers bp            │
│      ON b.booking_id = bp.booking_id     │
│    WHERE b.status = 'CONFIRMED'          │
│      AND vs.departure_time BETWEEN       │
│          NOW() + INTERVAL 23 HOUR AND    │
│          NOW() + INTERVAL 24 HOUR        │
│      AND b.reminder_sent = FALSE         │
│    GROUP BY b.booking_id                 │
│                                          │
│    Results: 15,000 bookings found        │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 3. Batch Process Reminders              │
│    Chunk bookings into batches of 1000   │
│    Process each batch in parallel        │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 4. For Each Booking in Batch            │
│    Generate reminder message:            │
│                                          │
│    SMS Template:                         │
│    "Reminder: Your journey on            │
│     Rajdhani Express (12951) from        │
│     Mumbai to Delhi departs tomorrow     │
│     at 16:30. PNR: 1234567890.           │
│     Seats: 12A, 13B. Bon voyage!"        │
│                                          │
│    Email Template:                       │
│    Subject: "Journey Reminder - PNR      │
│              1234567890"                 │
│    Body: Detailed journey information    │
│          with e-ticket attachment        │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 5. Publish Notification Events          │
│    For each booking:                     │
│      kafka.publish('notification.send', {│
│        type: 'DEPARTURE_REMINDER',       │
│        bookingId, userId,                │
│        channels: ['SMS', 'EMAIL'],       │
│        sms: {                            │
│          to: '+919876543210',            │
│          message: '...'                  │
│        },                                │
│        email: {                          │
│          to: 'john@example.com',         │
│          subject: '...',                 │
│          body: '...',                    │
│          attachments: ['eticket.pdf']    │
│        }                                 │
│      })                                  │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 6. Notification Service Consumes Events │
│    Kafka Consumer processes messages     │
│    from 'notification.send' topic        │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 7. Send SMS via Twilio                  │
│    POST https://api.twilio.com/2010-04-01│
│         /Accounts/{SID}/Messages.json    │
│    {                                     │
│      To: '+919876543210',                │
│      From: '+1234567890',                │
│      Body: 'Reminder: Your journey...'   │
│    }                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 8. Send Email via SendGrid              │
│    POST https://api.sendgrid.com/v3/mail/│
│         send                             │
│    {                                     │
│      from: { email: 'noreply@irctc.com' },│
│      personalizations: [{                │
│        to: [{ email: 'john@example.com' }],│
│        subject: 'Journey Reminder'       │
│      }],                                 │
│      content: [{ type: 'text/html',      │
│                  value: '...' }],        │
│      attachments: [{ content: base64,    │
│                      filename: 'ticket.pdf'│
│                   }]                     │
│    }                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 9. Update Reminder Status               │
│    UPDATE bookings SET                   │
│      reminder_sent = TRUE,               │
│      reminder_sent_at = NOW()            │
│    WHERE booking_id IN (...)             │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 10. Log Notification Delivery           │
│     INSERT INTO notification_logs (      │
│       booking_id, type, channel,         │
│       status, sent_at                    │
│     ) VALUES                             │
│       (?, 'DEPARTURE_REMINDER', 'SMS',   │
│        'DELIVERED', NOW()),              │
│       (?, 'DEPARTURE_REMINDER', 'EMAIL', │
│        'DELIVERED', NOW())               │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 11. Handle Failures (Retry Logic)       │
│     If SMS/Email fails:                  │
│       - Retry up to 3 times with         │
│         exponential backoff              │
│       - If all retries fail, log error   │
│       - Alert monitoring system          │
└─────────────────────────────────────────┘
```

**Schedule**: Runs every hour, processes 24h window
**Performance**: Processes 15,000+ reminders/hour[^1]

***

## Database Schema Design

### **Users Table**

```sql
CREATE TABLE users (
    user_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    is_verified BOOLEAN DEFAULT FALSE,
    status ENUM('ACTIVE', 'SUSPENDED', 'DELETED') DEFAULT 'ACTIVE',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_status (status)
);
```


### **Operators Table**

```sql
CREATE TABLE operators (
    operator_id INT PRIMARY KEY AUTO_INCREMENT,
    operator_name VARCHAR(100) NOT NULL,
    operator_type ENUM('RAILWAY', 'BUS', 'FLIGHT', 'FERRY') NOT NULL,
    
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_type (operator_type, is_active)
);
```


### **Vehicles Table**

```sql
CREATE TABLE vehicles (
    vehicle_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    operator_id INT NOT NULL,
    
    vehicle_number VARCHAR(50) NOT NULL COMMENT 'Train: 12951, Bus: MH12AB1234',
    vehicle_name VARCHAR(100) NOT NULL COMMENT 'Rajdhani Express, Volvo AC',
    vehicle_type ENUM('TRAIN', 'BUS', 'FLIGHT', 'FERRY') NOT NULL,
    
    -- Capacity
    total_capacity INT NOT NULL,
    seat_configuration JSON COMMENT 'Class-wise seat details',
    
    -- Amenities
    amenities JSON COMMENT '["WiFi", "Food", "AC", "Blanket"]',
    
    status ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE') DEFAULT 'ACTIVE',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (operator_id) REFERENCES operators(operator_id),
    
    INDEX idx_operator (operator_id, status),
    INDEX idx_type (vehicle_type, status),
    UNIQUE KEY unique_vehicle (operator_id, vehicle_number)
);
```


### **Locations Table**

```sql
CREATE TABLE locations (
    location_id INT PRIMARY KEY AUTO_INCREMENT,
    location_code CHAR(10) UNIQUE NOT NULL COMMENT 'BOM, DEL, MUM',
    location_name VARCHAR(100) NOT NULL,
    location_type ENUM('STATION', 'STOP', 'TERMINAL', 'DEPOT') NOT NULL,
    
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    country CHAR(2) DEFAULT 'IN',
    
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    is_active BOOLEAN DEFAULT TRUE,
    
    INDEX idx_code (location_code),
    INDEX idx_city (city, location_type)
);
```


### **Routes Table**

```sql
CREATE TABLE routes (
    route_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    vehicle_id BIGINT NOT NULL,
    
    source_location_id INT NOT NULL,
    destination_location_id INT NOT NULL,
    
    -- Route path
    stops JSON COMMENT 'Array of intermediate stops with times',
    distance_km INT,
    estimated_duration_minutes INT,
    
    is_active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id),
    FOREIGN KEY (source_location_id) REFERENCES locations(location_id),
    FOREIGN KEY (destination_location_id) REFERENCES locations(location_id),
    
    INDEX idx_route (source_location_id, destination_location_id, is_active),
    INDEX idx_vehicle (vehicle_id)
);
```


### **Vehicle Schedules Table**

```sql
CREATE TABLE vehicle_schedules (
    schedule_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    vehicle_id BIGINT NOT NULL,
    route_id BIGINT NOT NULL,
    
    -- Timing
    departure_time DATETIME NOT NULL,
    arrival_time DATETIME NOT NULL,
    
    -- Status
    status ENUM('SCHEDULED', 'DELAYED', 'DEPARTED', 
                'ARRIVED', 'CANCELLED') DEFAULT 'SCHEDULED',
    delay_minutes INT DEFAULT 0,
    
    -- Pricing reference
    base_pricing_id BIGINT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id),
    FOREIGN KEY (route_id) REFERENCES routes(route_id),
    
    INDEX idx_departure (departure_time, status),
    INDEX idx_vehicle_date (vehicle_id, departure_time),
    INDEX idx_route_date (route_id, departure_time)
);
```


### **Seat Inventory Table**

```sql
CREATE TABLE seat_inventory (
    inventory_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    schedule_id BIGINT NOT NULL,
    
    class ENUM('AC_1', 'AC_2', 'AC_3', 'SLEEPER', 
               'SEATER', 'GENERAL', 'BUSINESS', 'ECONOMY') NOT NULL,
    
    -- Availability
    total_seats INT NOT NULL,
    available_seats INT NOT NULL,
    booked_seats INT DEFAULT 0,
    
    -- RAC & Waitlist (mainly for trains)
    rac_total INT DEFAULT 0,
    rac_available INT DEFAULT 0,
    waitlist_total INT DEFAULT 0,
    waitlist_available INT DEFAULT 0,
    
    -- Version for optimistic locking
    version INT DEFAULT 1,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (schedule_id) REFERENCES vehicle_schedules(schedule_id) ON DELETE CASCADE,
    
    INDEX idx_schedule_class (schedule_id, class),
    
    UNIQUE KEY unique_inventory (schedule_id, class)
);
```


### **Seats Table**

```sql
CREATE TABLE seats (
    seat_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    schedule_id BIGINT NOT NULL,
    
    seat_number VARCHAR(10) NOT NULL COMMENT '12A, 15B, 23C',
    seat_row INT,
    seat_column CHAR(2),
    
    class ENUM('AC_1', 'AC_2', 'AC_3', 'SLEEPER', 
               'SEATER', 'GENERAL', 'BUSINESS', 'ECONOMY') NOT NULL,
    berth_type ENUM('LOWER', 'MIDDLE', 'UPPER', 'SIDE_LOWER', 
                    'SIDE_UPPER', 'SEAT') COMMENT 'For trains',
    
    -- Status
    status ENUM('AVAILABLE', 'LOCKED', 'BOOKED', 'BLOCKED') DEFAULT 'AVAILABLE',
    
    -- Lock info
    locked_by BIGINT COMMENT 'User ID',
    locked_at TIMESTAMP,
    
    -- Booking info
    booking_id BIGINT,
    
    -- Version for optimistic locking
    version INT DEFAULT 1,
    
    FOREIGN KEY (schedule_id) REFERENCES vehicle_schedules(schedule_id) ON DELETE CASCADE,
    
    INDEX idx_schedule_status (schedule_id, class, status),
    INDEX idx_booking (booking_id),
    
    UNIQUE KEY unique_seat (schedule_id, seat_number)
);
```


### **Bookings Table**

```sql
CREATE TABLE bookings (
    booking_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    pnr VARCHAR(10) UNIQUE NOT NULL,
    
    user_id BIGINT NOT NULL,
    schedule_id BIGINT NOT NULL,
    
    class ENUM('AC_1', 'AC_2', 'AC_3', 'SLEEPER', 
               'SEATER', 'GENERAL', 'BUSINESS', 'ECONOMY') NOT NULL,
    
    -- Status
    status ENUM('INITIATED', 'SEATS_LOCKED', 'PAYMENT_PENDING', 
                'CONFIRMED', 'RAC', 'WAITLISTED', 
                'CANCELLED', 'COMPLETED') DEFAULT 'INITIATED',
    
    -- Pricing
    base_fare DECIMAL(10, 2) NOT NULL,
    taxes DECIMAL(10, 2) DEFAULT 0,
    fees DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    currency CHAR(3) DEFAULT 'INR',
    
    -- Payment
    payment_id VARCHAR(100),
    payment_method ENUM('UPI', 'CARD', 'NET_BANKING', 'WALLET'),
    payment_status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'),
    
    -- Passengers
    passenger_count INT NOT NULL,
    
    -- Contact
    contact_phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    
    -- Cancellation
    cancellation_reason TEXT,
    cancellation_fee DECIMAL(10, 2),
    refund_amount DECIMAL(10, 2),
    
    -- Reminders
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP COMMENT 'Lock expiry',
    confirmed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (schedule_id) REFERENCES vehicle_schedules(schedule_id),
    
    INDEX idx_user (user_id, created_at DESC),
    INDEX idx_schedule (schedule_id, status),
    INDEX idx_pnr (pnr),
    INDEX idx_status (status, expires_at),
    INDEX idx_reminders (status, reminder_sent, schedule_id)
);

-- Partition by month
ALTER TABLE bookings PARTITION BY RANGE (YEAR(created_at) * 100 + MONTH(created_at)) (
    PARTITION p202412 VALUES LESS THAN (202501),
    PARTITION p202501 VALUES LESS THAN (202502),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```


### **Booking Passengers Table**

```sql
CREATE TABLE booking_passengers (
    passenger_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    booking_id BIGINT NOT NULL,
    
    passenger_name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    gender ENUM('M', 'F', 'O') NOT NULL,
    
    seat_number VARCHAR(10),
    berth_type ENUM('LOWER', 'MIDDLE', 'UPPER', 'SIDE_LOWER', 
                    'SIDE_UPPER', 'SEAT'),
    
    -- ID proof
    id_type ENUM('AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE'),
    id_number VARCHAR(50),
    
    -- Preferences
    meal_preference ENUM('VEG', 'NON_VEG', 'VEGAN'),
    seat_preference ENUM('LOWER', 'MIDDLE', 'UPPER', 'WINDOW', 'AISLE'),
    
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    
    INDEX idx_booking (booking_id)
);
```


### **Pricing Table**

```sql
CREATE TABLE pricing (
    pricing_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    vehicle_id BIGINT NOT NULL,
    
    class ENUM('AC_1', 'AC_2', 'AC_3', 'SLEEPER', 
               'SEATER', 'GENERAL', 'BUSINESS', 'ECONOMY') NOT NULL,
    
    base_fare DECIMAL(10, 2) NOT NULL,
    taxes DECIMAL(10, 2) DEFAULT 0,
    fees DECIMAL(10, 2) DEFAULT 0,
    
    -- Dynamic pricing
    surge_multiplier DECIMAL(3, 2) DEFAULT 1.00,
    
    -- Validity
    valid_from DATE,
    valid_until DATE,
    
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id),
    
    INDEX idx_vehicle_class (vehicle_id, class),
    INDEX idx_validity (valid_from, valid_until)
);
```


***

## Low-Level Design (LLD) - TypeScript

### **Domain Models**

```typescript
// Enums
enum VehicleType {
  TRAIN = 'TRAIN',
  BUS = 'BUS',
  FLIGHT = 'FLIGHT',
  FERRY = 'FERRY'
}

enum SeatClass {
  AC_1 = 'AC_1',
  AC_2 = 'AC_2',
  AC_3 = 'AC_3',
  SLEEPER = 'SLEEPER',
  SEATER = 'SEATER',
  BUSINESS = 'BUSINESS',
  ECONOMY = 'ECONOMY'
}

enum BookingStatus {
  INITIATED = 'INITIATED',
  SEATS_LOCKED = 'SEATS_LOCKED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  CONFIRMED = 'CONFIRMED',
  RAC = 'RAC',
  WAITLISTED = 'WAITLISTED',
  CANCELLED = 'CANCELLED'
}

enum SeatStatus {
  AVAILABLE = 'AVAILABLE',
  LOCKED = 'LOCKED',
  BOOKED = 'BOOKED',
  BLOCKED = 'BLOCKED'
}

// Interfaces
interface User {
  userId: string;
  name: string;
  email: string;
  phone: string;
  isVerified: boolean;
  status: string;
}

interface VehicleSchedule {
  scheduleId: string;
  vehicleId: string;
  routeId: string;
  departureTime: Date;
  arrivalTime: Date;
  status: string;
}

interface SearchRequest {
  source: string;
  destination: string;
  date: string;
  vehicleType: VehicleType;
  class?: SeatClass;
  passengers?: number;
}

interface SearchResult {
  scheduleId: string;
  vehicleName: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  departureTime: Date;
  arrivalTime: Date;
  duration: number;
  availability: {
    [key in SeatClass]?: {
      available: number;
      rac: number;
      waitlist: number;
    };
  };
  pricing: {
    [key in SeatClass]?: {
      baseFare: number;
      taxes: number;
      fees: number;
      total: number;
    };
  };
}

interface BookingRequest {
  userId: string;
  scheduleId: string;
  class: SeatClass;
  passengers: PassengerInfo[];
  contactPhone: string;
  contactEmail: string;
}

interface PassengerInfo {
  name: string;
  age: number;
  gender: 'M' | 'F' | 'O';
  seatPreference?: string;
  idType?: string;
  idNumber?: string;
}

interface Booking {
  bookingId: string;
  pnr: string;
  userId: string;
  scheduleId: string;
  status: BookingStatus;
  passengers: PassengerInfo[];
  seats: string[];
  totalAmount: number;
  currency: string;
  createdAt: Date;
  expiresAt?: Date;
}
```


### **PNR Generator**

```typescript
class PNRGenerator {
  static generate(): string {
    // Generate 10-digit PNR
    // Format: YYDDMMXXXX (Year, Day, Month, Random)
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `${year}${day}${month}${random}`;
  }

  static validate(pnr: string): boolean {
    return /^\d{10}$/.test(pnr);
  }
}
```


### **Authentication Service**

```typescript
interface IUserRepository {
  createUser(user: Partial<User>): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  updateVerificationStatus(userId: string, verified: boolean): Promise<void>;
}

interface IOTPService {
  generateOTP(length: number): string;
  sendSMS(phone: string, message: string): Promise<boolean>;
  storeOTP(phone: string, otp: string, ttl: number): Promise<void>;
  verifyOTP(phone: string, otp: string): Promise<boolean>;
}

class AuthService {
  constructor(
    private userRepository: IUserRepository,
    private otpService: IOTPService,
    private passwordHasher: IPasswordHasher,
    private jwtService: IJWTService
  ) {}

  async register(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<{ userId: string; requiresVerification: boolean }> {
    // Validate input
    this.validateRegistrationInput(data);

    // Check duplicates
    const existingEmail = await this.userRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new Error('Email already registered');
    }

    const existingPhone = await this.userRepository.findByPhone(data.phone);
    if (existingPhone) {
      throw new Error('Phone number already registered');
    }

    // Hash password
    const passwordHash = await this.passwordHasher.hash(data.password);

    // Create user
    const user = await this.userRepository.createUser({
      name: data.name,
      email: data.email,
      phone: data.phone,
      passwordHash,
      isVerified: false,
      status: 'ACTIVE'
    });

    // Generate and send OTP
    const otp = this.otpService.generateOTP(6);
    await this.otpService.storeOTP(data.phone, otp, 600); // 10 minutes
    await this.otpService.sendSMS(data.phone, `Your OTP is: ${otp}`);

    return {
      userId: user.userId,
      requiresVerification: true
    };
  }

  async verifyOTP(phone: string, otp: string): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
  }> {
    // Verify OTP
    const isValid = await this.otpService.verifyOTP(phone, otp);
    if (!isValid) {
      throw new Error('Invalid OTP');
    }

    // Get user
    const user = await this.userRepository.findByPhone(phone);
    if (!user) {
      throw new Error('User not found');
    }

    // Update verification status
    await this.userRepository.updateVerificationStatus(user.userId, true);

    // Generate tokens
    const accessToken = this.jwtService.generateAccessToken({
      userId: user.userId,
      email: user.email,
      phone: user.phone
    });

    const refreshToken = this.jwtService.generateRefreshToken({
      userId: user.userId
    });

    return { user, accessToken, refreshToken };
  }

  private validateRegistrationInput(data: any): void {
    if (!this.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }
    if (!this.isValidPhone(data.phone)) {
      throw new Error('Invalid phone number format');
    }
    if (!this.isValidPassword(data.password)) {
      throw new Error('Password must be at least 8 characters');
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isValidPhone(phone: string): boolean {
    return /^\+?[1-9]\d{9,14}$/.test(phone);
  }

  private isValidPassword(password: string): boolean {
    return password.length >= 8;
  }
}
```


### **Search Service**

```typescript
interface IVehicleRepository {
  searchSchedules(
    sourceId: number,
    destinationId: number,
    date: Date,
    vehicleType: VehicleType
  ): Promise<VehicleSchedule[]>;
  getAvailability(scheduleId: string, class: SeatClass): Promise<any>;
  getPricing(vehicleId: string, class: SeatClass, date: Date): Promise<any>;
}

interface ILocationRepository {
  findByCode(code: string): Promise<any>;
  findByName(name: string): Promise<any>;
}

class SearchService {
  constructor(
    private vehicleRepository: IVehicleRepository,
    private locationRepository: ILocationRepository,
    private cache: ICache
  ) {}

  async searchVehicles(request: SearchRequest): Promise<SearchResult[]> {
    // Validate request
    this.validateSearchRequest(request);

    // Normalize locations
    const source = await this.locationRepository.findByCode(request.source);
    const destination = await this.locationRepository.findByCode(request.destination);

    if (!source || !destination) {
      throw new Error('Invalid source or destination');
    }

    // Generate cache key
    const cacheKey = this.generateCacheKey(request);

    // Check cache
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Query schedules
    const schedules = await this.vehicleRepository.searchSchedules(
      source.locationId,
      destination.locationId,
      new Date(request.date),
      request.vehicleType
    );

    // Fetch availability and pricing in parallel
    const results = await Promise.all(
      schedules.map(async (schedule) => {
        const [availability, pricing] = await Promise.all([
          this.vehicleRepository.getAvailability(
            schedule.scheduleId,
            request.class || SeatClass.ECONOMY
          ),
          this.vehicleRepository.getPricing(
            schedule.vehicleId,
            request.class || SeatClass.ECONOMY,
            new Date(request.date)
          )
        ]);

        return this.enrichSchedule(schedule, availability, pricing);
      })
    );

    // Filter and sort
    const filtered = results.filter(r => r.availability.available > 0);
    const sorted = filtered.sort((a, b) => 
      a.departureTime.getTime() - b.departureTime.getTime()
    );

    // Cache results
    await this.cache.set(cacheKey, JSON.stringify(sorted), 900); // 15 min

    return sorted;
  }

  private enrichSchedule(schedule: any, availability: any, pricing: any): SearchResult {
    return {
      scheduleId: schedule.scheduleId,
      vehicleName: schedule.vehicleName,
      vehicleNumber: schedule.vehicleNumber,
      vehicleType: schedule.vehicleType,
      departureTime: schedule.departureTime,
      arrivalTime: schedule.arrivalTime,
      duration: this.calculateDuration(schedule.departureTime, schedule.arrivalTime),
      availability: {
        [availability.class]: {
          available: availability.availableSeats,
          rac: availability.racAvailable,
          waitlist: availability.waitlistAvailable
        }
      },
      pricing: {
        [pricing.class]: {
          baseFare: pricing.baseFare,
          taxes: pricing.taxes,
          fees: pricing.fees,
          total: pricing.baseFare + pricing.taxes + pricing.fees
        }
      }
    };
  }

  private validateSearchRequest(request: SearchRequest): void {
    if (!request.source || !request.destination) {
      throw new Error('Source and destination are required');
    }
    if (request.source === request.destination) {
      throw new Error('Source and destination cannot be the same');
    }
    const date = new Date(request.date);
    if (date < new Date()) {
      throw new Error('Date must be in the future');
    }
  }

  private calculateDuration(departure: Date, arrival: Date): number {
    return Math.floor((arrival.getTime() - departure.getTime()) / (1000 * 60));
  }

  private generateCacheKey(request: SearchRequest): string {
    return `search:${request.vehicleType}:${request.source}:${request.destination}:${request.date}:${request.class || 'ALL'}`;
  }
}
```


### **Seat Lock Manager (Distributed Locks)**

```typescript
interface IRedisClient {
  setnx(key: string, value: string, ttl: number): Promise<boolean>;
  del(key: string): Promise<void>;
  get(key: string): Promise<string | null>;
}

class SeatLockManager {
  private static readonly LOCK_TTL = 900; // 15 minutes in seconds

  constructor(private redis: IRedisClient) {}

  async lockSeats(
    scheduleId: string,
    seatNumbers: string[],
    userId: string
  ): Promise<boolean> {
    const locks: string[] = [];

    try {
      for (const seatNumber of seatNumbers) {
        const lockKey = this.getLockKey(scheduleId, seatNumber);
        const acquired = await this.redis.setnx(
          lockKey,
          userId,
          SeatLockManager.LOCK_TTL
        );

        if (!acquired) {
          // Rollback already acquired locks
          await this.releaseSeats(scheduleId, locks);
          return false;
        }

        locks.push(seatNumber);
      }

      return true;
    } catch (error) {
      // Rollback on error
      await this.releaseSeats(scheduleId, locks);
      throw error;
    }
  }

  async releaseSeats(scheduleId: string, seatNumbers: string[]): Promise<void> {
    for (const seatNumber of seatNumbers) {
      const lockKey = this.getLockKey(scheduleId, seatNumber);
      await this.redis.del(lockKey);
    }
  }

  async isLocked(scheduleId: string, seatNumber: string): Promise<boolean> {
    const lockKey = this.getLockKey(scheduleId, seatNumber);
    const value = await this.redis.get(lockKey);
    return value !== null;
  }

  private getLockKey(scheduleId: string, seatNumber: string): string {
    return `seat:lock:${scheduleId}:${seatNumber}`;
  }
}
```


### **Booking Service**

```typescript
interface IBookingRepository {
  createBooking(booking: Partial<Booking>): Promise<Booking>;
  updateStatus(bookingId: string, status: BookingStatus): Promise<void>;
  findById(bookingId: string): Promise<Booking | null>;
  findByPNR(pnr: string): Promise<Booking | null>;
}

interface ISeatRepository {
  allocateSeats(
    scheduleId: string,
    class: SeatClass,
    count: number,
    preferences: string[]
  ): Promise<string[]>;
  updateSeatStatus(
    scheduleId: string,
    seatNumbers: string[],
    status: SeatStatus,
    bookingId?: string
  ): Promise<void>;
}

interface ISeatInventoryRepository {
  updateAvailability(
    scheduleId: string,
    class: SeatClass,
    change: number
  ): Promise<void>;
}

class BookingService {
  constructor(
    private bookingRepository: IBookingRepository,
    private seatRepository: ISeatRepository,
    private inventoryRepository: ISeatInventoryRepository,
    private seatLockManager: SeatLockManager,
    private eventPublisher: IEventPublisher
  ) {}

  async createBooking(request: BookingRequest): Promise<Booking> {
    // Validate request
    this.validateBookingRequest(request);

    // Allocate seats based on preferences
    const allocatedSeats = await this.seatRepository.allocateSeats(
      request.scheduleId,
      request.class,
      request.passengers.length,
      request.passengers.map(p => p.seatPreference || '')
    );

    if (allocatedSeats.length !== request.passengers.length) {
      throw new Error('Unable to allocate required seats');
    }

    // Acquire distributed locks
    const locksAcquired = await this.seatLockManager.lockSeats(
      request.scheduleId,
      allocatedSeats,
      request.userId
    );

    if (!locksAcquired) {
      throw new Error('Seats are being booked by another user');
    }

    try {
      // Generate PNR
      const pnr = PNRGenerator.generate();

      // Calculate total amount
      const totalAmount = await this.calculateTotalAmount(
        request.scheduleId,
        request.class,
        request.passengers.length
      );

      // Create booking
      const booking = await this.bookingRepository.createBooking({
        pnr,
        userId: request.userId,
        scheduleId: request.scheduleId,
        class: request.class,
        status: BookingStatus.SEATS_LOCKED,
        passengers: request.passengers,
        seats: allocatedSeats,
        totalAmount,
        currency: 'INR',
        contactPhone: request.contactPhone,
        contactEmail: request.contactEmail,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      });

      // Update seat status
      await this.seatRepository.updateSeatStatus(
        request.scheduleId,
        allocatedSeats,
        SeatStatus.LOCKED,
        booking.bookingId
      );

      // Update inventory
      await this.inventoryRepository.updateAvailability(
        request.scheduleId,
        request.class,
        -request.passengers.length
      );

      // Publish event
      await this.eventPublisher.publish('booking.initiated', {
        bookingId: booking.bookingId,
        userId: request.userId,
        scheduleId: request.scheduleId,
        seats: allocatedSeats,
        timestamp: Date.now()
      });

      return booking;

    } catch (error) {
      // Rollback: Release locks
      await this.seatLockManager.releaseSeats(request.scheduleId, allocatedSeats);
      throw error;
    }
  }

  async confirmBooking(bookingId: string, paymentId: string): Promise<void> {
    const booking = await this.bookingRepository.findById(bookingId);

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status !== BookingStatus.SEATS_LOCKED) {
      throw new Error(`Cannot confirm booking with status: ${booking.status}`);
    }

    // Update booking status
    await this.bookingRepository.updateStatus(bookingId, BookingStatus.CONFIRMED);

    // Update seats to BOOKED
    await this.seatRepository.updateSeatStatus(
      booking.scheduleId,
      booking.seats,
      SeatStatus.BOOKED,
      bookingId
    );

    // Release distributed locks
    await this.seatLockManager.releaseSeats(booking.scheduleId, booking.seats);

    // Publish event
    await this.eventPublisher.publish('booking.confirmed', {
      bookingId,
      userId: booking.userId,
      pnr: booking.pnr,
      paymentId,
      timestamp: Date.now()
    });
  }

  private validateBookingRequest(request: BookingRequest): void {
    if (!request.scheduleId) {
      throw new Error('Schedule ID is required');
    }
    if (!request.passengers || request.passengers.length === 0) {
      throw new Error('At least one passenger is required');
    }
    if (request.passengers.length > 6) {
      throw new Error('Maximum 6 passengers allowed per booking');
    }
  }

  private async calculateTotalAmount(
    scheduleId: string,
    class: SeatClass,
    passengerCount: number
  ): Promise<number> {
    // Fetch pricing (implementation depends on repository)
    // For now, return a placeholder
    return 1500 * passengerCount;
  }
}
```


### **Notification Scheduler (Background Job)**

```typescript
interface IScheduleRepository {
  findUpcomingDepartures(
    startTime: Date,
    endTime: Date
  ): Promise<Array<{
    bookingId: string;
    pnr: string;
    userId: string;
    contactPhone: string;
    contactEmail: string;
    vehicleName: string;
    departureTime: Date;
    passengers: string[];
    seats: string[];
  }>>;
  markReminderSent(bookingIds: string[]): Promise<void>;
}

interface INotificationService {
  sendSMS(phone: string, message: string): Promise<boolean>;
  sendEmail(email: string, subject: string, body: string, attachments?: any[]): Promise<boolean>;
}

class NotificationScheduler {
  constructor(
    private scheduleRepository: IScheduleRepository,
    private notificationService: INotificationService
  ) {}

  async sendDepartureReminders(): Promise<void> {
    console.log('Running departure reminder job...');

    // Query bookings with departures in next 24 hours
    const startTime = new Date(Date.now() + 23 * 60 * 60 * 1000); // 23 hours
    const endTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const bookings = await this.scheduleRepository.findUpcomingDepartures(
      startTime,
      endTime
    );

    console.log(`Found ${bookings.length} bookings to notify`);

    // Process in batches
    const batchSize = 100;
    for (let i = 0; i < bookings.length; i += batchSize) {
      const batch = bookings.slice(i, i + batchSize);
      await this.processBatch(batch);
    }

    console.log('Departure reminder job completed');
  }

  private async processBatch(bookings: any[]): Promise<void> {
    const promises = bookings.map(booking => this.sendReminder(booking));
    await Promise.allSettled(promises);

    // Mark reminders as sent
    const bookingIds = bookings.map(b => b.bookingId);
    await this.scheduleRepository.markReminderSent(bookingIds);
  }

  private async sendReminder(booking: any): Promise<void> {
    const smsMessage = this.generateSMSMessage(booking);
    const emailSubject = `Journey Reminder - PNR ${booking.pnr}`;
    const emailBody = this.generateEmailBody(booking);

    await Promise.all([
      this.notificationService.sendSMS(booking.contactPhone, smsMessage),
      this.notificationService.sendEmail(
        booking.contactEmail,
        emailSubject,
        emailBody
      )
    ]);
  }

  private generateSMSMessage(booking: any): string {
    const depTime = booking.departureTime.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `Reminder: Your journey on ${booking.vehicleName} departs on ${depTime}. PNR: ${booking.pnr}. Seats: ${booking.seats.join(', ')}. Bon voyage!`;
  }

  private generateEmailBody(booking: any): string {
    const depTime = booking.departureTime.toLocaleString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <html>
        <body>
          <h2>Journey Reminder</h2>
          <p>Dear Passenger,</p>
          <p>This is a reminder for your upcoming journey:</p>
          
          <table style="border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; font-weight: bold;">PNR:</td>
              <td style="padding: 8px;">${booking.pnr}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Vehicle:</td>
              <td style="padding: 8px;">${booking.vehicleName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Departure:</td>
              <td style="padding: 8px;">${depTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Passengers:</td>
              <td style="padding: 8px;">${booking.passengers.join(', ')}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Seats:</td>
              <td style="padding: 8px;">${booking.seats.join(', ')}</td>
            </tr>
          </table>
          
          <p><strong>Important Instructions:</strong></p>
          <ul>
            <li>Please arrive at the station/terminal at least 30 minutes before departure</li>
            <li>Carry a valid ID proof for verification</li>
            <li>Your e-ticket is attached with this email</li>
          </ul>
          
          <p>Have a safe journey!</p>
          <p>Team IRCTC</p>
        </body>
      </html>
    `;
  }
}
```


### **Cancellation Service**

```typescript
interface ICancellationRepository {
  getCancellationRules(vehicleType: VehicleType): CancellationRules;
  processRefund(bookingId: string, amount: number): Promise<string>;
}

interface CancellationRules {
  beforeDeparture24h: { feePercentage: number; refundPercentage: number };
  beforeDeparture12h: { feePercentage: number; refundPercentage: number };
  beforeDeparture4h: { feePercentage: number; refundPercentage: number };
  afterDeparture: { feePercentage: number; refundPercentage: number };
}

class CancellationService {
  constructor(
    private bookingRepository: IBookingRepository,
    private seatRepository: ISeatRepository,
    private inventoryRepository: ISeatInventoryRepository,
    private cancellationRepository: ICancellationRepository,
    private eventPublisher: IEventPublisher
  ) {}

  async cancelBooking(
    bookingId: string,
    userId: string,
    reason: string
  ): Promise<{
    refundAmount: number;
    cancellationFee: number;
    refundETA: string;
  }> {
    // Fetch booking
    const booking = await this.bookingRepository.findById(bookingId);

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Validate ownership
    if (booking.userId !== userId) {
      throw new Error('Unauthorized to cancel this booking');
    }

    // Validate cancellation eligibility
    this.validateCancellation(booking);

    // Get schedule details for departure time
    const schedule = await this.getScheduleDetails(booking.scheduleId);

    // Calculate refund
    const { refundAmount, cancellationFee } = this.calculateRefund(
      booking.totalAmount,
      schedule.departureTime,
      schedule.vehicleType
    );

    // Begin cancellation transaction
    await this.processCancellation(
      booking,
      refundAmount,
      cancellationFee,
      reason
    );

    // Release seats
    await this.releaseSeatInventory(booking);

    // Process waitlist
    await this.processWaitlist(booking.scheduleId, booking.class, booking.seats.length);

    // Initiate refund
    if (refundAmount > 0) {
      await this.cancellationRepository.processRefund(bookingId, refundAmount);
    }

    // Publish event
    await this.eventPublisher.publish('booking.cancelled', {
      bookingId,
      userId,
      pnr: booking.pnr,
      refundAmount,
      cancellationFee,
      seatsReleased: booking.seats,
      timestamp: Date.now()
    });

    return {
      refundAmount,
      cancellationFee,
      refundETA: '5-7 business days'
    };
  }

  private validateCancellation(booking: Booking): void {
    if (booking.status === BookingStatus.CANCELLED) {
      throw new Error('Booking already cancelled');
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new Error(`Cannot cancel booking with status: ${booking.status}`);
    }
  }

  private calculateRefund(
    totalAmount: number,
    departureTime: Date,
    vehicleType: VehicleType
  ): { refundAmount: number; cancellationFee: number } {
    const now = new Date();
    const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    let cancellationFeePercentage = 0;

    // Time-based cancellation rules
    if (hoursUntilDeparture > 24) {
      cancellationFeePercentage = 10; // 10% fee
    } else if (hoursUntilDeparture > 12) {
      cancellationFeePercentage = 25; // 25% fee
    } else if (hoursUntilDeparture > 4) {
      cancellationFeePercentage = 50; // 50% fee
    } else if (hoursUntilDeparture > 0) {
      cancellationFeePercentage = 75; // 75% fee
    } else {
      cancellationFeePercentage = 100; // No refund
    }

    const cancellationFee = (totalAmount * cancellationFeePercentage) / 100;
    const refundAmount = totalAmount - cancellationFee;

    return { refundAmount, cancellationFee };
  }

  private async processCancellation(
    booking: Booking,
    refundAmount: number,
    cancellationFee: number,
    reason: string
  ): Promise<void> {
    // Update booking status
    await this.bookingRepository.updateStatus(booking.bookingId, BookingStatus.CANCELLED);

    // Update cancellation details
    await this.bookingRepository.updateCancellationDetails(
      booking.bookingId,
      {
        cancellationReason: reason,
        cancellationFee,
        refundAmount,
        cancelledAt: new Date()
      }
    );

    // Update seat status
    await this.seatRepository.updateSeatStatus(
      booking.scheduleId,
      booking.seats,
      SeatStatus.AVAILABLE
    );
  }

  private async releaseSeatInventory(booking: Booking): Promise<void> {
    await this.inventoryRepository.updateAvailability(
      booking.scheduleId,
      booking.class,
      booking.seats.length // Positive to increase availability
    );
  }

  private async processWaitlist(
    scheduleId: string,
    class: SeatClass,
    seatsReleased: number
  ): Promise<void> {
    // Find waitlisted/RAC bookings
    const waitlistBookings = await this.bookingRepository.findWaitlistedBookings(
      scheduleId,
      class,
      seatsReleased
    );

    // Auto-confirm waitlist bookings
    for (const wlBooking of waitlistBookings) {
      await this.autoConfirmWaitlist(wlBooking);
    }
  }

  private async autoConfirmWaitlist(booking: Booking): Promise<void> {
    // Allocate seats
    const allocatedSeats = await this.seatRepository.allocateSeats(
      booking.scheduleId,
      booking.class,
      booking.seats.length,
      []
    );

    if (allocatedSeats.length === booking.seats.length) {
      // Update booking status
      await this.bookingRepository.updateStatus(booking.bookingId, BookingStatus.CONFIRMED);

      // Update seats
      await this.bookingRepository.updateSeats(booking.bookingId, allocatedSeats);

      // Publish event
      await this.eventPublisher.publish('booking.confirmed_from_waitlist', {
        bookingId: booking.bookingId,
        userId: booking.userId,
        pnr: booking.pnr,
        seats: allocatedSeats,
        timestamp: Date.now()
      });
    }
  }

  private async getScheduleDetails(scheduleId: string): Promise<any> {
    // Implementation to fetch schedule details
    // For now, return placeholder
    return {
      departureTime: new Date(),
      vehicleType: VehicleType.TRAIN
    };
  }
}
```


### **Express Controller (API Layer)**

```typescript
import express, { Request, Response, NextFunction } from 'express';

// Middleware for authentication
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    phone: string;
  };
}

class BookingController {
  constructor(
    private authService: AuthService,
    private searchService: SearchService,
    private bookingService: BookingService,
    private cancellationService: CancellationService
  ) {}

  // POST /api/v1/auth/register
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, phone, password } = req.body;

      const result = await this.authService.register({
        name,
        email,
        phone,
        password
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'OTP sent to your phone number'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // POST /api/v1/auth/verify-otp
  async verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone, otp } = req.body;

      const result = await this.authService.verifyOTP(phone, otp);

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // GET /api/v1/search/vehicles
  async searchVehicles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const searchRequest: SearchRequest = {
        source: req.query.source as string,
        destination: req.query.destination as string,
        date: req.query.date as string,
        vehicleType: req.query.vehicleType as VehicleType,
        class: req.query.class as SeatClass,
        passengers: parseInt(req.query.passengers as string) || 1
      };

      const results = await this.searchService.searchVehicles(searchRequest);

      res.status(200).json({
        success: true,
        data: {
          vehicles: results,
          totalResults: results.length
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // POST /api/v1/bookings
  async createBooking(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const bookingRequest: BookingRequest = {
        userId: req.user.userId,
        scheduleId: req.body.scheduleId,
        class: req.body.class,
        passengers: req.body.passengers,
        contactPhone: req.body.contactPhone,
        contactEmail: req.body.contactEmail
      };

      const booking = await this.bookingService.createBooking(bookingRequest);

      res.status(201).json({
        success: true,
        data: {
          booking,
          message: 'Seats locked. Please complete payment within 15 minutes.'
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // POST /api/v1/bookings/:id/confirm
  async confirmBooking(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const { id: bookingId } = req.params;
      const { paymentId } = req.body;

      await this.bookingService.confirmBooking(bookingId, paymentId);

      res.status(200).json({
        success: true,
        message: 'Booking confirmed successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // POST /api/v1/bookings/:id/cancel
  async cancelBooking(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const { id: bookingId } = req.params;
      const { reason } = req.body;

      const result = await this.cancellationService.cancelBooking(
        bookingId,
        req.user.userId,
        reason || 'User requested cancellation'
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'Booking cancelled successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // GET /api/v1/bookings/:id
  async getBooking(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const { id: bookingId } = req.params;
      const booking = await this.bookingService.getBookingById(bookingId);

      if (!booking) {
        res.status(404).json({
          success: false,
          error: 'Booking not found'
        });
        return;
      }

      // Verify ownership
      if (booking.userId !== req.user.userId) {
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: booking
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // GET /api/v1/bookings/pnr/:pnr
  async getBookingByPNR(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pnr } = req.params;
      const booking = await this.bookingService.getBookingByPNR(pnr);

      if (!booking) {
        res.status(404).json({
          success: false,
          error: 'Booking not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: booking
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}

// Router setup
export function setupRoutes(
  authService: AuthService,
  searchService: SearchService,
  bookingService: BookingService,
  cancellationService: CancellationService,
  authMiddleware: any
): express.Router {
  const router = express.Router();
  const controller = new BookingController(
    authService,
    searchService,
    bookingService,
    cancellationService
  );

  // Public routes
  router.post('/auth/register', (req, res, next) => controller.register(req, res, next));
  router.post('/auth/verify-otp', (req, res, next) => controller.verifyOTP(req, res, next));
  router.get('/search/vehicles', (req, res, next) => controller.searchVehicles(req, res, next));
  router.get('/bookings/pnr/:pnr', (req, res, next) => controller.getBookingByPNR(req, res, next));

  // Protected routes (require authentication)
  router.post('/bookings', authMiddleware, (req, res, next) => controller.createBooking(req, res, next));
  router.post('/bookings/:id/confirm', authMiddleware, (req, res, next) => controller.confirmBooking(req, res, next));
  router.post('/bookings/:id/cancel', authMiddleware, (req, res, next) => controller.cancelBooking(req, res, next));
  router.get('/bookings/:id', authMiddleware, (req, res, next) => controller.getBooking(req, res, next));

  return router;
}
```


***

## Key Design Patterns \& Optimizations

### **1. Concurrency Control**

- **Pessimistic Locking**: `SELECT FOR UPDATE SKIP LOCKED` prevents double booking[^4] [^5]
- **Distributed Locks**: Redis SETNX for seat locking across multiple servers[^4]
- **Optimistic Locking**: Version numbers in seat_inventory table


### **2. Scalability Features**

- **Database Sharding**: Partition bookings by date/region[^1]
- **Read Replicas**: 5+ replicas for search queries[^1]
- **Caching Strategy**:
    - L1 (Redis): Hot routes, seat availability (15-min TTL)
    - L2 (CDN): Static content, images
- **Message Queue**: Kafka for async processing (notifications, analytics)


### **3. High Availability**

- **Circuit Breaker**: Fail fast on external service failures
- **Retry Logic**: Exponential backoff for transient failures
- **Health Checks**: Liveness and readiness probes
- **Rate Limiting**: Prevent abuse (100 searches/hour, 10 bookings/hour)


### **4. Data Consistency**

- **SAGA Pattern**: Distributed transactions with compensating actions[^1]
- **Event Sourcing**: Track all booking state changes
- **Idempotency**: Prevent duplicate bookings with unique request IDs


### **5. Performance Optimizations**

- **Database Indexes**: Composite indexes on frequently queried columns
- **Query Optimization**: Avoid N+1 queries with JOINs
- **Connection Pooling**: Reuse database connections
- **Batch Processing**: Process notifications in batches of 1000


### **6. Security**

- **JWT Authentication**: Stateless token-based auth
- **OTP Verification**: Two-factor authentication via SMS
- **Rate Limiting**: Prevent brute force attacks
- **Input Validation**: Sanitize all user inputs
- **SQL Injection Prevention**: Parameterized queries

***

## System Characteristics

**Performance Metrics**:[^2] [^3] [^1]

- **Search Latency**: <500ms with cache, <2s without
- **Booking Creation**: <3s end-to-end including payment
- **Cancellation**: <2s with refund initiation
- **Notification Delivery**: 15,000+ reminders/hour
- **Concurrent Users**: 100,000+ simultaneous users
- **Peak Throughput**: 10,000 bookings/minute

**Availability**: 99.9% uptime with multi-region deployment[^1]

**Scalability**: Horizontal scaling with load balancers, supports 10M+ daily bookings[^3] [^1]

**Data Volume**:

- 50M+ bookings/month
- 1TB+ data storage
- 500M+ searches/day

This design provides a **generic, extensible platform** that can be adapted for trains (IRCTC), buses (RedBus), flights, ferries, or any transportation booking system with minimal modifications to the core architecture.[^3] [^1]

<div align="center">⁂</div>

[^1]: https://getsdeready.com/irctc-system-design/
[^2]: https://www.youtube.com/watch?v=x1zR0Q-VWQI
[^3]: https://interviewready.io/blog/system-design-of-irctc
[^4]: https://github.com/varunTyagarayanG/SystemDesign101-Concurrent-Ticket-Booking-System
[^5]: https://www.slmanju.com/2021/10/case-study-how-to-handle-concurrent.html
[^6]: https://www.geeksforgeeks.org/software-engineering/online-railway-ticket-reservation-system/
[^7]: https://www.scribd.com/document/843012955/Unit-3-Case-Study-IRCTC
[^8]: https://fuselabcreative.com/transportation-app-ui-ux-design-best-practices/
[^9]: https://www.slideshare.net/slideshow/system-modeling-and-achitecture-design/87746434
[^10]: https://onix-systems.com/blog/how-to-make-a-booking-website-for-a-tourism-business```

