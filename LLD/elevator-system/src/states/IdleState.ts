import { IElevatorState } from './ElevatorStateInterface';
import { Elevator } from '../models/Elevator';
import { Direction } from '../enums/Direction';
import { ElevatorState } from '../enums/ElevatorState';
import { Logger } from '../utils/Logger';

/**
 * Idle State - Elevator is stationary and waiting for requests
 * This is the default state when elevator has no pending destinations
 */
export class IdleState implements IElevatorState {

  public handleRequest(elevator: Elevator, floor: number): void {
    if (floor === elevator.currentFloor) {
      Logger.info(`Elevator ${elevator.elevatorCode} is already at floor ${floor}`);
      return;
    }

    // Add destination to queue
    elevator.addDestination(floor);

    // Determine direction and transition to appropriate moving state
    if (floor > elevator.currentFloor) {
      Logger.info(`Elevator ${elevator.elevatorCode} changing from IDLE to MOVING_UP`);
      const movingUpState = require('./MovingUpState').MovingUpState;
      elevator.setStateObject(new movingUpState());
      elevator.direction = Direction.UP;
      elevator.state = ElevatorState.MOVING_UP;
    } else {
      Logger.info(`Elevator ${elevator.elevatorCode} changing from IDLE to MOVING_DOWN`);
      const movingDownState = require('./MovingDownState').MovingDownState;
      elevator.setStateObject(new movingDownState());
      elevator.direction = Direction.DOWN;
      elevator.state = ElevatorState.MOVING_DOWN;
    }
  }

  public move(elevator: Elevator): void {
    // In idle state, elevator doesn't move
    // Check if there are any pending destinations
    const nextDestination = elevator.getNextDestination();

    if (nextDestination !== null) {
      // If there's a destination, handle it to transition to moving state
      this.handleRequest(elevator, nextDestination);
    } else {
      // No destinations, remain idle
      elevator.stop();
      Logger.info(`Elevator ${elevator.elevatorCode} is IDLE at floor ${elevator.currentFloor}`);
    }
  }

  public getDirection(): Direction {
    return Direction.IDLE;
  }

  public getStateName(): string {
    return 'IDLE';
  }
}
