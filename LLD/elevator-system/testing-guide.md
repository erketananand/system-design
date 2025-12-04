# ELEVATOR SYSTEM - TESTING GUIDE

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Project
```bash
npm run build
```

### 3. Run the Application
```bash
npm start
```

## Project Structure

```
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

## Usage Examples

### Creating a Building
1. Select "Create New Building"
2. Enter building name (e.g., "Tech Tower")
3. Enter number of floors (e.g., 10)
4. Enter number of elevators (e.g., 3)
5. Enter elevator capacity (e.g., 8 passengers)

### Making Requests

**External Request (Hall Call):**
- Someone on floor 5 presses UP button
- System automatically assigns nearest suitable elevator

**Internal Request (Cabin Call):**
- Passenger inside elevator selects floor 8
- Destination added to elevator queue

### Simulation
- Manual: Move elevators one step at a time
- Auto: Run continuous simulation with configurable delay

## Design Patterns

1. **State Pattern** - Elevator behavior (Idle, Moving Up, Moving Down)
2. **Strategy Pattern** - Scheduling algorithms (Nearest Elevator)
3. **Singleton Pattern** - ElevatorController and InMemoryDatabase
4. **Repository Pattern** - Data access abstraction
5. **Factory Pattern** - Request creation

## Key Features

✓ Multiple elevator management
✓ Smart scheduling (Nearest Elevator strategy)
✓ Direction-based optimization (SCAN-like)
✓ Capacity management
✓ Maintenance mode
✓ Real-time status tracking
✓ In-memory database (replaceable)

## Extending the System

### Adding New Scheduling Strategy
```typescript
export class MyStrategy implements ISchedulingStrategy {
  selectElevator(elevators: Elevator[], request: ExternalRequest): Elevator | null {
    // Your algorithm here
  }

  getStrategyName(): string {
    return 'My Strategy';
  }

  getDescription(): string {
    return 'Description of your algorithm';
  }
}
```

### Replacing with Real Database
1. Keep repository interfaces unchanged
2. Replace InMemoryDatabase with DB connection
3. Update repository implementations to use SQL/ORM
4. No changes needed in services or controllers!

## Testing

Create test scenarios:
- Single elevator, multiple floors
- Multiple elevators, concurrent requests
- Peak hour simulation
- Maintenance mode handling

## Troubleshooting

**Error: Cannot find module**
- Run `npm install` to install dependencies
- Make sure TypeScript is compiled: `npm run build`

**Elevators not moving**
- Use "Simulate One Step" to move elevators
- Or run "Auto Simulation" for automatic movement

## Support

For questions or issues, refer to:
- docs/elevator-requirements.md - Requirements
- docs/elevator-class-diagram.md - Class design
- docs/elevator-schema.md - Database schema
- docs/strategy-pattern-summary.md - Strategy details
