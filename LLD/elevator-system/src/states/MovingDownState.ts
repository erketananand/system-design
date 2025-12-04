import { IElevatorState } from './ElevatorStateInterface';
import { Elevator } from '../models/Elevator';
import { Direction } from '../enums/Direction';
import { ElevatorState } from '../enums/ElevatorState';
import { DoorStatus } from '../enums/DoorStatus';
import { Logger } from '../utils/Logger';

/**
 * Moving Down State - Elevator is moving downward
 * Implements SCAN-like algorithm: serves all downward requests before changing direction
 */
export class MovingDownState implements IElevatorState {

  public handleRequest(elevator: Elevator, floor: number): void {
    // Add floor to destination queue
    // The queue will be automatically sorted by Elevator.addDestination()
    elevator.addDestination(floor);
    Logger.info(`Elevator ${elevator.elevatorCode} added floor ${floor} to queue while moving DOWN`);
  }

  public move(elevator: Elevator): void {
    const nextDestination = elevator.getNextDestination();

    if (nextDestination === null) {
      // No more destinations, transition to IDLE
      Logger.info(`Elevator ${elevator.elevatorCode} completed all downward requests, transitioning to IDLE`);
      this.transitionToIdle(elevator);
      return;
    }

    // Check if we've reached the next destination
    if (elevator.currentFloor === nextDestination) {
      this.arriveAtFloor(elevator, nextDestination);
      return;
    }

    // Continue moving down
    if (nextDestination < elevator.currentFloor) {
      elevator.moveDown();
      Logger.info(`Elevator ${elevator.elevatorCode} moving DOWN: Floor ${elevator.currentFloor + 1} -> ${elevator.currentFloor}`);

      // Check if current floor is in destination queue (intermediate stop)
      if (elevator.destinationQueue.includes(elevator.currentFloor)) {
        this.arriveAtFloor(elevator, elevator.currentFloor);
      }
    } else {
      // Next destination is above current floor, need to change direction
      Logger.info(`Elevator ${elevator.elevatorCode} changing direction from DOWN to UP`);
      const movingUpState = require('./MovingUpState').MovingUpState;
      elevator.setStateObject(new movingUpState());
      elevator.direction = Direction.UP;
      elevator.state = ElevatorState.MOVING_UP;
    }
  }

  private arriveAtFloor(elevator: Elevator, floor: number): void {
    // Stop at floor
    elevator.stop();
    Logger.success(`Elevator ${elevator.elevatorCode} arrived at floor ${floor}`);

    // Open doors
    elevator.openDoor();
    Logger.info(`Elevator ${elevator.elevatorCode} doors OPEN at floor ${floor}`);

    // Remove floor from destination queue
    elevator.removeDestination(floor);

    // Simulate door open time (in real system, this would be async)
    // For simulation purposes, we'll immediately close doors
    setTimeout(() => {
      elevator.closeDoor();
      Logger.info(`Elevator ${elevator.elevatorCode} doors CLOSED at floor ${floor}`);

      // Check for next destination
      const next = elevator.getNextDestination();
      if (next !== null) {
        // Continue in appropriate direction
        if (next < elevator.currentFloor) {
          elevator.direction = Direction.DOWN;
          elevator.state = ElevatorState.MOVING_DOWN;
        } else {
          const movingUpState = require('./MovingUpState').MovingUpState;
          elevator.setStateObject(new movingUpState());
          elevator.direction = Direction.UP;
          elevator.state = ElevatorState.MOVING_UP;
        }
      } else {
        this.transitionToIdle(elevator);
      }
    }, 0);
  }

  private transitionToIdle(elevator: Elevator): void {
    const idleState = require('./IdleState').IdleState;
    elevator.setStateObject(new idleState());
    elevator.stop();
    Logger.info(`Elevator ${elevator.elevatorCode} is now IDLE at floor ${elevator.currentFloor}`);
  }

  public getDirection(): Direction {
    return Direction.DOWN;
  }

  public getStateName(): string {
    return 'MOVING_DOWN';
  }
}
