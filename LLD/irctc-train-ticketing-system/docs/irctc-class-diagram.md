# IRCTC TRAIN TICKETING SYSTEM - CLASS DIAGRAM

## CORE CLASSES

### 1. User
**Attributes:**
- id: string (UUID)
- name: string
- email: string
- phone: string
- password: string (hashed)
- dateOfBirth: Date
- createdAt: Date
- updatedAt: Date

**Methods:**
- constructor(name, email, phone, password, dateOfBirth)
- updateProfile(name, email, phone): void
- getAge(): number
- isValid(): boolean
- update(): void

**Responsibilities:**
- Manage user profile information
- Validate user data
- Track user creation and updates

---

### 2. Passenger
**Attributes:**
- id: string (UUID)
- name: string
- age: number
- gender: Gender (enum)
- berthPreference: BerthPreference (enum)
- seatNumber: string | null
- coachNumber: string | null

**Methods:**
- constructor(name, age, gender, berthPreference)
- assignSeat(coachNumber, seatNumber): void
- clearSeat(): void
- isValid(): boolean

**Responsibilities:**
- Store passenger details for booking
- Manage seat assignment
- Validate passenger information

---

### 3. Train
**Attributes:**
- id: string (UUID)
- trainNumber: string
- trainName: string
- source: Station
- destination: Station
- departureTime: string
- arrivalTime: string
- journeyDuration: number (minutes)
- trainType: TrainType (enum)
- schedule: TrainSchedule
- coaches: Map<CoachType, Coach[]>
- createdAt: Date
- updatedAt: Date

**Methods:**
- constructor(trainNumber, trainName, source, destination, departureTime, arrivalTime, trainType)
- addCoach(coach: Coach): void
- getCoachesByType(coachType: CoachType): Coach[]
- getTotalSeats(coachType: CoachType): number
- getAvailableSeats(coachType: CoachType, date: Date): number
- calculateFare(coachType: CoachType, distance: number): number
- isOperatingOn(date: Date): boolean
- update(): void

**Responsibilities:**
- Manage train details and schedule
- Store coach configurations
- Calculate fares based on distance and class
- Track seat availability

---

### 4. Coach
**Attributes:**
- id: string (UUID)
- coachNumber: string
- coachType: CoachType (enum)
- totalSeats: number
- layout: SeatLayout
- trainId: string
- seats: Seat[]

**Methods:**
- constructor(coachNumber, coachType, totalSeats, trainId)
- initializeSeats(): void
- getSeatByNumber(seatNumber: string): Seat | undefined
- getAvailableSeats(date: Date): Seat[]
- getBookedSeats(date: Date): Seat[]
- getTotalAvailable(date: Date): number

**Responsibilities:**
- Manage individual coach configuration
- Initialize and track seats
- Query seat availability

---

### 5. Seat
**Attributes:**
- id: string (UUID)
- seatNumber: string
- berthType: BerthType (enum)
- coachId: string
- isAvailable: boolean
- bookings: Map<string, string> (date → bookingId)

**Methods:**
- constructor(seatNumber, berthType, coachId)
- book(date: string, bookingId: string): boolean
- release(date: string): void
- isAvailableOn(date: Date): boolean
- getBookingIdForDate(date: string): string | null

**Responsibilities:**
- Track seat bookings per date
- Manage seat availability
- Store berth type information

---

### 6. Booking
**Attributes:**
- id: string (UUID)
- pnr: string (10-digit unique)
- userId: string
- trainId: string
- passengers: Passenger[]
- journeyDate: Date
- sourceStation: Station
- destinationStation: Station
- coachType: CoachType
- bookingStatus: IBookingState (State Pattern)
- totalFare: number
- paymentId: string | null
- bookedAt: Date
- updatedAt: Date

**Methods:**
- constructor(userId, trainId, passengers, journeyDate, source, destination, coachType)
- setState(state: IBookingState): void
- confirm(): void
- cancel(): void
- addToWaitlist(position: number): void
- promoteFromWaitlist(): void
- calculateRefund(): number
- assignSeats(seatAllocator: ISeatAllocationStrategy): void
- getStatus(): BookingStatus
- update(): void

**Responsibilities:**
- Manage booking lifecycle using State pattern
- Store passenger and journey details
- Handle seat assignments
- Calculate fares and refunds
- Track booking status transitions

---

### 7. Station
**Attributes:**
- id: string (UUID)
- stationCode: string (3-4 letters)
- stationName: string
- city: string
- state: string
- platformCount: number

**Methods:**
- constructor(stationCode, stationName, city, state, platformCount)
- isValid(): boolean

**Responsibilities:**
- Store station information
- Validate station codes

---

### 8. TrainSchedule
**Attributes:**
- id: string (UUID)
- trainId: string
- route: RouteStation[]
- operatingDays: DayOfWeek[] (enum array)
- effectiveFrom: Date
- effectiveTo: Date | null

**Methods:**
- constructor(trainId, route, operatingDays, effectiveFrom)
- addStation(station: RouteStation): void
- getStationByCode(stationCode: string): RouteStation | undefined
- isOperatingOn(date: Date): boolean
- getDistanceBetween(source: string, destination: string): number

**Responsibilities:**
- Manage train route and intermediate stations
- Track operating days
- Calculate distances between stations

---

### 9. RouteStation
**Attributes:**
- station: Station
- arrivalTime: string | null
- departureTime: string | null
- platform: number
- distanceFromOrigin: number (km)
- stopNumber: number

**Methods:**
- constructor(station, arrivalTime, departureTime, platform, distanceFromOrigin, stopNumber)
- isOrigin(): boolean
- isDestination(): boolean

**Responsibilities:**
- Store station-specific schedule information
- Track timing and distance

---

### 10. Payment
**Attributes:**
- id: string (UUID)
- bookingId: string
- amount: number
- paymentMethod: IPaymentMethod (Strategy Pattern)
- paymentStatus: PaymentStatus (enum)
- transactionId: string | null
- processedAt: Date | null
- createdAt: Date

**Methods:**
- constructor(bookingId, amount, paymentMethod)
- process(): boolean
- refund(amount: number): boolean
- getStatus(): PaymentStatus
- markSuccess(transactionId: string): void
- markFailed(): void

**Responsibilities:**
- Process payments using Strategy pattern
- Track payment status
- Handle refunds

---

## DESIGN PATTERNS IMPLEMENTATION

### 1. **STATE PATTERN - Booking States**

**Interface: IBookingState**
```typescript
interface IBookingState {
  confirm(booking: Booking): void;
  cancel(booking: Booking): void;
  addToWaitlist(booking: Booking, position: number): void;
  promoteFromWaitlist(booking: Booking): void;
  getStatus(): BookingStatus;
  getStateName(): string;
}
```

**Concrete States:**

#### ConfirmedState
- Attributes: confirmedAt: Date
- Methods: cancel() → CancelledState, getStatus() → CONFIRMED
- Transitions: Can only move to CancelledState

#### RACState (Reservation Against Cancellation)
- Attributes: racPosition: number
- Methods: promoteFromWaitlist() → ConfirmedState, cancel() → CancelledState
- Transitions: RAC → Confirmed or Cancelled

#### WaitlistState
- Attributes: waitlistPosition: number
- Methods: promoteFromWaitlist() → RACState or ConfirmedState, cancel() → CancelledState
- Transitions: Waitlist → RAC → Confirmed or Cancelled

#### CancelledState
- Attributes: cancelledAt: Date, refundAmount: number
- Methods: None (terminal state)
- Transitions: No further transitions

---

### 2. **STRATEGY PATTERN - Seat Allocation**

**Interface: ISeatAllocationStrategy**
```typescript
interface ISeatAllocationStrategy {
  allocateSeats(train: Train, passengers: Passenger[], coachType: CoachType, date: Date): AllocationResult;
  getStrategyName(): string;
}
```

**Concrete Strategies:**

#### BerthPreferenceStrategy
- Allocates seats based on passenger berth preferences (Lower/Middle/Upper/Side)
- Priority: Exact match → Similar berth → Any available
- Used for: Premium trains, low occupancy

#### FamilyGroupingStrategy
- Keeps family members/group passengers in same or adjacent coaches
- Allocates consecutive seats when possible
- Used for: Group bookings (2+ passengers)

#### AutomaticAllocationStrategy
- First-come-first-served allocation
- No preference consideration
- Used for: Tatkal bookings, high demand trains

---

### 3. **STRATEGY PATTERN - Payment Methods**

**Interface: IPaymentMethod**
```typescript
interface IPaymentMethod {
  processPayment(amount: number): PaymentResult;
  refund(transactionId: string, amount: number): boolean;
  getMethodName(): string;
}
```

**Concrete Strategies:**

#### CreditCardPayment
- Attributes: cardNumber, cvv, expiryDate, cardHolderName
- Methods: validateCard(), processPayment(), refund()

#### UPIPayment
- Attributes: upiId, appName
- Methods: generatePaymentLink(), processPayment(), refund()

#### NetBankingPayment
- Attributes: bankName, accountNumber
- Methods: redirectToBankPortal(), processPayment(), refund()

---

### 4. **OBSERVER PATTERN - Booking Notifications**

**Subject: BookingNotifier**
- Attributes: observers: IBookingObserver[]
- Methods: attach(), detach(), notifyStatusChange(), notifyWaitlistPromotion()

**Interface: IBookingObserver**
```typescript
interface IBookingObserver {
  onBookingStatusChanged(booking: Booking): void;
  onWaitlistPromoted(booking: Booking, newStatus: BookingStatus): void;
}
```

**Concrete Observers:**

#### EmailNotifier
- Sends email notifications for booking confirmations, cancellations, waitlist updates

#### SMSNotifier
- Sends SMS alerts for booking status changes

#### PushNotifier
- Sends push notifications to mobile app

---

### 5. **FACTORY PATTERN - Ticket Creation**

**TicketFactory**
- Methods: createTicket(bookingType: BookingType, ...params): Booking
- Creates: GeneralTicket, TatkalTicket, LadiesQuotaTicket, SeniorCitizenTicket
- Applies: Different pricing, quota rules, and booking constraints

---

### 6. **SINGLETON PATTERN - Core Services**

#### BookingManager
- Single instance managing all bookings
- Methods: createBooking(), cancelBooking(), checkAvailability(), processWaitlist()
- Ensures: Thread-safe booking operations, prevents double booking

#### SeatInventoryManager
- Single instance managing seat inventory across all trains
- Methods: lockSeats(), releaseSeats(), updateAvailability()
- Ensures: Consistent seat availability tracking

---

## CLASS RELATIONSHIPS

### Associations
- User (1) → (0..*) Booking: User has many bookings
- Booking (1) → (1..*) Passenger: Booking contains multiple passengers
- Booking (1) → (1) Train: Booking is for one train
- Booking (1) → (1) Payment: Booking has one payment
- Train (1) → (1..*) Coach: Train has multiple coaches
- Coach (1) → (1..*) Seat: Coach contains multiple seats
- Train (1) → (1) TrainSchedule: Train has one schedule
- TrainSchedule (1) → (1..*) RouteStation: Schedule has multiple stations

### Composition
- Train ◆→ Coach: Coaches cannot exist without train
- Coach ◆→ Seat: Seats cannot exist without coach
- Booking ◆→ Passenger: Passengers in booking context

### Aggregation
- TrainSchedule ◇→ Station: Schedule references stations

### Inheritance
None (using interfaces for polymorphism)

### Implementations
- ConfirmedState, RACState, WaitlistState, CancelledState → IBookingState
- BerthPreferenceStrategy, FamilyGroupingStrategy, AutomaticAllocationStrategy → ISeatAllocationStrategy
- CreditCardPayment, UPIPayment, NetBankingPayment → IPaymentMethod
- EmailNotifier, SMSNotifier, PushNotifier → IBookingObserver

---

## DESIGN PRINCIPLES APPLIED

1. **Single Responsibility Principle (SRP)**
   - Each class has one clear responsibility
   - Booking handles booking logic, Payment handles payment logic
   - State transitions managed by State pattern classes

2. **Open/Closed Principle (OCP)**
   - New seat allocation strategies can be added without modifying existing code
   - New payment methods can be added by implementing IPaymentMethod
   - New booking states can be added by implementing IBookingState

3. **Dependency Inversion Principle (DIP)**
   - Booking depends on IBookingState interface, not concrete states
   - Payment depends on IPaymentMethod interface, not concrete payment methods
   - Seat allocation depends on ISeatAllocationStrategy interface

4. **Interface Segregation Principle (ISP)**
   - Small, focused interfaces (IBookingState, IPaymentMethod, ISeatAllocationStrategy)
   - Clients depend only on methods they use

5. **Liskov Substitution Principle (LSP)**
   - All payment methods can be used interchangeably
   - All seat allocation strategies are substitutable
   - All booking states follow the same contract

---

## KEY DESIGN DECISIONS

1. **State Pattern for Booking**: Booking status has complex state transitions (Waitlist → RAC → Confirmed → Cancelled) with different behaviors per state

2. **Strategy Pattern for Seat Allocation**: Multiple seat allocation algorithms based on booking type, passenger preferences, and train occupancy

3. **Observer Pattern for Notifications**: Decouple booking logic from notification mechanisms, allowing multiple notification channels

4. **In-Memory Seat Locking**: Use Map-based locking to prevent concurrent booking conflicts during high traffic

5. **PNR Generation**: 10-digit unique identifier combining timestamp and counter for easy tracking

6. **Date-Based Seat Booking**: Seats are booked per date, allowing same physical seat to be used for different journeys

7. **Refund Calculation**: Based on time before departure and booking status (Confirmed gets higher refund than Waitlist)

---

✅ **Design Patterns Used:** 6 (Singleton, Factory, State, Strategy, Observer, Repository)  
✅ **Core Classes:** 10  
✅ **Interfaces:** 4  
✅ **State Classes:** 4  
✅ **Strategy Classes:** 6  
✅ **Total Entities:** 24+

