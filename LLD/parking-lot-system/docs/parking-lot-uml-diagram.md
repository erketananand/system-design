# PARKING LOT SYSTEM - CLASS DIAGRAM

## Core Classes

### ParkingLot (Singleton)
- id: string
- name: string
- floors: Floor[]
- entryGates: EntryGate[]
- exitGates: ExitGate[]
- tickets: Map<string, Ticket>
- pricingStrategy: IPricingStrategy
- allocationStrategy: IAllocationStrategy

Methods:
- getInstance(): ParkingLot
- addFloor(floor: Floor): void
- addGate(gate: Gate): void
- parkVehicle(vehicle: Vehicle, expectedDurationHours: number, entryGateId: string): Ticket
- unparkVehicle(ticketId: string, exitGateId: string): Payment
- getAvailableSpotsSummary(): AvailabilitySummary
- updatePricingStrategy(strategy: IPricingStrategy): void
- updateAllocationStrategy(strategy: IAllocationStrategy): void

---

### Floor
- id: string
- floorNumber: number
- spots: ParkingSpot[]
- displayBoard: DisplayBoard

Methods:
- getAvailableSpotsByType(vehicleType: VehicleType): number
- findAvailableSpots(filter: SpotFilter): ParkingSpot[]
- addSpot(spot: ParkingSpot): void
- removeSpot(spotId: string): void

---

### Gate (abstract)
- id: string
- name: string
- gateNumber: number
- floorId: string

Methods:
- getGateInfo(): string

### EntryGate extends Gate
Methods:
- processVehicleEntry(vehicle: Vehicle, expectedDurationHours: number): Ticket

### ExitGate extends Gate
Methods:
- processVehicleExit(ticketId: string): Payment

---

### ParkingSpot
- id: string
- spotNumber: string
- floorId: string
- type: SpotType
- state: SpotState
- accessibilityLevel: AccessibilityLevel
- distanceScore: number
- currentVehicleId: string | null
- currentTicketId: string | null

Methods:
- assignVehicle(vehicleId: string, ticketId: string): void
- releaseSpot(): void
- isAvailable(): boolean
- markOutOfService(): void
- markAvailable(): void

---

### Vehicle (abstract)
- id: string
- licensePlate: string
- type: VehicleType
- color: string

Methods:
- getVehicleInfo(): string

### Car extends Vehicle
### Bike extends Vehicle
### Truck extends Vehicle
### Van extends Vehicle

---

### Ticket
- id: string
- ticketNumber: string
- vehicleId: string
- spotId: string
- entryGateId: string
- exitGateId: string | null
- entryTime: Date
- exitTime: Date | null
- expectedDurationHours: number
- actualDurationHours: number | null
- status: TicketStatus

Methods:
- closeTicket(exitTime: Date): void
- calculateActualDuration(): number
- isOverstayed(thresholdPercentage: number): boolean

---

### Payment
- id: string
- ticketId: string
- amount: number
- baseAmount: number
- overstayPenalty: number
- discounts: number
- status: PaymentStatus
- method: PaymentMethod
- createdAt: Date

Methods:
- markPaid(method: PaymentMethod): void
- markFailed(): void

---

### DisplayBoard (Observer)
- id: string
- floorId: string
- availableSpotsByType: Map<VehicleType, number>
- lastUpdatedAt: Date

Methods:
- updateAvailability(floor: Floor): void
- showDisplay(): void

---

### Reservation
- id: string
- vehicleId: string
- spotId: string
- reservedFrom: Date
- reservedTo: Date
- status: ReservationStatus

Methods:
- activate(): void
- cancel(): void
- isActive(now: Date): boolean

---

### AdminUser
- id: string
- name: string
- email: string
- role: AdminRole

Methods:
- addSpot(floor: Floor, spot: ParkingSpot): void
- removeSpot(floor: Floor, spotId: string): void
- configurePricing(strategy: IPricingStrategy): void
- configureAllocation(strategy: IAllocationStrategy): void

---

## Strategy Interfaces

### IAllocationStrategy
Methods:
- allocateSpot(
    vehicle: Vehicle,
    expectedDurationHours: number,
    floors: Floor[]
  ): ParkingSpot | null
- getName(): string

### IPricingStrategy
Methods:
- calculateFee(ticket: Ticket): PricingBreakdown
- getName(): string

---

## Concrete Allocation Strategies

### NearestSpotStrategy implements IAllocationStrategy
- name: string

Methods:
- allocateSpot(vehicle, expectedDurationHours, floors): ParkingSpot | null
- getName(): string

### DurationAwareStrategy implements IAllocationStrategy
- name: string

Methods:
- allocateSpot(vehicle, expectedDurationHours, floors): ParkingSpot | null
  - Uses duration buckets: SHORT, MEDIUM, LONG
  - Uses accessibilityLevel (HIGH, MEDIUM, LOW)
- getName(): string

---

## Concrete Pricing Strategies

### HourlyPricingStrategy implements IPricingStrategy
- baseRatePerHourByVehicleType: Map<VehicleType, number>
- overstayPenaltyRate: number

Methods:
- calculateFee(ticket: Ticket): PricingBreakdown
- getName(): string

### FlatRatePricingStrategy implements IPricingStrategy
- flatRateByVehicleType: Map<VehicleType, number>

Methods:
- calculateFee(ticket: Ticket): PricingBreakdown
- getName(): string

### DynamicPricingStrategy implements IPricingStrategy
- baseRatePerHourByVehicleType: Map<VehicleType, number>
- peakHourMultiplier: number
- weekendMultiplier: number

Methods:
- calculateFee(ticket: Ticket): PricingBreakdown
- getName(): string

---

## Supporting Value Objects & Types

### PricingBreakdown
- baseAmount: number
- overstayPenalty: number
- discounts: number
- totalAmount: number

### AvailabilitySummary
- totalSpots: number
- occupiedSpots: number
- availableSpots: number
- availableByVehicleType: Map<VehicleType, number>

### SpotFilter
- vehicleType: VehicleType
- accessibilityLevel?: AccessibilityLevel
- spotState?: SpotState

---

## Enums

### VehicleType
- CAR
- BIKE
- TRUCK
- VAN

### SpotType
- COMPACT
- STANDARD
- LARGE
- HANDICAPPED

### SpotState
- AVAILABLE
- RESERVED
- OCCUPIED
- OUT_OF_SERVICE

### AccessibilityLevel
- HIGH
- MEDIUM
- LOW

### TicketStatus
- OPEN
- CLOSED
- LOST

### PaymentStatus
- PENDING
- PAID
- FAILED

### PaymentMethod
- CASH
- CARD
- WALLET

### ReservationStatus
- ACTIVE
- CANCELLED
- COMPLETED

### AdminRole
- SUPER_ADMIN
- LOT_MANAGER

---

## Design Patterns Applied

1. Singleton
   - ParkingLot
   - InMemoryDatabase (in implementation phase)

2. Factory
   - VehicleFactory
   - SpotFactory

3. Strategy
   - IAllocationStrategy with NearestSpotStrategy, DurationAwareStrategy
   - IPricingStrategy with HourlyPricingStrategy, FlatRatePricingStrategy, DynamicPricingStrategy

4. State
   - ParkingSpot with SpotState (AVAILABLE, RESERVED, OCCUPIED, OUT_OF_SERVICE)

5. Observer
   - DisplayBoard observing Floor/ParkingLot for availability updates

---

## Relationships

- ParkingLot (1) → (M) Floor
- ParkingLot (1) → (M) EntryGate
- ParkingLot (1) → (M) ExitGate
- Floor (1) → (M) ParkingSpot
- Floor (1) → (1) DisplayBoard
- ParkingSpot (1) → (0..1) Vehicle (via currentVehicleId)
- Vehicle (1) → (M) Ticket
- Ticket (1) → (1) ParkingSpot
- Ticket (1) → (0..1) Payment
- Reservation (1) → (1) ParkingSpot
- Reservation (1) → (1) Vehicle
- ParkingLot (1) → (1) IPricingStrategy (Strategy)
- ParkingLot (1) → (1) IAllocationStrategy (Strategy)

---

## Mapping to Requirements

- Duration-aware spot allocation → DurationAwareStrategy + ParkingSpot.accessibilityLevel + ParkingLot.allocationStrategy
- Real-time availability display → DisplayBoard + Observer pattern from Floor
- Fee calculation with overstay penalty → Ticket + Payment + HourlyPricingStrategy / DynamicPricingStrategy
- Multi-floor structure and gates → ParkingLot, Floor, EntryGate, ExitGate
- Reservations and admin operations → Reservation, AdminUser, strategies configuration
