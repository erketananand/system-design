import { Direction } from '../enums/Direction';
import { ElevatorState } from '../enums/ElevatorState';
import { DoorStatus } from '../enums/DoorStatus';
import { IdGenerator } from '../utils/IdGenerator';
import { IElevatorState } from '../states/ElevatorStateInterface';

/**
 * Elevator Entity
 * Represents an elevator car with state management and destination queue
 */
export class Elevator {
  public readonly id: string;
  public buildingId: string;
  public elevatorCode: string;
  public capacity: number;
  public currentFloor: number;
  public direction: Direction;
  public state: ElevatorState;
  public doorStatus: DoorStatus;
  public currentLoad: number;
  public destinationQueue: number[];
  public currentStateObject: IElevatorState | null = null;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(buildingId: string, elevatorCode: string, capacity: number, id?: string) {
    this.id = id || IdGenerator.generateUUID();
    this.buildingId = buildingId;
    this.elevatorCode = elevatorCode;
    this.capacity = capacity;
    this.currentFloor = 0; // Start at ground floor
    this.direction = Direction.IDLE;
    this.state = ElevatorState.IDLE;
    this.doorStatus = DoorStatus.CLOSED;
    this.currentLoad = 0;
    this.destinationQueue = [];
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Set the state object for State Pattern
   */
  public setStateObject(stateObj: IElevatorState): void {
    this.currentStateObject = stateObj;
    this.update();
  }

  /**
   * Move elevator up by one floor
   */
  public moveUp(): void {
    this.currentFloor++;
    this.direction = Direction.UP;
    this.state = ElevatorState.MOVING_UP;
    this.update();
  }

  /**
   * Move elevator down by one floor
   */
  public moveDown(): void {
    this.currentFloor--;
    this.direction = Direction.DOWN;
    this.state = ElevatorState.MOVING_DOWN;
    this.update();
  }

  /**
   * Stop the elevator
   */
  public stop(): void {
    this.direction = Direction.IDLE;
    this.state = ElevatorState.IDLE;
    this.update();
  }

  /**
   * Open elevator doors (only when idle)
   */
  public openDoor(): void {
    if (this.state === ElevatorState.IDLE) {
      this.doorStatus = DoorStatus.OPEN;
      this.update();
    }
  }

  /**
   * Close elevator doors
   */
  public closeDoor(): void {
    this.doorStatus = DoorStatus.CLOSED;
    this.update();
  }

  /**
   * Add a destination floor to the queue
   * Automatically sorts queue based on current direction
   */
  public addDestination(floor: number): void {
    if (!this.destinationQueue.includes(floor) && floor !== this.currentFloor) {
      this.destinationQueue.push(floor);
      this.sortQueue();
      this.update();
    }
  }

  /**
   * Remove a destination from the queue
   */
  public removeDestination(floor: number): void {
    const idx = this.destinationQueue.indexOf(floor);
    if (idx > -1) {
      this.destinationQueue.splice(idx, 1);
      this.update();
    }
  }

  /**
   * Get the next destination in the queue
   */
  public getNextDestination(): number | null {
    return this.destinationQueue.length > 0 ? this.destinationQueue[0] : null;
  }

  /**
   * Check if elevator is at or over capacity
   */
  public isOverloaded(): boolean {
    return this.currentLoad >= this.capacity;
  }

  /**
   * Add passenger load
   */
  public addLoad(load: number = 1): void {
    this.currentLoad += load;
    this.update();
  }

  /**
   * Remove passenger load
   */
  public removeLoad(load: number = 1): void {
    this.currentLoad = Math.max(0, this.currentLoad - load);
    this.update();
  }

  /**
   * Sort destination queue based on current direction
   * Implements SCAN-like algorithm
   */
  private sortQueue(): void {
    if (this.direction === Direction.UP) {
      // Sort ascending for upward movement
      this.destinationQueue.sort((a, b) => {
        const aAbove = a > this.currentFloor;
        const bAbove = b > this.currentFloor;

        if (aAbove && bAbove) return a - b;
        if (aAbove) return -1;
        if (bAbove) return 1;
        return b - a;
      });
    } else if (this.direction === Direction.DOWN) {
      // Sort descending for downward movement
      this.destinationQueue.sort((a, b) => {
        const aBelow = a < this.currentFloor;
        const bBelow = b < this.currentFloor;

        if (aBelow && bBelow) return b - a;
        if (aBelow) return -1;
        if (bBelow) return 1;
        return a - b;
      });
    } else {
      // IDLE: sort by distance from current floor
      this.destinationQueue.sort((a, b) => 
        Math.abs(a - this.currentFloor) - Math.abs(b - this.currentFloor)
      );
    }
  }

  public update(): void {
    this.updatedAt = new Date();
  }
}
