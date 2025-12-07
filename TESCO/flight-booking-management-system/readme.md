## Flight Booking Management System

### **System Architecture**

```
┌──────────────────────────────────────────────────────────────┐
│                  CDN + Load Balancer (Global)                 │
│              (Geographic Traffic Distribution)                │
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
│              API Gateway (Rate Limiting, Auth)            │
└───────────────────────────┬───────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼─────┐      ┌─────▼──────┐     ┌─────▼──────┐
   │ Search   │      │  Booking   │     │  Payment   │
   │ Service  │      │  Service   │     │  Service   │
   └────┬─────┘      └─────┬──────┘     └─────┬──────┘
        │                  │                   │
   ┌────▼─────┐      ┌─────▼──────┐     ┌─────▼──────┐
   │ Flight   │      │   Seat     │     │ Payment    │
   │  Cache   │      │ Inventory  │     │ Gateway    │
   │(Elastic) │      │  Service   │     │(Stripe/Pay)│
   └────┬─────┘      └─────┬──────┘     └────────────┘
        │                  │
   ┌────▼─────┐      ┌─────▼──────┐
   │ Flight   │      │   Redis    │
   │   DB     │      │Distributed │
   │(Primary) │      │   Locks    │
   └────┬─────┘      └─────┬──────┘
        │                  │
   ┌────▼─────┐      ┌─────▼──────┐
   │  Read    │      │   Seat     │
   │ Replicas │      │   State    │
   │          │      │    DB      │
   └──────────┘      └────────────┘

┌──────────────────────────────────────────────────────────┐
│            Ancillary Services                             │
├──────────────┬────────────┬──────────────┬───────────────┤
│ Notification │ Check-in   │   Pricing    │  Analytics    │
│   Service    │  Service   │   Service    │   Service     │
└──────────────┴────────────┴──────────────┴───────────────┘

┌──────────────────────────────────────────────────────────┐
│       Event Stream (Kafka)                                │
│  Topics: bookings, seat-locks, payments, notifications   │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│    Background Jobs                                        │
│  - Price updates, Schedule sync, Seat release            │
└──────────────────────────────────────────────────────────┘
```


***

## Key Components

### **1. Search Service**

- **Responsibilities**: Flight search, filtering, sorting[^2] [^1]
- **Features**:
    - Multi-city and round-trip search
    - Filter by price, duration, stops, airlines, time
    - Cache popular routes (NYC→LAX, LON→PAR)
    - Price prediction and trends
    - Flexible date search (±3 days)
- **Performance**: <500ms search response[^1]
- **Data Source**: GDS (Global Distribution System), NDC (New Distribution Capability)[^2]

**API Endpoints**:

```
GET /api/v1/flights/search
  ?origin=JFK&destination=LAX&date=2025-12-15
  &passengers=2&class=economy&stops=direct

GET /api/v1/flights/:flightId/details
GET /api/v1/flights/popular-routes
```


### **2. Seat Inventory Service**

- **Responsibilities**: Real-time seat availability, inventory management[^4] [^5]
- **Features**:
    - Per-flight seat map with real-time status
    - Seat locking during booking process (5-15 min hold)[^3]
    - Overbooking management
    - Dynamic pricing per seat
    - Class-based allocation (Economy, Business, First)
- **Concurrency**: Distributed locks (Redis) to prevent double booking[^3]
- **Algorithm**: Expected Marginal Seat Revenue (EMSR) for optimization[^5] [^4]

**Seat States**:

```
AVAILABLE → LOCKED → BOOKED → CHECKED_IN
           ↓
        EXPIRED (timeout)
```


### **3. Booking Service**

- **Responsibilities**: Manage booking lifecycle, PNR generation[^1] [^3]
- **Features**:
    - Create, modify, cancel bookings
    - PNR (Passenger Name Record) generation
    - Multi-passenger bookings
    - Ancillary services (meals, baggage, insurance)
    - Booking confirmation emails/SMS
- **Transaction Pattern**: SAGA pattern for distributed transactions[^3]
- **Performance**: <2s booking creation

**Booking States**:

```
INITIATED → SEATS_LOCKED → PAYMENT_PENDING → CONFIRMED
              ↓                    ↓
           EXPIRED              FAILED → CANCELLED
```


### **4. Payment Service**

- **Responsibilities**: Payment processing, refunds[^6] [^1]
- **Features**:
    - Multiple payment methods (card, wallet, net banking)
    - PCI-DSS compliant payment gateway integration
    - Split payments support
    - Refund processing for cancellations
    - Payment retry mechanism
- **Security**: Tokenization, encryption, fraud detection
- **Performance**: <3s payment processing


### **5. Pricing Service**

- **Responsibilities**: Dynamic pricing, fare rules[^4] [^5]
- **Features**:
    - Dynamic pricing based on demand
    - Fare class management (Economy, Premium Economy, Business, First)
    - Promotional pricing and discounts
    - Tax and fee calculation
    - Fare rules and restrictions
- **Algorithm**: Machine learning for revenue optimization[^4]


### **6. Check-in Service**

- **Responsibilities**: Web/mobile check-in, boarding pass generation[^2]
- **Features**:
    - Online check-in (24-48 hours before departure)
    - Seat selection during check-in
    - Boarding pass generation (PDF, mobile wallet)
    - Baggage tag printing
    - Integration with DCS (Departure Control System)[^2]
- **Window**: Opens 24-48 hours before departure


### **7. Notification Service**

- **Responsibilities**: Multi-channel notifications[^1]
- **Channels**:
    - Email (booking confirmation, reminders, updates)
    - SMS (PNR, gate changes, delays)
    - Push notifications (flight status, promotions)
    - WhatsApp (boarding pass, updates)
- **Timing**: Real-time and scheduled notifications


### **8. Database Layer**

#### **Flight Database (PostgreSQL/MySQL)**

- **Purpose**: Store flight schedules, routes, airlines[^6]
- **Sharding**: By airline or route
- **Replication**: 5+ read replicas for search queries


#### **Booking Database (PostgreSQL)**

- **Purpose**: Store bookings, passengers, PNRs[^6]
- **Partitioning**: By booking date (monthly)
- **ACID**: Strong consistency for booking transactions


#### **Seat Inventory Database**

- **Purpose**: Real-time seat state per flight
- **Technology**: Redis for hot data, PostgreSQL for persistence
- **Concurrency**: Optimistic locking with version numbers


### **9. Caching Layer (Redis/Elasticsearch)**

- **Flight Search Cache**: Popular routes cached for 15-30 minutes
- **Seat Availability Cache**: Real-time sync with inventory DB
- **User Session Cache**: Hold temporary seat locks
- **Price Cache**: Fare snapshots with short TTL (5 min)


### **10. Event Streaming (Kafka)**

- **Topics**:
    - `flight.scheduled` - New flight schedules
    - `booking.created` - New booking events
    - `seat.locked` - Seat lock events
    - `payment.completed` - Payment confirmations
    - `flight.delayed` - Flight status updates
- **Consumers**: Notification service, analytics, audit logs

***

## Key Workflows

### **Workflow 1: Flight Search**

```
┌─────────────┐
│   User      │
│ Searches    │
│  Flights    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. Frontend sends search request        │
│    GET /api/v1/flights/search            │
│    ?origin=JFK&destination=LAX           │
│    &date=2025-12-15&passengers=2         │
│    &class=economy                        │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 2. API Gateway: Validate & Rate Limit   │
│    - Check user authentication           │
│    - Rate limit: 100 searches/hour       │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 3. Search Service: Parse & Normalize    │
│    - Parse date: 2025-12-15              │
│    - Validate airport codes (IATA)       │
│    - Validate passenger count (1-9)      │
│    - Normalize class: economy → Y        │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 4. Check Elasticsearch Cache            │
│    key = "search:JFK:LAX:2025-12-15:2:Y" │
│    TTL = 15 minutes                      │
└──────┬──────────────────────────────────┘
       │
       ├─── Cache HIT (60% requests) ───┐
       │                                 ▼
       │                          ┌──────────────┐
       │                          │ Return cached│
       │                          │  flights     │
       │                          │  <100ms      │
       │                          └──────┬───────┘
       │                                 │
       │                                 └───┐
       │                                     │
       └─── Cache MISS ───┐                 │
                          ▼                 │
┌─────────────────────────────────────────┐│
│ 5. Query Flight Database                ││
│    SELECT f.*, a.airline_name,           ││
│           dep_ap.airport_name AS origin, ││
│           arr_ap.airport_name AS dest    ││
│    FROM flights f                        ││
│    JOIN airlines a ON f.airline_id       ││
│    JOIN airports dep_ap ON f.origin      ││
│    JOIN airports arr_ap ON f.destination ││
│    WHERE f.origin_code = 'JFK'           ││
│      AND f.destination_code = 'LAX'      ││
│      AND DATE(f.departure_time)          ││
│          = '2025-12-15'                  ││
│      AND f.status = 'SCHEDULED'          ││
│    ORDER BY f.departure_time             ││
└──────┬──────────────────────────────────┘│
       │                                    │
       ▼                                    │
┌─────────────────────────────────────────┐│
│ 6. Check Seat Availability (Parallel)   ││
│    For each flight:                      ││
│      GET seat_availability               ││
│      WHERE flight_id = ? AND class = 'Y' ││
│      AND status = 'AVAILABLE'            ││
│                                          ││
│    Results:                              ││
│    Flight AA101: 45 seats available      ││
│    Flight UA205: 12 seats available      ││
│    Flight DL308: 89 seats available      ││
└──────┬──────────────────────────────────┘│
       │                                    │
       ▼                                    │
┌─────────────────────────────────────────┐│
│ 7. Fetch Pricing (Parallel)             ││
│    For each flight:                      ││
│      SELECT base_price, taxes, fees      ││
│      FROM flight_pricing                 ││
│      WHERE flight_id = ?                 ││
│        AND fare_class = 'Y'              ││
│        AND booking_date = CURDATE()      ││
│                                          ││
│    Apply dynamic pricing:                ││
│      price = base_price * demand_factor  ││
│             * days_to_departure_factor   ││
└──────┬──────────────────────────────────┘│
       │                                    │
       ▼                                    │
┌─────────────────────────────────────────┐│
│ 8. Enrich Flight Data                   ││
│    For each flight:                      ││
│      {                                   ││
│        flightId: "AA101",                ││
│        flightNumber: "AA 101",           ││
│        airline: "American Airlines",     ││
│        origin: { code: "JFK",            ││
│                  name: "JFK Airport",    ││
│                  city: "New York" },     ││
│        destination: { code: "LAX", ... },││
│        departure: "2025-12-15T08:00:00Z",││
│        arrival: "2025-12-15T11:30:00Z",  ││
│        duration: "5h 30m",               ││
│        stops: 0,                         ││
│        availableSeats: 45,               ││
│        price: {                          ││
│          base: 250.00,                   ││
│          taxes: 35.50,                   ││
│          fees: 10.00,                    ││
│          total: 295.50,                  ││
│          currency: "USD"                 ││
│        },                                ││
│        cabinClass: "Economy",            ││
│        aircraft: "Boeing 737-800"        ││
│      }                                   ││
└──────┬──────────────────────────────────┘│
       │                                    │
       ▼                                    │
┌─────────────────────────────────────────┐│
│ 9. Apply Filters & Sorting              ││
│    - Filter: Remove flights with 0 seats││
│    - Sort: By price, duration, departure││
│    - Limit: Top 50 results              ││
└──────┬──────────────────────────────────┘│
       │                                    │
       ▼                                    │
┌─────────────────────────────────────────┐│
│ 10. Cache Results                       ││
│     SET "search:JFK:LAX:..."            ││
│         {flightResults}                  ││
│         EX 900  # 15 minutes             ││
└──────┬──────────────────────────────────┘│
       │                                    │
       ├────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 11. Return Response                     │
│     {                                    │
│       searchId: "SRCH_12345",            │
│       origin: "JFK",                     │
│       destination: "LAX",                │
│       date: "2025-12-15",                │
│       flights: [...],                    │
│       totalResults: 15,                  │
│       currency: "USD"                    │
│     }                                    │
└─────────────────────────────────────────┘
```

**Performance**: <500ms[^1]

***

### **Workflow 2: Seat Selection and Booking**

```
┌─────────────┐
│   User      │
│  Selects    │
│   Flight    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. User proceeds to seat selection      │
│    GET /api/v1/flights/:flightId/seats   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 2. Fetch Seat Map                       │
│    SELECT seat_number, seat_row,         │
│           seat_column, seat_type,        │
│           status, extra_charge           │
│    FROM seats                            │
│    WHERE flight_id = ? AND class = 'Y'   │
│                                          │
│    Seat Map:                             │
│    Row 1: [1A-Window-$50] [1B-Middle]    │
│           [1C-Aisle]                     │
│    Row 2: [2A-Window] [2B-Middle-LOCKED] │
│           [2C-Aisle]                     │
│    ...                                   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 3. User selects seat 12A                │
│    POST /api/v1/bookings/initiate        │
│    Body: {                               │
│      flightId: "AA101",                  │
│      passengers: [                       │
│        { name: "John Doe",               │
│          seat: "12A" }                   │
│      ]                                   │
│    }                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 4. Booking Service: Initiate Booking    │
│    BEGIN SAGA TRANSACTION                │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 5. Seat Inventory: Lock Seats           │
│    Try distributed lock (Redis):         │
│    SETNX seat:lock:AA101:12A {userId}    │
│         EX 900  # 15 minute timeout      │
└──────┬──────────────────────────────────┘
       │
       ├─── Lock Failed ───┐
       │                   ▼
       │            ┌──────────────────┐
       │            │ Return Error     │
       │            │ "Seat already    │
       │            │  selected"       │
       │            └──────────────────┘
       │
       └─── Lock Acquired ───┐
                             ▼
┌─────────────────────────────────────────┐
│ 6. Update Seat Status                   │
│    UPDATE seats                          │
│    SET status = 'LOCKED',                │
│        locked_by = 'user123',            │
│        locked_at = NOW(),                │
│        lock_expires_at = NOW() + 15min   │
│    WHERE flight_id = 'AA101'             │
│      AND seat_number = '12A'             │
│      AND status = 'AVAILABLE'            │
│      AND version = ?  # Optimistic lock  │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 7. Create Booking Record                │
│    INSERT INTO bookings (                │
│      booking_id, user_id, flight_id,     │
│      status, total_amount,               │
│      created_at, expires_at              │
│    ) VALUES (                            │
│      'BK123456', 'user123', 'AA101',     │
│      'INITIATED', 295.50,                │
│      NOW(), NOW() + INTERVAL 15 MINUTE   │
│    )                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 8. Create Passenger Records             │
│    INSERT INTO booking_passengers (      │
│      booking_id, passenger_name,         │
│      seat_number, passenger_type         │
│    ) VALUES (                            │
│      'BK123456', 'John Doe',             │
│      '12A', 'ADULT'                      │
│    )                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 9. Calculate Final Price                │
│    Base fare: $250.00                    │
│    Seat selection (12A): $20.00          │
│    Taxes: $35.50                         │
│    Booking fee: $10.00                   │
│    Total: $315.50                        │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 10. Return Booking Summary              │
│     {                                    │
│       bookingId: "BK123456",             │
│       pnr: "ABC123",  # Generated        │
│       status: "INITIATED",               │
│       expiresAt: "2025-12-07T12:30:00Z", │
│       flight: {...},                     │
│       passengers: [...],                 │
│       totalAmount: 315.50,               │
│       paymentRequired: true              │
│     }                                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 11. User proceeds to payment            │
│     Redirect to payment page             │
└─────────────────────────────────────────┘
```

**Lock Duration**: 15 minutes for payment completion[^3]

***

### **Workflow 3: Payment and Confirmation**

```
┌─────────────┐
│   User      │
│  Submits    │
│  Payment    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. Payment Service: Process Payment     │
│    POST /api/v1/payments/process         │
│    Body: {                               │
│      bookingId: "BK123456",              │
│      amount: 315.50,                     │
│      paymentMethod: {                    │
│        type: "CARD",                     │
│        cardToken: "tok_xyz..."           │
│      }                                   │
│    }                                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 2. Validate Booking Status              │
│    SELECT status, expires_at, amount     │
│    FROM bookings                         │
│    WHERE booking_id = 'BK123456'         │
│                                          │
│    Check:                                │
│    - Status = 'INITIATED'                │
│    - Not expired                         │
│    - Amount matches                      │
└──────┬──────────────────────────────────┘
       │
       ├─── Invalid ───┐
       │               ▼
       │        ┌──────────────┐
       │        │ Return Error │
       │        │ Release seats│
       │        └──────────────┘
       │
       └─── Valid ───┐
                     ▼
┌─────────────────────────────────────────┐
│ 3. Call Payment Gateway                 │
│    POST https://api.stripe.com/v1/charges│
│    {                                     │
│      amount: 31550,  # cents             │
│      currency: "usd",                    │
│      source: "tok_xyz...",               │
│      description: "Flight BK123456"      │
│    }                                     │
└──────┬──────────────────────────────────┘
       │
       ├─── Payment Failed ───┐
       │                      ▼
       │               ┌────────────────┐
       │               │ 3a. Compensate │
       │               │ - Release seats│
       │               │ - Update booking│
       │               │   status=FAILED│
       │               │ - Notify user  │
       │               └────────────────┘
       │
       └─── Payment Success ───┐
                               ▼
┌─────────────────────────────────────────┐
│ 4. Update Booking Status                │
│    BEGIN TRANSACTION                     │
│    UPDATE bookings                       │
│    SET status = 'CONFIRMED',             │
│        payment_id = 'PAY_xyz',           │
│        confirmed_at = NOW()              │
│    WHERE booking_id = 'BK123456'         │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 5. Confirm Seat Reservation             │
│    UPDATE seats                          │
│    SET status = 'BOOKED',                │
│        booked_by = 'user123',            │
│        booking_id = 'BK123456'           │
│    WHERE flight_id = 'AA101'             │
│      AND seat_number = '12A'             │
│      AND status = 'LOCKED'               │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 6. Release Distributed Lock             │
│    DEL seat:lock:AA101:12A               │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 7. Generate E-Ticket                    │
│    INSERT INTO tickets (                 │
│      ticket_number, booking_id,          │
│      passenger_name, flight_details,     │
│      status                              │
│    ) VALUES (                            │
│      'ETK-789456123', 'BK123456',        │
│      'John Doe', {...}, 'ISSUED'         │
│    )                                     │
│    COMMIT TRANSACTION                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 8. Publish Events                       │
│    kafka.publish('booking.confirmed', {  │
│      bookingId: 'BK123456',              │
│      userId: 'user123',                  │
│      flightId: 'AA101',                  │
│      amount: 315.50,                     │
│      timestamp: Date.now()               │
│    })                                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 9. Send Notifications (Async)           │
│    Email:                                │
│    - Subject: "Booking Confirmed"        │
│    - Attach: E-ticket PDF                │
│    - Body: PNR, flight details           │
│                                          │
│    SMS:                                  │
│    - "Your booking BK123456 confirmed"   │
│    - PNR: ABC123                         │
│                                          │
│    Push:                                 │
│    - "Flight booked successfully!"       │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 10. Return Confirmation                 │
│     {                                    │
│       bookingId: "BK123456",             │
│       pnr: "ABC123",                     │
│       status: "CONFIRMED",               │
│       ticketNumber: "ETK-789456123",     │
│       flight: {...},                     │
│       passengers: [...],                 │
│       eTicketUrl: "https://..."          │
│     }                                    │
└─────────────────────────────────────────┘
```

**Total Time**: <5 seconds end-to-end[^1]

***

### **Workflow 4: Booking Cancellation**

```
┌─────────────┐
│   User      │
│  Cancels    │
│  Booking    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. Request Cancellation                 │
│    POST /api/v1/bookings/:id/cancel      │
│    { reason: "Change of plans" }         │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 2. Validate Cancellation Eligibility    │
│    SELECT status, departure_time,        │
│           fare_rules                     │
│    FROM bookings b                       │
│    JOIN flights f ON b.flight_id         │
│    WHERE b.booking_id = 'BK123456'       │
│                                          │
│    Check:                                │
│    - Status = 'CONFIRMED'                │
│    - Not already cancelled               │
│    - Not past departure                  │
│    - Check fare rules (refundable?)      │
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
│ 3. Calculate Refund Amount              │
│    Original amount: $315.50              │
│    Cancellation fee: $50.00              │
│    Refundable: $265.50                   │
│                                          │
│    Rules:                                │
│    - >24h before: 100% - cancellation fee│
│    - 12-24h: 50% refund                  │
│    - <12h: No refund                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 4. Begin Cancellation Transaction       │
│    BEGIN TRANSACTION                     │
│    UPDATE bookings                       │
│    SET status = 'CANCELLED',             │
│        cancelled_at = NOW(),             │
│        cancellation_reason = ?,          │
│        refund_amount = 265.50            │
│    WHERE booking_id = 'BK123456'         │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 5. Release Seats                        │
│    UPDATE seats                          │
│    SET status = 'AVAILABLE',             │
│        booked_by = NULL,                 │
│        booking_id = NULL                 │
│    WHERE flight_id = 'AA101'             │
│      AND booking_id = 'BK123456'         │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 6. Cancel E-Ticket                      │
│    UPDATE tickets                        │
│    SET status = 'CANCELLED'              │
│    WHERE booking_id = 'BK123456'         │
│    COMMIT TRANSACTION                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 7. Process Refund (If applicable)       │
│    POST /api/v1/payments/refund          │
│    {                                     │
│      paymentId: "PAY_xyz",               │
│      amount: 265.50,                     │
│      reason: "Booking cancellation"      │
│    }                                     │
│                                          │
│    Call payment gateway:                 │
│    POST /v1/refunds                      │
│    { charge: "ch_xyz", amount: 26550 }   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 8. Publish Events                       │
│    kafka.publish('booking.cancelled', {  │
│      bookingId, userId, flightId,        │
│      refundAmount: 265.50                │
│    })                                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 9. Send Notifications                   │
│    Email: Cancellation confirmation      │
│    SMS: "Booking cancelled. Refund in    │
│          5-7 business days"              │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 10. Return Response                     │
│     {                                    │
│       bookingId: "BK123456",             │
│       status: "CANCELLED",               │
│       refundAmount: 265.50,              │
│       refundETA: "5-7 business days"     │
│     }                                    │
└─────────────────────────────────────────┘
```


***

## Database Schema Design

### **Airlines Table**

```sql
CREATE TABLE airlines (
    airline_id INT PRIMARY KEY AUTO_INCREMENT,
    airline_code CHAR(2) UNIQUE NOT NULL COMMENT 'IATA code: AA, UA, DL',
    airline_name VARCHAR(100) NOT NULL,
    country VARCHAR(2) NOT NULL,
    
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_code (airline_code),
    INDEX idx_active (is_active)
);
```


### **Airports Table**

```sql
CREATE TABLE airports (
    airport_code CHAR(3) PRIMARY KEY COMMENT 'IATA code: JFK, LAX',
    airport_name VARCHAR(200) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(2) NOT NULL,
    
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    timezone VARCHAR(50),
    
    is_international BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    
    INDEX idx_city (city, country),
    INDEX idx_active (is_active)
);
```


### **Aircraft Table**

```sql
CREATE TABLE aircraft (
    aircraft_id INT PRIMARY KEY AUTO_INCREMENT,
    aircraft_code VARCHAR(10) UNIQUE NOT NULL COMMENT '737, A320, 777',
    aircraft_name VARCHAR(100) NOT NULL COMMENT 'Boeing 737-800',
    manufacturer VARCHAR(50),
    
    total_seats INT NOT NULL,
    economy_seats INT,
    business_seats INT,
    first_class_seats INT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```


### **Flights Table**

```sql
CREATE TABLE flights (
    flight_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    flight_number VARCHAR(10) NOT NULL COMMENT 'AA101, UA205',
    airline_id INT NOT NULL,
    aircraft_id INT NOT NULL,
    
    -- Route
    origin_code CHAR(3) NOT NULL,
    destination_code CHAR(3) NOT NULL,
    
    -- Schedule
    departure_time DATETIME NOT NULL,
    arrival_time DATETIME NOT NULL,
    duration_minutes INT NOT NULL,
    
    -- Status
    status ENUM('SCHEDULED', 'DELAYED', 'BOARDING', 'DEPARTED', 
                'IN_FLIGHT', 'LANDED', 'CANCELLED') DEFAULT 'SCHEDULED',
    
    -- Seat availability (denormalized for quick access)
    available_economy_seats INT DEFAULT 0,
    available_business_seats INT DEFAULT 0,
    available_first_class_seats INT DEFAULT 0,
    
    -- Gates
    departure_gate VARCHAR(10),
    arrival_gate VARCHAR(10),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (airline_id) REFERENCES airlines(airline_id),
    FOREIGN KEY (aircraft_id) REFERENCES aircraft(aircraft_id),
    FOREIGN KEY (origin_code) REFERENCES airports(airport_code),
    FOREIGN KEY (destination_code) REFERENCES airports(airport_code),
    
    INDEX idx_route_date (origin_code, destination_code, departure_time),
    INDEX idx_airline (airline_id, departure_time),
    INDEX idx_status (status, departure_time),
    INDEX idx_flight_number (flight_number, departure_time),
    
    UNIQUE KEY unique_flight_schedule (flight_number, departure_time)
);

-- Partition by month
ALTER TABLE flights PARTITION BY RANGE (YEAR(departure_time) * 100 + MONTH(departure_time)) (
    PARTITION p202412 VALUES LESS THAN (202501),
    PARTITION p202501 VALUES LESS THAN (202502),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```


### **Seats Table**

```sql
CREATE TABLE seats (
    seat_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    flight_id BIGINT NOT NULL,
    
    -- Seat details
    seat_number VARCHAR(5) NOT NULL COMMENT '12A, 1B, 23C',
    seat_row INT NOT NULL,
    seat_column CHAR(1) NOT NULL COMMENT 'A, B, C, D, E, F',
    
    -- Classification
    seat_class ENUM('ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST') NOT NULL,
    seat_type ENUM('WINDOW', 'MIDDLE', 'AISLE') NOT NULL,
    
    -- Features
    is_exit_row BOOLEAN DEFAULT FALSE,
    is_extra_legroom BOOLEAN DEFAULT FALSE,
    extra_charge DECIMAL(8, 2) DEFAULT 0.00,
    
    -- Status
    status ENUM('AVAILABLE', 'LOCKED', 'BOOKED', 'CHECKED_IN', 'BLOCKED') DEFAULT 'AVAILABLE',
    
    -- Lock info
    locked_by VARCHAR(50) COMMENT 'User ID or session',
    locked_at TIMESTAMP,
    lock_expires_at TIMESTAMP,
    
    -- Booking info
    booking_id VARCHAR(50),
    booked_by VARCHAR(50),
    
    -- Optimistic locking
    version INT DEFAULT 1,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (flight_id) REFERENCES flights(flight_id) ON DELETE CASCADE,
    
    INDEX idx_flight_status (flight_id, status),
    INDEX idx_flight_class (flight_id, seat_class, status),
    INDEX idx_booking (booking_id),
    INDEX idx_lock_expiry (lock_expires_at, status),
    
    UNIQUE KEY unique_seat (flight_id, seat_number),
    
    CHECK (status IN ('AVAILABLE', 'LOCKED', 'BOOKED', 'CHECKED_IN', 'BLOCKED'))
);
```


### **Users Table**

```sql
CREATE TABLE users (
    user_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    
    date_of_birth DATE,
    nationality VARCHAR(2),
    passport_number VARCHAR(50),
    passport_expiry DATE,
    
    -- Preferences
    preferred_currency CHAR(3) DEFAULT 'USD',
    frequent_flyer_programs JSON COMMENT 'Array of airline programs',
    
    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_phone (phone_number)
);
```


### **Bookings Table**

```sql
CREATE TABLE bookings (
    booking_id VARCHAR(50) PRIMARY KEY,
    pnr VARCHAR(6) UNIQUE NOT NULL COMMENT 'Passenger Name Record',
    
    user_id BIGINT NOT NULL,
    flight_id BIGINT NOT NULL,
    
    -- Status
    status ENUM('INITIATED', 'SEATS_LOCKED', 'PAYMENT_PENDING', 
                'CONFIRMED', 'CHECKED_IN', 'CANCELLED', 'COMPLETED') DEFAULT 'INITIATED',
    
    -- Pricing
    base_fare DECIMAL(10, 2) NOT NULL,
    taxes DECIMAL(10, 2) DEFAULT 0,
    fees DECIMAL(10, 2) DEFAULT 0,
    ancillaries DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    currency CHAR(3) DEFAULT 'USD',
    
    -- Payment
    payment_id VARCHAR(100),
    payment_method ENUM('CARD', 'NET_BANKING', 'WALLET', 'UPI'),
    payment_status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'),
    
    -- Refund
    refund_amount DECIMAL(10, 2),
    refund_initiated_at TIMESTAMP,
    refund_completed_at TIMESTAMP,
    
    -- Cancellation
    cancellation_reason TEXT,
    cancellation_fee DECIMAL(10, 2),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP COMMENT 'Lock expiry',
    confirmed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (flight_id) REFERENCES flights(flight_id),
    
    INDEX idx_user (user_id, created_at DESC),
    INDEX idx_flight (flight_id, status),
    INDEX idx_pnr (pnr),
    INDEX idx_status_expiry (status, expires_at),
    INDEX idx_payment (payment_id)
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
    booking_id VARCHAR(50) NOT NULL,
    
    -- Personal info
    passenger_type ENUM('ADULT', 'CHILD', 'INFANT') NOT NULL,
    title ENUM('MR', 'MS', 'MRS', 'MISS', 'DR') NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('MALE', 'FEMALE', 'OTHER'),
    
    -- Travel docs
    passport_number VARCHAR(50),
    passport_expiry DATE,
    nationality VARCHAR(2),
    
    -- Seat
    seat_number VARCHAR(5),
    
    -- Meal preference
    meal_preference ENUM('VEGETARIAN', 'NON_VEGETARIAN', 'VEGAN', 
                         'GLUTEN_FREE', 'HALAL', 'KOSHER'),
    
    -- Special requests
    special_assistance TEXT,
    frequent_flyer_number VARCHAR(50),
    
    -- Check-in
    is_checked_in BOOLEAN DEFAULT FALSE,
    checked_in_at TIMESTAMP,
    boarding_pass_issued BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    
    INDEX idx_booking (booking_id),
    INDEX idx_name (last_name, first_name)
);
```


### **Flight Pricing Table**

```sql
CREATE TABLE flight_pricing (
    pricing_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    flight_id BIGINT NOT NULL,
    
    fare_class ENUM('ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST') NOT NULL,
    
    -- Base pricing
    base_price DECIMAL(10, 2) NOT NULL,
    taxes DECIMAL(10, 2) DEFAULT 0,
    fees DECIMAL(10, 2) DEFAULT 0,
    
    -- Dynamic pricing factors
    demand_factor DECIMAL(3, 2) DEFAULT 1.00,
    days_to_departure_factor DECIMAL(3, 2) DEFAULT 1.00,
    
    -- Fare rules
    is_refundable BOOLEAN DEFAULT FALSE,
    is_changeable BOOLEAN DEFAULT TRUE,
    change_fee DECIMAL(8, 2) DEFAULT 0,
    cancellation_fee DECIMAL(8, 2) DEFAULT 0,
    
    -- Baggage
    checked_baggage_allowed INT DEFAULT 1,
    cabin_baggage_allowed INT DEFAULT 1,
    
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP,
    
    FOREIGN KEY (flight_id) REFERENCES flights(flight_id) ON DELETE CASCADE,
    
    INDEX idx_flight_class (flight_id, fare_class),
    INDEX idx_validity (valid_from, valid_until)
);
```


### **Tickets Table**

```sql
CREATE TABLE tickets (
    ticket_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ticket_number VARCHAR(20) UNIQUE NOT NULL COMMENT 'ETK-123456789',
    booking_id VARCHAR(50) NOT NULL,
    passenger_id BIGINT NOT NULL,
    
    flight_id BIGINT NOT NULL,
    seat_number VARCHAR(5),
    
    status ENUM('ISSUED', 'USED', 'CANCELLED', 'EXPIRED') DEFAULT 'ISSUED',
    
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (passenger_id) REFERENCES booking_passengers(passenger_id) ON DELETE CASCADE,
    FOREIGN KEY (flight_id) REFERENCES flights(flight_id),
    
    INDEX idx_booking (booking_id),
    INDEX idx_ticket_number (ticket_number),
    INDEX idx_passenger (passenger_id)
);
```


***

## Low-Level Design (LLD) - TypeScript

### **Domain Models**

```typescript
// Enums
enum FlightStatus {
  SCHEDULED = 'SCHEDULED',
  DELAYED = 'DELAYED',
  BOARDING = 'BOARDING',
  DEPARTED = 'DEPARTED',
  IN_FLIGHT = 'IN_FLIGHT',
  LANDED = 'LANDED',
  CANCELLED = 'CANCELLED'
}

enum SeatClass {
  ECONOMY = 'ECONOMY',
  PREMIUM_ECONOMY = 'PREMIUM_ECONOMY',
  BUSINESS = 'BUSINESS',
  FIRST = 'FIRST'
}

enum SeatStatus {
  AVAILABLE = 'AVAILABLE',
  LOCKED = 'LOCKED',
  BOOKED = 'BOOKED',
  CHECKED_IN = 'CHECKED_IN',
  BLOCKED = 'BLOCKED'
}

enum BookingStatus {
  INITIATED = 'INITIATED',
  SEATS_LOCKED = 'SEATS_LOCKED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

enum PassengerType {
  ADULT = 'ADULT',
  CHILD = 'CHILD',
  INFANT = 'INFANT'
}

// Interfaces
interface FlightSearchRequest {
  origin: string;
  destination: string;
  departureDate: string;
  passengers: number;
  cabinClass: SeatClass;
  isRoundTrip?: boolean;
  returnDate?: string;
}

interface Flight {
  flightId: string;
  flightNumber: string;
  airline: {
    code: string;
    name: string;
  };
  origin: Airport;
  destination: Airport;
  departureTime: Date;
  arrivalTime: Date;
  duration: number; // minutes
  aircraft: string;
  availableSeats: {
    economy: number;
    business: number;
    first: number;
  };
  price: {
    base: number;
    taxes: number;
    fees: number;
    total: number;
    currency: string;
  };
  status: FlightStatus;
}

interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

interface Seat {
  seatId: string;
  seatNumber: string;
  seatRow: number;
  seatColumn: string;
  seatClass: SeatClass;
  seatType: 'WINDOW' | 'MIDDLE' | 'AISLE';
  status: SeatStatus;
  extraCharge: number;
  isExitRow: boolean;
  isExtraLegroom: boolean;
}

interface BookingRequest {
  userId: string;
  flightId: string;
  passengers: PassengerInfo[];
  selectedSeats: string[];
  contactInfo: ContactInfo;
}

interface PassengerInfo {
  type: PassengerType;
  title: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  passportNumber?: string;
  nationality?: string;
  mealPreference?: string;
}

interface ContactInfo {
  email: string;
  phone: string;
}

interface Booking {
  bookingId: string;
  pnr: string;
  userId: string;
  flightId: string;
  status: BookingStatus;
  passengers: PassengerInfo[];
  seats: string[];
  totalAmount: number;
  currency: string;
  createdAt: Date;
  expiresAt: Date;
  confirmedAt?: Date;
}
```


### **PNR Generator**

```typescript
class PNRGenerator {
  private static readonly CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  static generate(): string {
    let pnr = '';
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * this.CHARS.length);
      pnr += this.CHARS[randomIndex];
    }
    return pnr;
  }

  static validate(pnr: string): boolean {
    return /^[A-Z0-9]{6}$/.test(pnr);
  }
}
```


### **Flight Search Service**

```typescript
interface IFlightRepository {
  searchFlights(
    origin: string,
    destination: string,
    date: Date,
    cabinClass: SeatClass
  ): Promise<Flight[]>;
  getFlightById(flightId: string): Promise<Flight | null>;
}

interface ICache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl: number): Promise<void>;
}

class FlightSearchService {
  constructor(
    private flightRepository: IFlightRepository,
    private cache: ICache
  ) {}

  async searchFlights(request: FlightSearchRequest): Promise<Flight[]> {
    // Validate request
    this.validateSearchRequest(request);

    // Generate cache key
    const cacheKey = this.generateCacheKey(request);

    // Check cache
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Query database
    const flights = await this.flightRepository.searchFlights(
      request.origin,
      request.destination,
      new Date(request.departureDate),
      request.cabinClass
    );

    // Filter by passenger count
    const availableFlights = flights.filter(flight => {
      const availableSeats = this.getAvailableSeatsForClass(flight, request.cabinClass);
      return availableSeats >= request.passengers;
    });

    // Sort by price
    availableFlights.sort((a, b) => a.price.total - b.price.total);

    // Cache results (15 minutes)
    await this.cache.set(cacheKey, JSON.stringify(availableFlights), 900);

    return availableFlights;
  }

  private validateSearchRequest(request: FlightSearchRequest): void {
    if (!this.isValidAirportCode(request.origin)) {
      throw new Error('Invalid origin airport code');
    }
    if (!this.isValidAirportCode(request.destination)) {
      throw new Error('Invalid destination airport code');
    }
    if (request.passengers < 1 || request.passengers > 9) {
      throw new Error('Passengers must be between 1 and 9');
    }
    const departureDate = new Date(request.departureDate);
    if (departureDate < new Date()) {
      throw new Error('Departure date must be in the future');
    }
  }

  private isValidAirportCode(code: string): boolean {
    return /^[A-Z]{3}$/.test(code);
  }

  private getAvailableSeatsForClass(flight: Flight, cabinClass: SeatClass): number {
    switch (cabinClass) {
      case SeatClass.ECONOMY:
        return flight.availableSeats.economy;
      case SeatClass.BUSINESS:
        return flight.availableSeats.business;
      case SeatClass.FIRST:
        return flight.availableSeats.first;
      default:
        return 0;
    }
  }

  private generateCacheKey(request: FlightSearchRequest): string {
    return `flights:${request.origin}:${request.destination}:${request.departureDate}:${request.passengers}:${request.cabinClass}`;
  }
}
```


### **Seat Lock Manager**

```typescript
interface IRedisClient {
  setnx(key: string, value: string, ttl: number): Promise<boolean>;
  del(key: string): Promise<void>;
  get(key: string): Promise<string | null>;
}

class SeatLockManager {
  private static readonly LOCK_TTL = 900; // 15 minutes

  constructor(private redis: IRedisClient) {}

  async lockSeat(
    flightId: string,
    seatNumber: string,
    userId: string
  ): Promise<boolean> {
    const lockKey = this.getLockKey(flightId, seatNumber);
    
    // Try to acquire distributed lock
    const acquired = await this.redis.setnx(
      lockKey,
      userId,
      SeatLockManager.LOCK_TTL
    );

    return acquired;
  }

  async unlockSeat(flightId: string, seatNumber: string): Promise<void> {
    const lockKey = this.getLockKey(flightId, seatNumber);
    await this.redis.del(lockKey);
  }

  async getSeatLockHolder(
    flightId: string,
    seatNumber: string
  ): Promise<string | null> {
    const lockKey = this.getLockKey(flightId, seatNumber);
    return await this.redis.get(lockKey);
  }

  async extendLock(
    flightId: string,
    seatNumber: string,
    userId: string
  ): Promise<boolean> {
    const lockHolder = await this.getSeatLockHolder(flightId, seatNumber);
    
    if (lockHolder !== userId) {
      return false;
    }

    // Re-acquire lock with new TTL
    return await this.lockSeat(flightId, seatNumber, userId);
  }

  private getLockKey(flightId: string, seatNumber: string): string {
    return `seat:lock:${flightId}:${seatNumber}`;
  }
}
```


### **Booking Service**

```typescript
interface ISeatRepository {
  getSeatsByFlightId(flightId: string): Promise<Seat[]>;
  updateSeatStatus(
    seatId: string,
    status: SeatStatus,
    bookingId?: string,
    version?: number
  ): Promise<boolean>;
  lockSeats(seatIds: string[], lockInfo: {
    lockedBy: string;
    expiresAt: Date;
  }): Promise<boolean>;
}

interface IBookingRepository {
  createBooking(booking: Booking): Promise<void>;
  getBookingById(bookingId: string): Promise<Booking | null>;
  updateBookingStatus(bookingId: string, status: BookingStatus): Promise<void>;
}

interface IEventPublisher {
  publish(topic: string, event: any): Promise<void>;
}

class BookingService {
  constructor(
    private seatRepository: ISeatRepository,
    private bookingRepository: IBookingRepository,
    private seatLockManager: SeatLockManager,
    private eventPublisher: IEventPublisher
  ) {}

  async createBooking(request: BookingRequest): Promise<Booking> {
    // Validate request
    this.validateBookingRequest(request);

    // Generate booking ID and PNR
    const bookingId = this.generateBookingId();
    const pnr = PNRGenerator.generate();

    // Attempt to lock seats
    const seatsLocked = await this.lockSeatsForBooking(
      request.flightId,
      request.selectedSeats,
      request.userId
    );

    if (!seatsLocked) {
      throw new Error('Unable to lock selected seats. Please try again.');
    }

    try {
      // Create booking record
      const booking: Booking = {
        bookingId,
        pnr,
        userId: request.userId,
        flightId: request.flightId,
        status: BookingStatus.SEATS_LOCKED,
        passengers: request.passengers,
        seats: request.selectedSeats,
        totalAmount: await this.calculateTotalAmount(request),
        currency: 'USD',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      };

      await this.bookingRepository.createBooking(booking);

      // Update seat status in database
      await this.updateSeatsStatus(
        request.flightId,
        request.selectedSeats,
        SeatStatus.LOCKED,
        bookingId
      );

      // Publish event
      await this.eventPublisher.publish('booking.initiated', {
        bookingId,
        userId: request.userId,
        flightId: request.flightId,
        seats: request.selectedSeats,
        timestamp: Date.now()
      });

      return booking;

    } catch (error) {
      // Rollback: Release seat locks
      await this.releaseSeats(request.flightId, request.selectedSeats);
      throw error;
    }
  }

  async confirmBooking(bookingId: string, paymentId: string): Promise<void> {
    const booking = await this.bookingRepository.getBookingById(bookingId);

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status !== BookingStatus.SEATS_LOCKED &&
        booking.status !== BookingStatus.PAYMENT_PENDING) {
      throw new Error(`Cannot confirm booking with status: ${booking.status}`);
    }

    // Check if booking has expired
    if (booking.expiresAt < new Date()) {
      throw new Error('Booking has expired');
    }

    // Update booking status
    await this.bookingRepository.updateBookingStatus(bookingId, BookingStatus.CONFIRMED);

    // Update seats to BOOKED status
    await this.updateSeatsStatus(
      booking.flightId,
      booking.seats,
      SeatStatus.BOOKED,
      bookingId
    );

    // Release distributed locks
    await this.releaseSeats(booking.flightId, booking.seats);

    // Publish event
    await this.eventPublisher.publish('booking.confirmed', {
      bookingId,
      userId: booking.userId,
      flightId: booking.flightId,
      paymentId,
      timestamp: Date.now()
    });
  }

  async cancelBooking(bookingId: string, userId: string): Promise<void> {
    const booking = await this.bookingRepository.getBookingById(bookingId);

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new Error('Booking already cancelled');
    }

    // Update booking status
    await this.bookingRepository.updateBookingStatus(bookingId, BookingStatus.CANCELLED);

    // Release seats
    await this.updateSeatsStatus(
      booking.flightId,
      booking.seats,
      SeatStatus.AVAILABLE
    );

    // Release distributed locks (if still held)
    await this.releaseSeats(booking.flightId, booking.seats);

    // Publish event
    await this.eventPublisher.publish('booking.cancelled', {
      bookingId,
      userId,
      flightId: booking.flightId,
      timestamp: Date.now()
    });
  }

  private async lockSeatsForBooking(
    flightId: string,
    seatNumbers: string[],
    userId: string
  ): Promise<boolean> {
    for (const seatNumber of seatNumbers) {
      const locked = await this.seatLockManager.lockSeat(flightId, seatNumber, userId);
      if (!locked) {
        // Rollback: Release already locked seats
        const lockedSeats = seatNumbers.slice(0, seatNumbers.indexOf(seatNumber));
        await this.releaseSeats(flightId, lockedSeats);
        return false;
      }
    }
    return true;
  }

  private async releaseSeats(flightId: string, seatNumbers: string[]): Promise<void> {
    for (const seatNumber of seatNumbers) {
      await this.seatLockManager.unlockSeat(flightId, seatNumber);
    }
  }

  private async updateSeatsStatus(
    flightId: string,
    seatNumbers: string[],
    status: SeatStatus,
    bookingId?: string
  ): Promise<void> {
    // Implementation would batch update seats in database
    // Using optimistic locking with version numbers
  }

  private async calculateTotalAmount(request: BookingRequest): Promise<number> {
    // Fetch flight pricing
    // Calculate base fare * passengers
    // Add seat selection charges
    // Add taxes and fees
    // Return total
    return 315.50; // Placeholder
  }

  private validateBookingRequest(request: BookingRequest): void {
    if (!request.userId) {
      throw new Error('User ID is required');
    }
    if (!request.flightId) {
      throw new Error('Flight ID is required');
    }
    if (request.passengers.length === 0) {
      throw new Error('At least one passenger is required');
    }
    if (request.passengers.length !== request.selectedSeats.length) {
      throw new Error('Number of passengers must match number of selected seats');
    }
  }

  private generateBookingId(): string {
    return `BK${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }
}
```


***

## Key Design Patterns \& Optimizations

1. **Distributed Locks (Redis)**: Prevent double booking with atomic operations[^3]
2. **Optimistic Locking**: Version-based seat updates for concurrency[^3]
3. **SAGA Pattern**: Distributed transactions with compensating actions[^3]
4. **Cache-Aside**: Popular routes cached for fast search[^1]
5. **Event-Driven Architecture**: Async notifications and processing[^1]
6. **Database Partitioning**: Monthly partitions for bookings and flights[^6]
7. **Read Replicas**: 5+ replicas for search queries
8. **Seat Lock Timeout**: 15-minute expiry with background cleanup[^3]

**Performance**: **<500ms search**, **<2s booking**, **99.9% availability**, handles **10M+ bookings/day**.[^1] [^3]
<span style="display:none">[^10] [^7] [^8] [^9]</span>

<div align="center">⁂</div>

[^1]: https://www.geeksforgeeks.org/system-design/system-design-of-airline-management-system/

[^2]: https://www.altexsoft.com/blog/flight-booking-process-structure-steps-and-key-systems/

[^3]: https://www.linkedin.com/pulse/072-case-studies-airline-booking-system-scalable-design-pranu-kumar-ltyzf

[^4]: https://www.scribd.com/document/451448450/Belobaba-Airline-Seat-Inventory-pdf

[^5]: https://www.trawex.com/airline-inventory-management.php

[^6]: https://www.geeksforgeeks.org/sql/how-to-design-database-for-flight-reservation-system/

[^7]: https://www.travelopro.com/airline-booking-system.php

[^8]: https://www.youtube.com/watch?v=5yEoh3toRyE

[^9]: https://sist.sathyabama.ac.in/sist_naac/documents/1.3.4/1922-b.sc-cs-batchno-26.pdf.pdf.pdf

[^10]: https://www.slideshare.net/slideshow/airlines-database-design/10151395

