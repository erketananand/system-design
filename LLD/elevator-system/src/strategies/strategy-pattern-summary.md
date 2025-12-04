# Strategy Pattern Implementation - Summary

## Files Created
1. ISchedulingStrategy.ts - Interface for scheduling algorithms
2. NearestElevatorStrategy.ts - Nearest elevator selection implementation

## NearestElevatorStrategy Algorithm

### Selection Logic Flow:
```
1. Filter out maintenance elevators
2. Priority 1: Select nearest IDLE elevator
3. Priority 2: Select suitable MOVING elevator (same direction, heading toward request)
4. Priority 3: Fallback to nearest available elevator
```

### Suitability Criteria for Moving Elevators:
- **Direction Match**: Elevator direction must match request direction
- **UP Requests**: Elevator must be at or below request floor
- **DOWN Requests**: Elevator must be at or above request floor

### Distance Calculation:
- Uses Manhattan distance: |elevator_floor - request_floor|
- Tie-breaker: Prefers elevator with fewer pending destinations

## Future Strategy Extensions

You can easily add new strategies by implementing ISchedulingStrategy:

### SCAN Strategy (Future)
```typescript
export class SCANStrategy implements ISchedulingStrategy {
  // Elevator serves all requests in one direction before reversing
  // Like a disk scheduling algorithm
}
```

### LOOK Strategy (Future)
```typescript
export class LOOKStrategy implements ISchedulingStrategy {
  // Similar to SCAN but reverses at last request, not at building ends
}
```

### FCFS Strategy (Future)
```typescript
export class FCFSStrategy implements ISchedulingStrategy {
  // First Come First Served - simplest but least efficient
}
```

## Usage Example:
```typescript
const strategy = new NearestElevatorStrategy();
const elevators = buildingRepository.getElevators(buildingId);
const selectedElevator = strategy.selectElevator(elevators, externalRequest);
```
