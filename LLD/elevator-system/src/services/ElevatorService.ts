import { Elevator } from '../models/Elevator';
import { ElevatorRepository } from '../repositories/ElevatorRepository';
import { Direction } from '../enums/Direction';
import { ElevatorState } from '../enums/ElevatorState';
import { Logger } from '../utils/Logger';
import { IdleState } from '../states/IdleState';
import { MovingUpState } from '../states/MovingUpState';
import { MovingDownState } from '../states/MovingDownState';

/**
 * Elevator Service
 * Handles business logic for elevator operations
 */
export class ElevatorService {
  private elevatorRepo = new ElevatorRepository();

  /**
   * Get elevator by ID
   */
  public getElevator(elevatorId: string): Elevator | undefined {
    return this.elevatorRepo.findById(elevatorId);
  }

  /**
   * Get all elevators in a building
   */
  public getElevatorsByBuilding(buildingId: string): Elevator[] {
    return this.elevatorRepo.findByBuildingId(buildingId);
  }

  /**
   * Move elevator (simulate one step of movement)
   */
  public moveElevator(elevatorId: string): void {
    const elevator = this.elevatorRepo.findById(elevatorId);
    if (!elevator) {
      Logger.error(`Elevator ${elevatorId} not found`);
      return;
    }

    if (!elevator.currentStateObject) {
      Logger.warn(`Elevator ${elevator.elevatorCode} has no state object, initializing to Idle`);
      elevator.setStateObject(new IdleState());
    }

    // Execute state behavior
    elevator.currentStateObject!.move(elevator);

    // Save updated elevator
    this.elevatorRepo.save(elevator);
  }

  /**
   * Add destination to elevator
   */
  public addDestination(elevatorId: string, floor: number): boolean {
    const elevator = this.elevatorRepo.findById(elevatorId);
    if (!elevator) {
      Logger.error(`Elevator ${elevatorId} not found`);
      return false;
    }

    if (elevator.isOverloaded()) {
      Logger.warn(`Elevator ${elevator.elevatorCode} is overloaded, cannot accept new requests`);
      return false;
    }

    if (!elevator.currentStateObject) {
      elevator.setStateObject(new IdleState());
    }

    elevator.currentStateObject!.handleRequest(elevator, floor);
    this.elevatorRepo.save(elevator);

    return true;
  }

  /**
   * Set elevator to maintenance mode
   */
  public setMaintenanceMode(elevatorId: string, maintenance: boolean): void {
    const elevator = this.elevatorRepo.findById(elevatorId);
    if (!elevator) {
      Logger.error(`Elevator ${elevatorId} not found`);
      return;
    }

    if (maintenance) {
      elevator.state = ElevatorState.MAINTENANCE;
      elevator.direction = Direction.IDLE;
      Logger.warn(`Elevator ${elevator.elevatorCode} set to MAINTENANCE mode`);
    } else {
      elevator.state = ElevatorState.IDLE;
      elevator.setStateObject(new IdleState());
      Logger.success(`Elevator ${elevator.elevatorCode} back in service`);
    }

    this.elevatorRepo.save(elevator);
  }

  /**
   * Get elevator status summary
   */
  public getElevatorStatus(elevatorId: string): string {
    const elevator = this.elevatorRepo.findById(elevatorId);
    if (!elevator) {
      return 'Elevator not found';
    }

    const queueStr = elevator.destinationQueue.length > 0 
      ? elevator.destinationQueue.join(', ') 
      : 'None';

    return `
Elevator: ${elevator.elevatorCode}
Current Floor: ${elevator.currentFloor}
State: ${elevator.state}
Direction: ${elevator.direction}
Door: ${elevator.doorStatus}
Load: ${elevator.currentLoad}/${elevator.capacity}
Destination Queue: [${queueStr}]
`;
  }

  /**
   * Get status of all elevators in a building
   */
  public getAllElevatorStatus(buildingId: string): string {
    const elevators = this.elevatorRepo.findByBuildingId(buildingId);

    if (elevators.length === 0) {
      return 'No elevators found in this building';
    }

    let status = '\n========== ELEVATOR STATUS ==========\n';

    elevators.forEach(elevator => {
      const queue = elevator.destinationQueue.length > 0 
        ? `[${elevator.destinationQueue.join(', ')}]` 
        : '[]';

      status += `\n${elevator.elevatorCode}: Floor ${elevator.currentFloor} | ${elevator.state} | ${elevator.direction} | Queue: ${queue}`;
    });

    status += '\n=====================================\n';

    return status;
  }
}
