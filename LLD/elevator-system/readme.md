# Elevator System - Low Level Design

A complete implementation of an Elevator Control System using TypeScript with Object-Oriented Design principles and Design Patterns.

## Features

- Multiple elevator management in a building
- External requests (hall calls) with shared UP/DOWN buttons
- Internal requests (cabin calls) for destination selection
- Intelligent elevator scheduling (Nearest Elevator strategy)
- State pattern for elevator states (Idle, Moving Up, Moving Down)
- Strategy pattern for pluggable scheduling algorithms
- Capacity management with overload prevention
- Door control with safety checks
- Console-based interactive interface

## Design Patterns Used

1. **State Pattern** - Elevator movement states
2. **Strategy Pattern** - Scheduling algorithms
3. **Singleton Pattern** - ElevatorController
4. **Repository Pattern** - Data access layer
5. **Factory Pattern** - Request creation

## Installation

```bash
npm install
```

## Running the Application

```bash
npm start
```

Or for development:

```bash
npm run dev
```

## Architecture

- **Models**: Domain entities (Building, Elevator, Floor, etc.)
- **Enums**: Type-safe enumerations
- **States**: State pattern implementation for elevator behavior
- **Strategies**: Strategy pattern for scheduling algorithms
- **Repositories**: Data access layer (in-memory)
- **Services**: Business logic layer
- **Database**: In-memory data store
- **Utils**: Helper utilities
- **Console**: Interactive command-line interface

```
Project Structure:
elevator-system/  
├── src/  
│   ├── enums/          # Type-safe enumerations  
│   ├── utils/          # Helper utilities  
│   ├── models/         # Domain entities  
│   ├── states/         # State Pattern implementation  
│   ├── strategies/     # Strategy Pattern implementation  
│   ├── repositories/   # Data access layer  
│   ├── services/       # Business logic layer  
│   ├── database/       # In-memory storage  
│   └── console/        # Interactive CLI  
├── docs/               # Documentation  
├── package.json  
├── tsconfig.json  
└── README.md  
```

## Database

Currently uses an in-memory database. Can be replaced with a real database by modifying the repository implementations.
