# Elevator System - Class Diagram

## Core Classes

### Building
- buildingId: string
- totalFloors: number
- elevators: Elevator[]
- floorPanels: FloorPanel[]
- Methods:
  - addElevator(elevator: Elevator): void
  - getElevator(elevatorId: string): Elevator
  - getAllElevators(): Elevator[]

### Elevator
- elevatorId: string
- currentFloor: number
- currentState: ElevatorState
- direction: Direction (UP, DOWN, IDLE)
- capacity: number
- currentLoad: number
- internalPanel: InternalPanel
- destinationQueue: number[]
- doorStatus: DoorStatus (OPEN, CLOSED)
- Methods:
  - moveUp(): void
  - moveDown(): void
  - stop(): void
  - openDoor(): void
  - closeDoor(): void
  - addDestination(floor: number): void
  - processNextDestination(): void
  - setState(state: ElevatorState): void
  - isOverloaded(): boolean

### ElevatorState (interface)
- Methods:
  - handleRequest(elevator: Elevator, floor: number): void
  - move(elevator: Elevator): void
  - getDirection(): Direction

### MovingUpState / MovingDownState / IdleState
- Implement ElevatorState with state-specific behavior

### ElevatorController
- building: Building
- schedulingStrategy: ISchedulingStrategy
- externalRequestQueue: ExternalRequest[]
- Methods:
  - handleExternalRequest(request: ExternalRequest): void
  - handleInternalRequest(request: InternalRequest): void
  - assignElevator(request: ExternalRequest): Elevator
  - setSchedulingStrategy(strategy: ISchedulingStrategy): void
  - notifyElevatorArrival(elevatorId: string, floor: number): void

### ISchedulingStrategy (interface)
- Methods:
  - selectElevator(elevators: Elevator[], request: ExternalRequest): Elevator

### NearestElevatorStrategy
- Implements ISchedulingStrategy to choose closest suitable elevator

### FloorPanel (Hall Panel)
- floorNumber: number
- upButton: Button
- downButton: Button
- display: Display
- Methods:
  - pressUpButton(): void
  - pressDownButton(): void
  - updateDisplay(info: DisplayInfo): void

### InternalPanel (Cabin Panel)
- elevatorId: string
- floorButtons: Button[]
- emergencyButton: Button
- display: Display
- Methods:
  - selectFloor(floor: number): void
  - pressEmergencyStop(): void
  - updateDisplay(info: DisplayInfo): void

### Button
- buttonId: string
- isPressed: boolean
- buttonType: ButtonType (UP, DOWN, FLOOR, EMERGENCY)
- Methods:
  - press(): void
  - reset(): void

### Display
- currentFloor: number
- direction: Direction
- Methods:
  - update(floor: number, direction: Direction): void
  - show(): string

### Request (abstract)
- requestId: string
- timestamp: Date
- status: RequestStatus (PENDING, ASSIGNED, COMPLETED)

### ExternalRequest extends Request
- sourceFloor: number
- direction: Direction

### InternalRequest extends Request
- elevatorId: string
- destinationFloor: number

