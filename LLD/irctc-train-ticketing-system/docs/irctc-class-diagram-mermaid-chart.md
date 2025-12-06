# IRCTC Train Ticketing System - Complete Class Diagram
https://www.mermaidchart.com/
```mermaid
classDiagram
    %% Enums
    class TrainType {
        <<enumeration>>
        EXPRESS
        SUPERFAST
        MAIL
        PASSENGER
        RAJDHANI
        SHATABDI
        DURONTO
    }

    class CoachType {
        <<enumeration>>
        SLEEPER
        THIRD_AC
        SECOND_AC
        FIRST_AC
        CHAIR_CAR
        GENERAL
    }

    class BerthType {
        <<enumeration>>
        LOWER
        MIDDLE
        UPPER
        SIDE_LOWER
        SIDE_UPPER
    }

    class BerthPreference {
        <<enumeration>>
        LOWER
        MIDDLE
        UPPER
        SIDE_LOWER
        SIDE_UPPER
        NO_PREFERENCE
    }

    class BookingStatus {
        <<enumeration>>
        PENDING_PAYMENT
        CONFIRMED
        RAC
        WAITLIST
        CANCELLED
        REFUNDED
    }

    class PaymentStatus {
        <<enumeration>>
        PENDING
        SUCCESS
        FAILED
        REFUNDED
    }

    class Gender {
        <<enumeration>>
        MALE
        FEMALE
        OTHER
    }

    class DayOfWeek {
        <<enumeration>>
        MONDAY
        TUESDAY
        WEDNESDAY
        THURSDAY
        FRIDAY
        SATURDAY
        SUNDAY
    }

    class QuotaType {
        <<enumeration>>
        GENERAL
        LADIES
        SENIOR_CITIZEN
        TATKAL
        PREMIUM_TATKAL
    }

    class WaitlistStatus {
        <<enumeration>>
        WAITING
        RAC
        CONFIRMED
        CANCELLED
    }

    class PaymentMethodType {
        <<enumeration>>
        CREDIT_CARD
        DEBIT_CARD
        NET_BANKING
        UPI
        WALLET
    }

    class NotificationType {
        <<enumeration>>
        EMAIL
        SMS
        PUSH
    }

    %% Core Models
    class User {
        -id: string
        -name: string
        -email: string
        -phone: string
        -passwordHash: string
        -dateOfBirth: Date | null
        -createdAt: Date
        -updatedAt: Date
        +User(name, email, phone, password, dateOfBirth, id)
        -hashPassword(password: string): string
        +verifyPassword(password: string): boolean
        +updateProfile(name, email, phone): void
        +updatePassword(oldPassword, newPassword): boolean
        +getId(): string
        +getEmail(): string
        +getPhone(): string
        +getName(): string
    }

    class Station {
        -id: string
        -stationCode: string
        -stationName: string
        -city: string
        -state: string
        -platformCount: number
        +Station(stationCode, stationName, city, state, platformCount, id)
        +isValid(): boolean
        +getDisplayName(): string
        +getLocation(): string
        +getId(): string
        +getStationCode(): string
    }

    class Train {
        -id: string
        -trainNumber: string
        -trainName: string
        -source: Station
        -destination: Station
        -trainType: TrainType
        -schedule: TrainSchedule | null
        -coaches: Map~CoachType, Coach[]~
        -createdAt: Date
        -updatedAt: Date
        +Train(trainNumber, trainName, source, destination, trainType, id)
        +addCoach(coach: Coach): void
        +getCoachesByType(type: CoachType): Coach[]
        +setSchedule(schedule: TrainSchedule): void
        +isOperatingOn(date: Date): boolean
        +getTotalSeats(coachType: CoachType): number
        +getAvailableSeats(coachType: CoachType, date: Date): number
        +getId(): string
        +getTrainNumber(): string
    }

    class TrainSchedule {
        -id: string
        -trainId: string
        -route: RouteStation[]
        -operatingDays: DayOfWeek[]
        -effectiveFrom: Date
        -effectiveTo: Date | null
        +TrainSchedule(trainId, route, operatingDays, effectiveFrom, effectiveTo, id)
        +addStation(routeStation: RouteStation): void
        +getStationByCode(stationCode: string): RouteStation | undefined
        +isOperatingOn(date: Date): boolean
        +getJourneyDuration(): number
        +getDistanceBetweenStations(from, to: string): number
        +getId(): string
    }

    class RouteStation {
        -station: Station
        -arrivalTime: string | null
        -departureTime: string | null
        -platform: number
        -distanceFromOrigin: number
        -stopNumber: number
        +RouteStation(station, stopNumber, distanceFromOrigin, arrivalTime, departureTime, platform)
        +isOrigin(): boolean
        +isDestination(): boolean
        +getHaltDuration(): number
        +getStation(): Station
        +getStopNumber(): number
    }

    class Coach {
        -id: string
        -coachNumber: string
        -coachType: CoachType
        -totalSeats: number
        -trainId: string
        -seats: Seat[]
        +Coach(coachNumber, coachType, totalSeats, trainId, id)
        -initializeSeats(): void
        -initializeBerthSeats(): void
        -initializeChairSeats(): void
        +getAvailableSeats(date: Date): Seat[]
        +getSeatByNumber(seatNumber: string): Seat | undefined
        +getTotalSeats(): number
        +getId(): string
        +getCoachNumber(): string
    }

    class Seat {
        -id: string
        -seatNumber: string
        -berthType: BerthType
        -coachId: string
        -bookings: Map~string, string~
        +Seat(seatNumber, berthType, coachId, id)
        +book(date: string, bookingId: string): boolean
        +release(date: string): void
        +isAvailableOn(date: Date): boolean
        +getId(): string
        +getSeatNumber(): string
        +getBerthType(): BerthType
    }

    class Passenger {
        -id: string
        -name: string
        -age: number
        -gender: Gender
        -berthPreference: BerthPreference
        -coachNumber: string | null
        -seatNumber: string | null
        -status: BookingStatus
        -waitlistPosition: number | null
        +Passenger(name, age, gender, berthPreference, id)
        +assignSeat(coachNumber, seatNumber): void
        +clearSeat(): void
        +setStatus(status: BookingStatus): void
        +setWaitlistPosition(position: number): void
        +isConfirmed(): boolean
        +getId(): string
        +getName(): string
    }

    class Booking {
        -id: string
        -pnr: string
        -userId: string
        -trainId: string
        -passengers: Passenger[]
        -journeyDate: Date
        -sourceStation: Station
        -destinationStation: Station
        -coachType: CoachType
        -bookingState: IBookingState
        -totalFare: number
        -paymentId: string | null
        -bookedAt: Date
        -updatedAt: Date
        +Booking(userId, trainId, passengers, journeyDate, sourceStation, destinationStation, coachType, totalFare, id, pnr)
        +setState(state: IBookingState): void
        +confirm(): void
        +cancel(): void
        +addToWaitlist(position: number): void
        +promoteFromWaitlist(): void
        +getStatus(): BookingStatus
        +calculateRefund(): number
        +setPaymentId(paymentId: string): void
        +getId(): string
        +getPNR(): string
    }

    class Payment {
        -id: string
        -bookingId: string
        -amount: number
        -paymentMethod: IPaymentMethod
        -paymentStatus: PaymentStatus
        -transactionId: string | null
        -processedAt: Date | null
        -createdAt: Date
        +Payment(bookingId, amount, paymentMethod, id)
        +process(): boolean
        +refund(refundAmount: number): boolean
        +markSuccess(transactionId: string): void
        +markFailed(): void
        +getId(): string
        +getStatus(): PaymentStatus
    }

    %% State Pattern
    class IBookingState {
        <<interface>>
        +confirm(booking: Booking): void
        +cancel(booking: Booking): void
        +addToWaitlist(booking: Booking, position: number): void
        +promoteFromWaitlist(booking: Booking): void
        +getStatus(): BookingStatus
        +getStateName(): string
    }

    class PendingPaymentState {
        -createdAt: Date
        +PendingPaymentState()
        +confirm(booking: Booking): void
        +cancel(booking: Booking): void
        +addToWaitlist(booking: Booking, position: number): void
        +promoteFromWaitlist(booking: Booking): void
        +getStatus(): BookingStatus
        +getStateName(): string
    }

    class ConfirmedState {
        -confirmedAt: Date
        +ConfirmedState()
        +confirm(booking: Booking): void
        +cancel(booking: Booking): void
        +addToWaitlist(booking: Booking, position: number): void
        +promoteFromWaitlist(booking: Booking): void
        +getStatus(): BookingStatus
        +getStateName(): string
    }

    class RACState {
        -racPosition: number
        +RACState(position: number)
        +confirm(booking: Booking): void
        +cancel(booking: Booking): void
        +addToWaitlist(booking: Booking, position: number): void
        +promoteFromWaitlist(booking: Booking): void
        +getStatus(): BookingStatus
        +getStateName(): string
    }

    class WaitlistState {
        -waitlistPosition: number
        +WaitlistState(position: number)
        +confirm(booking: Booking): void
        +cancel(booking: Booking): void
        +addToWaitlist(booking: Booking, position: number): void
        +promoteFromWaitlist(booking: Booking): void
        +getStatus(): BookingStatus
        +getStateName(): string
    }

    class CancelledState {
        -refundAmount: number
        -cancelledAt: Date
        +CancelledState(refundAmount: number)
        +confirm(booking: Booking): void
        +cancel(booking: Booking): void
        +addToWaitlist(booking: Booking, position: number): void
        +promoteFromWaitlist(booking: Booking): void
        +getStatus(): BookingStatus
        +getStateName(): string
    }

    %% Strategy Pattern - Payment
    class IPaymentMethod {
        <<interface>>
        +processPayment(amount: number): PaymentResult
        +refund(transactionId: string, amount: number): boolean
        +getMethodName(): string
    }

    class PaymentResult {
        <<interface>>
        +success: boolean
        +transactionId: string
        +message: string
    }

    class CreditCardPayment {
        -cardNumber: string
        -cvv: string
        -expiryDate: string
        -cardHolderName: string
        +CreditCardPayment(cardNumber, cvv, expiryDate, cardHolderName)
        +processPayment(amount: number): PaymentResult
        +refund(transactionId: string, amount: number): boolean
        +getMethodName(): string
        -validateCard(): boolean
    }

    class NetBankingPayment {
        -bankName: string
        -accountNumber: string
        -ifscCode: string
        +NetBankingPayment(bankName, accountNumber, ifscCode)
        +processPayment(amount: number): PaymentResult
        +refund(transactionId: string, amount: number): boolean
        +getMethodName(): string
        -validateBankDetails(): boolean
    }

    class UPIPayment {
        -upiId: string
        +UPIPayment(upiId: string)
        +processPayment(amount: number): PaymentResult
        +refund(transactionId: string, amount: number): boolean
        +getMethodName(): string
        -validateUPIId(): boolean
    }

    %% Strategy Pattern - Seat Allocation
    class ISeatAllocationStrategy {
        <<interface>>
        +allocateSeats(train: Train, passengers: Passenger[], coachType: CoachType, date: Date): AllocationResult
        +getStrategyName(): string
    }

    class AllocationResult {
        <<interface>>
        +success: boolean
        +allocatedSeats: Map~string, Object~
        +message: string
    }

    class AutomaticAllocationStrategy {
        +AutomaticAllocationStrategy()
        +allocateSeats(train: Train, passengers: Passenger[], coachType: CoachType, date: Date): AllocationResult
        +getStrategyName(): string
        -getDateKey(date: Date): string
    }

    class BerthPreferenceStrategy {
        +BerthPreferenceStrategy()
        +allocateSeats(train: Train, passengers: Passenger[], coachType: CoachType, date: Date): AllocationResult
        +getStrategyName(): string
        -findMatchingBerth(availableSeats: Seat[], preference: BerthPreference): Seat | null
        -getDateKey(date: Date): string
    }

    %% Observer Pattern
    class IBookingObserver {
        <<interface>>
        +onBookingStatusChanged(booking: Booking, oldStatus: BookingStatus, newStatus: BookingStatus): void
        +onWaitlistPromoted(booking: Booking, newStatus: BookingStatus): void
        +onBookingCancelled(booking: Booking, refundAmount: number): void
        +getObserverName(): string
    }

    class BookingNotifier {
        -static instance: BookingNotifier
        -observers: IBookingObserver[]
        -BookingNotifier()
        +static getInstance(): BookingNotifier
        +attach(observer: IBookingObserver): void
        +detach(observer: IBookingObserver): void
        +notifyStatusChanged(booking: Booking, oldStatus: BookingStatus, newStatus: BookingStatus): void
        +notifyWaitlistPromoted(booking: Booking, newStatus: BookingStatus): void
        +notifyCancellation(booking: Booking, refundAmount: number): void
    }

    class EmailNotifier {
        +EmailNotifier()
        +onBookingStatusChanged(booking: Booking, oldStatus: BookingStatus, newStatus: BookingStatus): void
        +onWaitlistPromoted(booking: Booking, newStatus: BookingStatus): void
        +onBookingCancelled(booking: Booking, refundAmount: number): void
        +getObserverName(): string
    }

    class SMSNotifier {
        +SMSNotifier()
        +onBookingStatusChanged(booking: Booking, oldStatus: BookingStatus, newStatus: BookingStatus): void
        +onWaitlistPromoted(booking: Booking, newStatus: BookingStatus): void
        +onBookingCancelled(booking: Booking, refundAmount: number): void
        +getObserverName(): string
    }

    %% Repository Pattern
    class IRepository~T~ {
        <<interface>>
        +findById(id: string): T | undefined
        +findAll(): T[]
        +save(entity: T): T
        +delete(id: string): boolean
        +exists(id: string): boolean
        +count(): number
        +clear(): void
    }

    class UserRepository {
        -db: InMemoryDatabase
        +UserRepository()
        +findById(id: string): User | undefined
        +findAll(): User[]
        +save(entity: User): User
        +delete(id: string): boolean
        +exists(id: string): boolean
        +count(): number
        +clear(): void
        +findByEmail(email: string): User | undefined
        +findByPhone(phone: string): User | undefined
    }

    class StationRepository {
        -db: InMemoryDatabase
        +StationRepository()
        +findById(id: string): Station | undefined
        +findAll(): Station[]
        +save(entity: Station): Station
        +delete(id: string): boolean
        +exists(id: string): boolean
        +count(): number
        +clear(): void
        +findByCode(code: string): Station | undefined
    }

    class TrainRepository {
        -db: InMemoryDatabase
        +TrainRepository()
        +findById(id: string): Train | undefined
        +findAll(): Train[]
        +save(entity: Train): Train
        +delete(id: string): boolean
        +exists(id: string): boolean
        +count(): number
        +clear(): void
        +findByTrainNumber(trainNumber: string): Train | undefined
        +existsByTrainNumber(trainNumber: string): boolean
    }

    class TrainScheduleRepository {
        -db: InMemoryDatabase
        +TrainScheduleRepository()
        +findById(id: string): TrainSchedule | undefined
        +findAll(): TrainSchedule[]
        +save(entity: TrainSchedule): TrainSchedule
        +delete(id: string): boolean
        +exists(id: string): boolean
        +count(): number
        +clear(): void
        +findByTrainId(trainId: string): TrainSchedule | undefined
    }

    class CoachRepository {
        -db: InMemoryDatabase
        +CoachRepository()
        +findById(id: string): Coach | undefined
        +findAll(): Coach[]
        +save(entity: Coach): Coach
        +delete(id: string): boolean
        +exists(id: string): boolean
        +count(): number
        +clear(): void
        +findByTrainId(trainId: string): Coach[]
    }

    class BookingRepository {
        -db: InMemoryDatabase
        +BookingRepository()
        +findById(id: string): Booking | undefined
        +findAll(): Booking[]
        +save(entity: Booking): Booking
        +update(entity: Booking): Booking
        +delete(id: string): boolean
        +exists(id: string): boolean
        +count(): number
        +clear(): void
        +findByPNR(pnr: string): Booking | undefined
        +findByUserId(userId: string): Booking[]
    }

    class PaymentRepository {
        -db: InMemoryDatabase
        +PaymentRepository()
        +findById(id: string): Payment | undefined
        +findAll(): Payment[]
        +save(entity: Payment): Payment
        +delete(id: string): boolean
        +exists(id: string): boolean
        +count(): number
        +clear(): void
        +findByBookingId(bookingId: string): Payment | undefined
    }

    %% Database
    class InMemoryDatabase {
        -static instance: InMemoryDatabase
        +users: Map~string, User~
        +stations: Map~string, Station~
        +trains: Map~string, Train~
        +trainSchedules: Map~string, TrainSchedule~
        +coaches: Map~string, Coach~
        +seats: Map~string, Seat~
        +bookings: Map~string, Booking~
        +payments: Map~string, Payment~
        +usersByEmail: Map~string, User~
        +usersByPhone: Map~string, User~
        +stationsByCode: Map~string, Station~
        +trainsByNumber: Map~string, Train~
        +bookingsByPNR: Map~string, Booking~
        +bookingsByUserId: Map~string, Booking[]~
        +schedulesByTrainId: Map~string, TrainSchedule~
        -InMemoryDatabase()
        +static getInstance(): InMemoryDatabase
        +addUser(user: User): void
        +addStation(station: Station): void
        +addTrain(train: Train): void
        +addBooking(booking: Booking): void
        +addPayment(payment: Payment): void
        +removeBooking(id: string): void
        +updateBookingIndexes(booking: Booking): void
        +clear(): void
    }

    %% Services
    class UserService {
        -userRepo: UserRepository
        +UserService()
        +registerUser(name, email, phone, password, dateOfBirth): User | null
        +loginUser(email, password): User | null
        +getUserById(id: string): User | undefined
        +updateUserProfile(userId, name, email, phone): boolean
        +changePassword(userId, oldPassword, newPassword): boolean
    }

    class StationService {
        -stationRepo: StationRepository
        +StationService()
        +addStation(stationCode, stationName, city, state, platformCount): Station | null
        +getStationByCode(code: string): Station | undefined
        +getAllStations(): Station[]
        +searchStations(query: string): Station[]
    }

    class TrainService {
        -trainRepo: TrainRepository
        -scheduleRepo: TrainScheduleRepository
        -coachRepo: CoachRepository
        +TrainService()
        +addTrain(trainNumber, trainName, source, destination, trainType): Train | null
        +addCoachesToTrain(trainId, coachConfigs): void
        +setTrainSchedule(trainId, schedule): boolean
        +getTrainByNumber(trainNumber: string): Train | undefined
        +searchTrains(source, destination, date): Train[]
    }

    class BookingService {
        -bookingRepo: BookingRepository
        -paymentRepo: PaymentRepository
        -trainRepo: TrainRepository
        -notifier: BookingNotifier
        +BookingService()
        +createBooking(userId, trainId, passengers, journeyDate, sourceStation, destinationStation, coachType, totalFare): Booking | null
        +processPayment(bookingId, paymentMethod): boolean
        +confirmBooking(bookingId): boolean
        +cancelBooking(bookingId): boolean
        +getBookingByPNR(pnr: string): Booking | undefined
        +getUserBookings(userId: string): Booking[]
        -allocateSeats(train, passengers, coachType, date): AllocationResult
    }

    class SetupService {
        -stationService: StationService
        -trainService: TrainService
        +SetupService()
        +initializeSystem(): void
        -createStations(): void
        -createTrains(): void
    }

    %% Utilities
    class IdGenerator {
        <<utility>>
        +static generateUUID(): string
        +static generatePNR(): string
        +static generateTransactionId(): string
    }

    class Logger {
        <<utility>>
        +static info(message: string): void
        +static success(message: string): void
        +static warn(message: string): void
        +static error(message: string): void
    }

    %% Console Interface
    class ConsoleInterface {
        -userService: UserService
        -stationService: StationService
        -trainService: TrainService
        -bookingService: BookingService
        -currentUser: User | null
        +ConsoleInterface()
        +start(): Promise~void~
        -showMainMenu(): Promise~void~
        -handleLogin(): Promise~void~
        -handleRegistration(): Promise~void~
        -searchTrains(): Promise~void~
        -bookTicket(): Promise~void~
        -viewBookings(): Promise~void~
        -cancelBooking(): Promise~void~
    }

    %% Relationships - Inheritance (Extends)
    IBookingState <|.. PendingPaymentState : implements
    IBookingState <|.. ConfirmedState : implements
    IBookingState <|.. RACState : implements
    IBookingState <|.. WaitlistState : implements
    IBookingState <|.. CancelledState : implements
    
    IPaymentMethod <|.. CreditCardPayment : implements
    IPaymentMethod <|.. NetBankingPayment : implements
    IPaymentMethod <|.. UPIPayment : implements
    
    ISeatAllocationStrategy <|.. AutomaticAllocationStrategy : implements
    ISeatAllocationStrategy <|.. BerthPreferenceStrategy : implements
    
    IBookingObserver <|.. EmailNotifier : implements
    IBookingObserver <|.. SMSNotifier : implements
    
    IRepository~T~ <|.. UserRepository : implements
    IRepository~T~ <|.. StationRepository : implements
    IRepository~T~ <|.. TrainRepository : implements
    IRepository~T~ <|.. TrainScheduleRepository : implements
    IRepository~T~ <|.. CoachRepository : implements
    IRepository~T~ <|.. BookingRepository : implements
    IRepository~T~ <|.. PaymentRepository : implements

    %% Relationships - Composition (Strong ownership)
    Train *-- Coach : contains
    Coach *-- Seat : contains
    TrainSchedule *-- RouteStation : contains
    Booking *-- Passenger : contains
    
    %% Relationships - Aggregation (Shared ownership)
    Train o-- Station : source/destination
    Train o-- TrainSchedule : has schedule
    RouteStation o-- Station : references
    Booking o-- Station : source/destination
    Booking o-- IBookingState : has state
    Payment o-- IPaymentMethod : uses strategy
    
    %% Relationships - Association
    Booking --> User : booked by
    Booking --> Train : for train
    Payment --> Booking : for booking
    Passenger --> BerthPreference : has preference
    Passenger --> BookingStatus : has status
    Seat --> BerthType : has type
    Train --> TrainType : has type
    Coach --> CoachType : has type
    
    BookingService --> ISeatAllocationStrategy : uses
    BookingService --> BookingNotifier : notifies
    BookingNotifier --> IBookingObserver : notifies
    
    UserService --> UserRepository : uses
    StationService --> StationRepository : uses
    TrainService --> TrainRepository : uses
    TrainService --> TrainScheduleRepository : uses
    TrainService --> CoachRepository : uses
    BookingService --> BookingRepository : uses
    BookingService --> PaymentRepository : uses
    BookingService --> TrainRepository : uses
    
    UserRepository --> InMemoryDatabase : uses
    StationRepository --> InMemoryDatabase : uses
    TrainRepository --> InMemoryDatabase : uses
    TrainScheduleRepository --> InMemoryDatabase : uses
    CoachRepository --> InMemoryDatabase : uses
    BookingRepository --> InMemoryDatabase : uses
    PaymentRepository --> InMemoryDatabase : uses
    
    ConsoleInterface --> UserService : uses
    ConsoleInterface --> StationService : uses
    ConsoleInterface --> TrainService : uses
    ConsoleInterface --> BookingService : uses
    
    SetupService --> StationService : uses
    SetupService --> TrainService : uses
```

## Relationship Legend

### 1. **Inheritance (Implements)** - `<|..`
- **State Pattern**: All booking state classes implement `IBookingState` interface
- **Strategy Pattern - Payment**: Payment method classes implement `IPaymentMethod` interface
- **Strategy Pattern - Seat Allocation**: Allocation strategies implement `ISeatAllocationStrategy` interface
- **Observer Pattern**: Notifier classes implement `IBookingObserver` interface
- **Repository Pattern**: All repository classes implement `IRepository<T>` interface

### 2. **Composition** (Strong ownership, lifecycle dependent) - `*--`
- `Train` *contains* `Coach` (Coaches are part of a Train)
- `Coach` *contains* `Seat` (Seats are part of a Coach)
- `TrainSchedule` *contains* `RouteStation` (Route stations define schedule)
- `Booking` *contains* `Passenger` (Passengers are part of booking)

### 3. **Aggregation** (Shared ownership, lifecycle independent) - `o--`
- `Train` has `Station` (source/destination exist independently)
- `Train` has `TrainSchedule` (Schedule can change)
- `RouteStation` references `Station` (Stations exist independently)
- `Booking` has `Station` (source/destination)
- `Booking` has `IBookingState` (State can transition)
- `Payment` uses `IPaymentMethod` (Strategy pattern)

### 4. **Association** (Uses/Depends on) - `-->`
- `Booking` is booked by `User`
- `Booking` is for `Train`
- `Payment` is for `Booking`
- Services use Repositories
- Repositories use `InMemoryDatabase`
- `ConsoleInterface` uses Services
- `BookingService` uses strategies and notifier

## Design Patterns Used

1. **Singleton Pattern**: `InMemoryDatabase`, `BookingNotifier`
2. **State Pattern**: `IBookingState` and implementations (PendingPayment, Confirmed, RAC, Waitlist, Cancelled)
3. **Strategy Pattern**: 
   - Payment strategies (`IPaymentMethod`)
   - Seat allocation strategies (`ISeatAllocationStrategy`)
4. **Observer Pattern**: `IBookingObserver`, `BookingNotifier` (Subject), notifier implementations
5. **Repository Pattern**: `IRepository<T>` and all repository implementations
6. **Factory Pattern**: `IdGenerator` for generating IDs, PNRs, and transaction IDs

## Key Features

- **Multi-coach train management** with different coach types
- **Dynamic seat allocation** with berth preferences
- **Booking state management** (Pending → Confirmed/RAC/Waitlist → Cancelled)
- **Multiple payment methods** with strategy pattern
- **Real-time notifications** via observer pattern
- **Route scheduling** with operating days
- **Refund calculation** for cancellations
- **User authentication** and profile management
