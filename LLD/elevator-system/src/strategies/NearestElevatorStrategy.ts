import { ISchedulingStrategy } from './ISchedulingStrategy';
import { Elevator } from '../models/Elevator';
import { ExternalRequest } from '../models/Request';
import { Direction } from '../enums/Direction';
import { ElevatorState } from '../enums/ElevatorState';
import { Logger } from '../utils/Logger';

/**
 * Nearest Elevator Strategy
 * Selects the elevator that is closest to the requested floor and can serve it efficiently
 * 
 * Selection Criteria (in priority order):
 * 1. Idle elevators closest to the request
 * 2. Moving elevators heading in the same direction and will pass the floor
 * 3. Fallback to any available elevator
 */
export class NearestElevatorStrategy implements ISchedulingStrategy {

  public selectElevator(elevators: Elevator[], request: ExternalRequest): Elevator | null {
    if (!elevators || elevators.length === 0) {
      Logger.error('No elevators available in the building');
      return null;
    }

    // Filter out elevators in maintenance mode
    const availableElevators = elevators.filter(
      e => e.state !== ElevatorState.MAINTENANCE
    );

    if (availableElevators.length === 0) {
      Logger.warn('All elevators are in maintenance mode');
      return null;
    }

    Logger.info(`Selecting elevator for request: Floor ${request.sourceFloor}, Direction: ${request.direction}`);

    // Priority 1: Find idle elevators
    const idleElevators = availableElevators.filter(e => e.state === ElevatorState.IDLE);
    if (idleElevators.length > 0) {
      const nearest = this.findNearestElevator(idleElevators, request.sourceFloor);
      Logger.success(`Selected IDLE elevator ${nearest.elevatorCode} at floor ${nearest.currentFloor}`);
      return nearest;
    }

    // Priority 2: Find moving elevators heading toward the request in the same direction
    const suitableMovingElevators = availableElevators.filter(e => 
      this.isElevatorSuitable(e, request)
    );

    if (suitableMovingElevators.length > 0) {
      const nearest = this.findNearestElevator(suitableMovingElevators, request.sourceFloor);
      Logger.success(`Selected MOVING elevator ${nearest.elevatorCode} (${nearest.direction}) at floor ${nearest.currentFloor}`);
      return nearest;
    }

    // Priority 3: Fallback - select nearest available elevator regardless of state
    const nearest = this.findNearestElevator(availableElevators, request.sourceFloor);
    Logger.info(`Selected FALLBACK elevator ${nearest.elevatorCode} at floor ${nearest.currentFloor}`);
    return nearest;
  }

  /**
   * Check if a moving elevator is suitable for the request
   * An elevator is suitable if it's moving toward the request floor in the same direction
   */
  private isElevatorSuitable(elevator: Elevator, request: ExternalRequest): boolean {
    const { currentFloor, direction } = elevator;
    const { sourceFloor, direction: requestDirection } = request;

    // Elevator must be moving in the same direction as the request
    if (direction !== requestDirection) {
      return false;
    }

    // Check if elevator is heading toward the request floor
    if (direction === Direction.UP) {
      // Elevator going up, request is up, and request floor is above current floor
      return currentFloor <= sourceFloor;
    } else if (direction === Direction.DOWN) {
      // Elevator going down, request is down, and request floor is below current floor
      return currentFloor >= sourceFloor;
    }

    return false;
  }

  /**
   * Find the elevator nearest to the target floor
   */
  private findNearestElevator(elevators: Elevator[], targetFloor: number): Elevator {
    return elevators.reduce((nearest, current) => {
      const nearestDistance = Math.abs(nearest.currentFloor - targetFloor);
      const currentDistance = Math.abs(current.currentFloor - targetFloor);

      if (currentDistance < nearestDistance) {
        return current;
      } else if (currentDistance === nearestDistance) {
        // If distances are equal, prefer elevator with fewer pending requests
        return current.destinationQueue.length < nearest.destinationQueue.length 
          ? current 
          : nearest;
      }

      return nearest;
    });
  }

  /**
   * Calculate estimated time for an elevator to reach a floor
   * This can be used for more sophisticated scheduling
   */
  private calculateEstimatedTime(elevator: Elevator, targetFloor: number): number {
    const baseTime = Math.abs(elevator.currentFloor - targetFloor);
    const queuePenalty = elevator.destinationQueue.length * 2; // Each stop adds delay
    return baseTime + queuePenalty;
  }

  public getStrategyName(): string {
    return 'Nearest Elevator Strategy';
  }

  public getDescription(): string {
    return 'Selects the closest elevator to the request, prioritizing idle elevators ' +
           'and moving elevators heading in the same direction. Optimizes for minimal wait time.';
  }
}
