# Parking Lot System - Complete Class Diagram

This diagram represents the complete architecture of the Parking Lot Management System with proper UML relationships.

## Design Patterns Used
1. **Singleton Pattern**: InMemoryDatabase, ParkingLotService
2. **Repository Pattern**: IRepository interface with 5 implementations
3. **Factory Pattern**: VehicleFactory, SpotFactory for creating vehicles and parking spots
4. **Strategy Pattern**: IPricingStrategy (3 implementations), IAllocationStrategy (2 implementations)

```mermaid
classDiagram
    %% ============================================
    %% ENUMS
    %% ============================================
    class VehicleType {
        <<enumeration>>
        BIKE
        CAR
        VAN
        TRUCK
    }

    class SpotType {
        <<enumeration>>
        COMPACT
        STANDARD
        LARGE
        HANDICAPPED
    }

    class SpotState {
        <<enumeration>>
        AVAILABLE
        OCCUPIED
        RESERVED
        UNDER_MAINTENANCE
    }

    class AccessibilityLevel {
        <<enumeration>>
        HIGH
        MEDIUM
        LOW
    }

    class TicketStatus {
        <<enumeration>>
        OPEN
        CLOSED
        LOST
    }

    class PaymentStatus {
        <<enumeration>>
        PENDING
        PAID
        FAILED
        REFUNDED
    }

    class PaymentMethod {
        <<enumeration>>
        CASH
        CREDIT_CARD
        DEBIT_CARD
        UPI
        WALLET
    }

    class GateType {
        <<enumeration>>
        ENTRY
        EXIT
        BOTH
    }

    class AdminRole {
        <<enumeration>>
        ADMIN
        OPERATOR
        SECURITY
    }

    class ReservationStatus {
        <<enumeration>>
        PENDING
        CONFIRMED
        CANCELLED
        EXPIRED
    }

    %% ============================================
    %% CORE MODELS - VEHICLE HIERARCHY
    %% ============================================
    class Vehicle {
        <<abstract>>
        +String id
        +String licensePlate
        +VehicleType type
        +String color
        +Date createdAt
        +Date updatedAt
        +getVehicleInfo() String
        #update() void
    }

    class Bike {
        +Bike(licensePlate, color, id?)
    }

    class Car {
        +Car(licensePlate, color, id?)
    }

    class Van {
        +Van(licensePlate, color, id?)
    }

    class Truck {
        +Truck(licensePlate, color, id?)
    }

    %% ============================================
    %% CORE MODELS - PARKING INFRASTRUCTURE
    %% ============================================
    class ParkingSpot {
        +String id
        +String spotNumber
        +String floorId
        +SpotType type
        +SpotState state
        +AccessibilityLevel accessibilityLevel
        +number distanceScore
        +String currentVehicleId
        +String currentTicketId
        +Date createdAt
        +Date updatedAt
        +assignVehicle(vehicleId, ticketId) void
        +releaseSpot() void
        +reserveSpot() void
        +markUnderMaintenance() void
        +markAvailable() void
        +isAvailable() boolean
        +isOccupied() boolean
        +canAccommodate(vehicleType) boolean
        -update() void
    }

    class Floor {
        +String id
        +number floorNumber
        +ParkingSpot[] spots
        +Date createdAt
        +Date updatedAt
        +addSpot(spot) void
        +removeSpot(spotId) void
        +getAvailableSpotsByType(vehicleType) number
        +findAvailableSpots(filter?) ParkingSpot[]
        +getOccupancyRate() number
        -canAccommodate(spot, vehicleType) boolean
        -update() void
    }

    %% ============================================
    %% CORE MODELS - TICKETING & PAYMENT
    %% ============================================
    class Ticket {
        +String id
        +String ticketNumber
        +String vehicleId
        +String spotId
        +String entryGateId
        +String exitGateId
        +Date entryTime
        +Date exitTime
        +number expectedDurationHours
        +number actualDurationHours
        +TicketStatus status
        +Date createdAt
        +Date updatedAt
        +closeTicket(exitGateId) void
        +markLost() void
        +calculateActualDuration() number
        +isOverstayed(tolerancePercent) boolean
        -update() void
    }

    class Payment {
        +String id
        +String ticketId
        +number amount
        +number baseAmount
        +number overstayPenalty
        +number discounts
        +PaymentStatus status
        +PaymentMethod method
        +Date createdAt
        +Date updatedAt
        -calculateTotal() number
        +markPaid(method) void
        +markFailed() void
        +addDiscount(amount) void
        +applyOverstayPenalty(penalty) void
        -update() void
    }

    %% ============================================
    %% SERVICES
    %% ============================================
    class ParkingLotService {
        <<Singleton>>
        -static ParkingLotService instance
        -FloorRepository floorRepo
        -VehicleRepository vehicleRepo
        -TicketRepository ticketRepo
        -PaymentRepository paymentRepo
        -ParkingSpotRepository spotRepo
        -IAllocationStrategy allocationStrategy
        -IPricingStrategy pricingStrategy
        -String name
        +static getInstance() ParkingLotService
        +parkVehicle(vehicle, duration, gateId) Ticket
        +exitVehicle(ticketNumber, exitGateId) Payment
        +findAvailableSpot(vehicleType) ParkingSpot
        +getTicketInfo(ticketNumber) Ticket
        +setAllocationStrategy(strategy) void
        +setPricingStrategy(strategy) void
        +getOccupancyReport() Object
        +getFloorReport(floorNumber) Object
    }

    class PaymentService {
        -PaymentRepository paymentRepo
        +processPayment(payment, method) boolean
        +getPaymentByTicketId(ticketId) Payment
        +getTotalRevenue() number
        +getPendingPayments() Payment[]
        +printRevenueReport() void
    }

    class ReportService {
        -TicketRepository ticketRepo
        -VehicleRepository vehicleRepo
        -ParkingSpotRepository spotRepo
        -PaymentRepository paymentRepo
        +printSystemReport() void
        +getVehicleStats() Object
        +getTicketStats() Object
        +getSpotStats() Object
        +getFinancialStats() Object
    }

    class SetupService {
        -FloorRepository floorRepo
        -ParkingSpotRepository spotRepo
        +initializeParkingLot(numberOfFloors) void
        +addFloor(floorNumber) Floor
        +removeFloor(floorId) void
        +addSpotsToFloor(floorId, spotConfig) void
    }

    %% ============================================
    %% REPOSITORIES
    %% ============================================
    class IRepository~T~ {
        <<interface>>
        +findById(id) T
        +findAll() T[]
        +save(entity) T
        +delete(id) boolean
        +exists(id) boolean
        +count() number
        +clear() void
    }

    class VehicleRepository {
        -InMemoryDatabase db
        +findByLicensePlate(licensePlate) Vehicle
        +findByType(type) Vehicle[]
    }

    class ParkingSpotRepository {
        -InMemoryDatabase db
        +findByFloorId(floorId) ParkingSpot[]
        +findByState(state) ParkingSpot[]
        +findByType(type) ParkingSpot[]
        +findAvailableByType(type) ParkingSpot[]
    }

    class FloorRepository {
        -InMemoryDatabase db
        +findByFloorNumber(floorNumber) Floor
        +getAllFloors() Floor[]
    }

    class TicketRepository {
        -InMemoryDatabase db
        +findByTicketNumber(ticketNumber) Ticket
        +findActiveTicketForVehicle(vehicleId) Ticket
        +findByStatus(status) Ticket[]
        +findByVehicleId(vehicleId) Ticket[]
    }

    class PaymentRepository {
        -InMemoryDatabase db
        +findByTicketId(ticketId) Payment
        +findByStatus(status) Payment[]
        +getTotalRevenue() number
        +getTotalPendingAmount() number
    }

    %% ============================================
    %% DATABASE (SINGLETON)
    %% ============================================
    class InMemoryDatabase {
        <<Singleton>>
        -static InMemoryDatabase instance
        +Map~String, Vehicle~ vehicles
        +Map~String, ParkingSpot~ parkingSpots
        +Map~String, Floor~ floors
        +Map~String, Ticket~ tickets
        +Map~String, Payment~ payments
        -Map~String, Vehicle~ vehiclesByLicensePlate
        -Map~String, Ticket~ ticketsByNumber
        -Map~String, Set~ spotsByFloor
        -Map~String, String~ activeTicketsByVehicle
        +static getInstance() InMemoryDatabase
        +saveVehicle(vehicle) void
        +getVehicleByLicensePlate(licensePlate) Vehicle
        +saveTicket(ticket) void
        +getTicketByNumber(ticketNumber) Ticket
        +getActiveTicketForVehicle(vehicleId) Ticket
        +closeTicket(ticketId) void
        +saveSpot(spot) void
        +getSpotsByFloor(floorId) ParkingSpot[]
        +clearAll() void
        +printStats() void
    }

    %% ============================================
    %% STRATEGY PATTERN - PRICING
    %% ============================================
    class PricingBreakdown {
        <<interface>>
        +number baseAmount
        +number overstayPenalty
        +number discounts
        +number totalAmount
    }

    class IPricingStrategy {
        <<interface>>
        +calculateFee(ticket) PricingBreakdown
        +getName() String
    }

    class HourlyPricingStrategy {
        -String name
        -Map~VehicleType, number~ baseRatePerHour
        -number overstayPenaltyRate
        +calculateFee(ticket) PricingBreakdown
        +getName() String
        +setRateForVehicleType(type, rate) void
    }

    class FlatRatePricingStrategy {
        -String name
        -Map~VehicleType, number~ flatRates
        +calculateFee(ticket) PricingBreakdown
        +getName() String
        +setFlatRateForVehicleType(type, rate) void
    }

    class DurationAwareStrategy {
        -String name
        -Map~VehicleType, number~ hourlyRates
        -number shortStayDiscount
        -number longStayPremium
        +calculateFee(ticket) PricingBreakdown
        +getName() String
    }

    %% ============================================
    %% STRATEGY PATTERN - ALLOCATION
    %% ============================================
    class IAllocationStrategy {
        <<interface>>
        +allocateSpot(vehicle, duration, floors) ParkingSpot
        +getName() String
    }

    class NearestSpotStrategy {
        -String name
        +allocateSpot(vehicle, duration, floors) ParkingSpot
        +getName() String
    }

    class DurationAwareAllocationStrategy {
        -String name
        +allocateSpot(vehicle, duration, floors) ParkingSpot
        +getName() String
        -isLongStay(duration) boolean
    }

    %% ============================================
    %% FACTORY PATTERN
    %% ============================================
    class VehicleFactory {
        <<Factory>>
        +static createVehicle(type, licensePlate, color, id?) Vehicle
    }

    class SpotFactory {
        <<Factory>>
        +static createSpot(floorId, floorNumber, spotIndex, type, accessibility, distance?) ParkingSpot
        +static createBatch(floorId, floorNumber, config[]) ParkingSpot[]
    }

    %% ============================================
    %% UTILITIES
    %% ============================================
    class IdGenerator {
        <<utility>>
        +static generateUUID() String
        +static generateTicketNumber() String
        +static generateSpotNumber(floorNumber, spotIndex) String
    }

    class Logger {
        <<utility>>
        +static info(message) void
        +static success(message) void
        +static error(message) void
        +static warn(message) void
        +static header(message) void
    }

    class ConsoleInterface {
        -ParkingLotService parkingService
        -PaymentService paymentService
        -ReportService reportService
        -SetupService setupService
        +start() void
        -showMainMenu() void
        -handleParkVehicle() void
        -handleExitVehicle() void
        -handleViewReports() void
    }

    %% ============================================
    %% RELATIONSHIPS - ENUMS TO MODELS
    %% ============================================
    Vehicle --> VehicleType : uses
    ParkingSpot --> SpotType : uses
    ParkingSpot --> SpotState : uses
    ParkingSpot --> AccessibilityLevel : uses
    Ticket --> TicketStatus : uses
    Payment --> PaymentStatus : uses
    Payment --> PaymentMethod : uses

    %% ============================================
    %% RELATIONSHIPS - INHERITANCE (VEHICLE)
    %% ============================================
    Bike --|> Vehicle : extends
    Car --|> Vehicle : extends
    Van --|> Vehicle : extends
    Truck --|> Vehicle : extends

    %% ============================================
    %% RELATIONSHIPS - COMPOSITION (*--)
    %% Floor owns ParkingSpots (lifecycle dependent)
    %% ============================================
    Floor *-- ParkingSpot : composition

    %% ============================================
    %% RELATIONSHIPS - AGGREGATION (o--)
    %% Ticket aggregates Vehicle, ParkingSpot
    %% Payment aggregates Ticket
    %% ============================================
    Ticket o-- Vehicle : aggregation
    Ticket o-- ParkingSpot : aggregation
    Payment o-- Ticket : aggregation

    %% ============================================
    %% RELATIONSHIPS - ASSOCIATION (-->)
    %% Simple references between entities
    %% ============================================
    ParkingSpot --> Floor : belongsTo
    Ticket --> Vehicle : references
    Ticket --> ParkingSpot : references
    Payment --> Ticket : references

    %% ============================================
    %% RELATIONSHIPS - SERVICES TO REPOSITORIES
    %% ============================================
    ParkingLotService --> FloorRepository : uses
    ParkingLotService --> VehicleRepository : uses
    ParkingLotService --> TicketRepository : uses
    ParkingLotService --> PaymentRepository : uses
    ParkingLotService --> ParkingSpotRepository : uses
    ParkingLotService --> IAllocationStrategy : uses
    ParkingLotService --> IPricingStrategy : uses
    ParkingLotService ..> Ticket : creates
    ParkingLotService ..> Payment : creates

    PaymentService --> PaymentRepository : uses
    PaymentService ..> Payment : manages

    ReportService --> TicketRepository : uses
    ReportService --> VehicleRepository : uses
    ReportService --> ParkingSpotRepository : uses
    ReportService --> PaymentRepository : uses

    SetupService --> FloorRepository : uses
    SetupService --> ParkingSpotRepository : uses
    SetupService --> SpotFactory : uses
    SetupService ..> Floor : creates

    ConsoleInterface --> ParkingLotService : uses
    ConsoleInterface --> PaymentService : uses
    ConsoleInterface --> ReportService : uses
    ConsoleInterface --> SetupService : uses

    %% ============================================
    %% RELATIONSHIPS - REPOSITORY IMPLEMENTATIONS
    %% ============================================
    VehicleRepository ..|> IRepository : implements
    ParkingSpotRepository ..|> IRepository : implements
    FloorRepository ..|> IRepository : implements
    TicketRepository ..|> IRepository : implements
    PaymentRepository ..|> IRepository : implements

    %% ============================================
    %% RELATIONSHIPS - REPOSITORIES TO DATABASE
    %% ============================================
    VehicleRepository --> InMemoryDatabase : uses
    ParkingSpotRepository --> InMemoryDatabase : uses
    FloorRepository --> InMemoryDatabase : uses
    TicketRepository --> InMemoryDatabase : uses
    PaymentRepository --> InMemoryDatabase : uses

    %% ============================================
    %% RELATIONSHIPS - PRICING STRATEGY PATTERN
    %% ============================================
    HourlyPricingStrategy ..|> IPricingStrategy : implements
    FlatRatePricingStrategy ..|> IPricingStrategy : implements
    DurationAwareStrategy ..|> IPricingStrategy : implements
    IPricingStrategy ..> PricingBreakdown : returns

    %% ============================================
    %% RELATIONSHIPS - ALLOCATION STRATEGY PATTERN
    %% ============================================
    NearestSpotStrategy ..|> IAllocationStrategy : implements
    DurationAwareAllocationStrategy ..|> IAllocationStrategy : implements

    %% ============================================
    %% RELATIONSHIPS - FACTORY PATTERN
    %% ============================================
    VehicleFactory ..> Vehicle : creates
    VehicleFactory ..> Bike : creates
    VehicleFactory ..> Car : creates
    VehicleFactory ..> Van : creates
    VehicleFactory ..> Truck : creates
    SpotFactory ..> ParkingSpot : creates

    %% ============================================
    %% RELATIONSHIPS - UTILITIES
    %% ============================================
    Vehicle ..> IdGenerator : uses
    ParkingSpot ..> IdGenerator : uses
    Floor ..> IdGenerator : uses
    Ticket ..> IdGenerator : uses
    Payment ..> IdGenerator : uses
```

## UML Relationship Types Explained

### 1. Inheritance (--|>)
**Meaning**: IS-A relationship - child extends parent class
- **Bike --|> Vehicle**: Bike is a Vehicle
- **Car --|> Vehicle**: Car is a Vehicle
- **Van --|> Vehicle**: Van is a Vehicle
- **Truck --|> Vehicle**: Truck is a Vehicle

### 2. Composition (*--)
**Meaning**: Strong ownership - child cannot exist without parent
- **Floor *-- ParkingSpot**: ParkingSpots belong to Floor, destroyed when Floor is deleted

### 3. Aggregation (o--)
**Meaning**: Weak ownership - child can exist independently
- **Ticket o-- Vehicle**: Ticket references Vehicle, but Vehicle exists independently
- **Ticket o-- ParkingSpot**: Ticket references ParkingSpot, but spot exists independently
- **Payment o-- Ticket**: Payment references Ticket, but ticket can exist without payment

### 4. Association (-->)
**Meaning**: Simple relationship or reference
- **ParkingSpot --> Floor**: Spot belongs to a floor
- **Ticket --> Vehicle**: Ticket references vehicle
- **Payment --> Ticket**: Payment references ticket

### 5. Dependency (..>)
**Meaning**: One class uses another (creates, manages, or depends on)
- **ParkingLotService ..> Ticket**: Service creates Ticket instances
- **VehicleFactory ..> Vehicle**: Factory creates Vehicle instances
- **SetupService ..> Floor**: Service creates Floor instances

### 6. Implementation (..|>)
**Meaning**: Class implements an interface
- **VehicleRepository ..|> IRepository**: Implements repository interface
- **HourlyPricingStrategy ..|> IPricingStrategy**: Implements pricing strategy interface
- **NearestSpotStrategy ..|> IAllocationStrategy**: Implements allocation strategy

## Architecture Layers

### Presentation Layer
- ConsoleInterface (command-line interface)

### Service Layer (4 Services)
- ParkingLotService (Singleton - core parking operations)
- PaymentService (payment processing)
- ReportService (reporting and analytics)
- SetupService (system initialization)

### Repository Layer (5 Repositories + Interface)
- IRepository<T> (interface)
- VehicleRepository
- ParkingSpotRepository
- FloorRepository
- TicketRepository
- PaymentRepository

### Model Layer (6 Core Models)
- Vehicle (abstract) + 4 concrete types
- ParkingSpot
- Floor
- Ticket
- Payment

### Data Layer
- InMemoryDatabase (Singleton)

### Pattern Layer
- **Factory**: VehicleFactory, SpotFactory
- **Strategy - Pricing**: IPricingStrategy + 3 implementations
- **Strategy - Allocation**: IAllocationStrategy + 2 implementations

### Utility Layer
- IdGenerator
- Logger

## Design Pattern Details

### 1. Singleton Pattern
**Classes**: InMemoryDatabase, ParkingLotService
**Purpose**: Ensure single instance across application
**Benefits**: 
- Centralized data storage
- Single point of control for parking operations
- Consistent state management

### 2. Repository Pattern
**Classes**: IRepository<T> interface + 5 implementations
**Purpose**: Abstract data access layer
**Benefits**:
- Clean separation of concerns
- Easy to swap data sources
- Testable code
- Consistent CRUD operations

### 3. Factory Pattern
**Classes**: VehicleFactory, SpotFactory
**Purpose**: Centralize object creation logic
**Methods**:
- VehicleFactory:
  - createVehicle(): Creates appropriate vehicle type based on VehicleType enum
- SpotFactory:
  - createSpot(): Creates single parking spot with configuration
  - createBatch(): Bulk creates spots with different configurations

### 4. Strategy Pattern - Pricing
**Interface**: IPricingStrategy
**Implementations**:
- **HourlyPricingStrategy**: Charges based on hourly rates per vehicle type
- **FlatRatePricingStrategy**: Fixed rate regardless of duration
- **DurationAwareStrategy**: Combines hourly rates with duration-based discounts/premiums
**Purpose**: Pluggable pricing algorithms
**Benefits**:
- Easy to add new pricing models
- Swap pricing strategies at runtime
- Open/Closed Principle

### 5. Strategy Pattern - Allocation
**Interface**: IAllocationStrategy
**Implementations**:
- **NearestSpotStrategy**: Allocates closest available spot (based on distanceScore)
- **DurationAwareAllocationStrategy**: Allocates spots based on expected stay duration
  - Short stays: High accessibility spots (near entrance)
  - Long stays: Low accessibility spots (back areas)
**Purpose**: Different spot allocation algorithms
**Benefits**:
- Optimize parking lot utilization
- Better customer experience
- Flexible allocation policies

## Key Features

### Vehicle Management
- Multiple vehicle types (Bike, Car, Van, Truck)
- Vehicle registration by license plate
- Abstract Vehicle class with concrete implementations

### Parking Infrastructure
- Multi-floor parking structure
- Different spot types (Compact, Standard, Large, Handicapped)
- Accessibility levels (High, Medium, Low)
- Distance scoring for spot allocation
- Spot state management (Available, Occupied, Reserved, Under Maintenance)

### Ticketing System
- Automatic ticket generation on entry
- Expected duration tracking
- Overstay detection
- Ticket status management (Open, Closed, Lost)
- Entry/exit gate tracking

### Payment Processing
- Multiple payment methods (Cash, Card, UPI, Wallet)
- Base amount calculation
- Overstay penalty calculation
- Discount support
- Payment status tracking

### Reporting & Analytics
- System-wide reports
- Occupancy rates
- Revenue tracking
- Vehicle statistics
- Floor-wise reports

## Business Flows

### Vehicle Entry Flow
1. Vehicle arrives at entry gate
2. System checks if vehicle already parked
3. Allocation strategy finds suitable spot
4. Vehicle registered (if new)
5. Ticket created and issued
6. Spot marked as occupied
7. Ticket number returned to driver

### Vehicle Exit Flow
1. Driver presents ticket at exit gate
2. System retrieves ticket information
3. Pricing strategy calculates fee
4. Payment created
5. Driver makes payment
6. Ticket closed
7. Spot released
8. Barrier opens

### Spot Allocation Flow
1. System receives vehicle and expected duration
2. Allocation strategy evaluates available spots
3. Considers vehicle type compatibility
4. Applies strategy-specific logic (nearest/duration-aware)
5. Returns best matching spot
6. Spot assigned to vehicle

### Pricing Calculation Flow
1. Ticket closed with exit time
2. Actual duration calculated
3. Pricing strategy selected
4. Base amount calculated
5. Overstay penalty added (if applicable)
6. Discounts applied (if any)
7. Final amount computed

## Key Statistics

- **Total Classes**: 40+
- **Models**: 6 core models + 4 vehicle types
- **Services**: 4 service classes
- **Repositories**: 5 + 1 interface
- **Design Patterns**: 4 patterns
- **Strategy Implementations**: 5 (3 pricing + 2 allocation)
- **Enums**: 10
- **Singletons**: 2
- **Factories**: 2

## Relationship Summary

| Relationship Type | Count | Usage |
|------------------|-------|-------|
| Inheritance (--\|>) | 4 | Vehicle subclasses |
| Composition (*--) | 1 | Floor owns ParkingSpots |
| Aggregation (o--) | 3 | Weak ownership |
| Association (-->) | 10+ | References |
| Dependency (..>) | 15+ | Usage/Creation |
| Implementation (..\|>) | 10 | Interface implementation |

## System Benefits

### For Parking Lot Operators
- Automated ticketing system
- Real-time occupancy tracking
- Multiple pricing strategies
- Revenue analytics
- Efficient spot allocation
- Multi-floor management

### For Customers
- Quick vehicle entry/exit
- Multiple payment options
- Transparent pricing
- Different vehicle types supported
- Accessibility-based spot allocation
- Clear ticket information

### Platform Features
- Scalable multi-floor design
- Flexible pricing models
- Intelligent spot allocation
- Comprehensive reporting
- Maintenance mode for spots
- Lost ticket handling
- Overstay penalty system

## Extensibility Points

### Easy to Add
1. **New Vehicle Types**: Extend Vehicle class
2. **New Pricing Strategies**: Implement IPricingStrategy
3. **New Allocation Strategies**: Implement IAllocationStrategy
4. **New Payment Methods**: Add to PaymentMethod enum
5. **New Spot Types**: Add to SpotType enum

### Customization Options
- Hourly rates per vehicle type
- Overstay penalty rates
- Distance scores per spot
- Discount policies
- Floor configurations
- Spot type distributions

