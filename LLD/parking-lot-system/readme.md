# Parking Lot System - LLD Implementation

## Overview
A comprehensive parking lot management system with duration-aware spot allocation, multi-floor support, and dynamic pricing strategies.

## Quick Start
```bash
npm install
npm start
```

## Features
- **Duration-Aware Allocation**: Assigns spots based on vehicle type and expected parking duration
- **Multi-Floor Support**: Manage multiple floors with independent spot management
- **Dynamic Pricing**: Flexible pricing strategies (Hourly, Flat, Dynamic)
- **Real-Time Display**: Observer pattern for live availability updates
- **Overstay Penalty**: Automatic penalty calculation for exceeding expected duration
- **Reservation System**: Pre-book parking spots for specific time slots
- **Admin Management**: Configure spots, pricing, and allocation strategies

## Architecture
```
Models → Repositories → Services → Controllers → Console Interface
```

### Layers:
- **Enums**: Type-safe constants (VehicleType, SpotState, PaymentStatus, etc.)
- **Utils**: Helper utilities (IdGenerator, Logger)
- **Models**: Domain entities (Vehicle, ParkingSpot, Ticket, Payment, etc.)
- **Strategies**: Allocation (Nearest, Duration-Aware) and Pricing (Hourly, Flat, Dynamic)
- **Factories**: Vehicle and Spot factories
- **Database**: In-memory storage using Singleton pattern
- **Repositories**: Data access abstraction layer
- **Services**: Business logic orchestration
- **Console**: Interactive CLI interface

## Design Patterns
1. **Singleton**: ParkingLot, InMemoryDatabase
2. **Factory**: VehicleFactory, SpotFactory
3. **Strategy**: IAllocationStrategy, IPricingStrategy
4. **State**: ParkingSpot state transitions
5. **Observer**: DisplayBoard updates

## Technology Stack
- **Language**: TypeScript (Node.js)
- **Storage**: In-memory (Maps)
- **Interface**: Console-based with readline

## Duration-Aware Allocation
- **Short (<2h)**: HIGH accessibility spots near gates
- **Medium (2-6h)**: MEDIUM accessibility spots
- **Long (>6h)**: LOW accessibility spots in back areas

## Usage Example
```typescript
// Entry
const ticket = parkingLot.parkVehicle(vehicle, expectedDurationHours, entryGateId);

// Exit
const payment = parkingLot.unparkVehicle(ticketId, exitGateId);
```

## Project Structure
```
src/
├── enums/           # Type-safe enumerations
├── utils/           # Helper utilities
├── models/          # Domain entities
├── strategies/      # Allocation & Pricing strategies
├── factories/       # Object creation
├── database/        # In-memory storage
├── repositories/    # Data access layer
├── services/        # Business logic
└── console/         # CLI interface
```

## License
MIT
