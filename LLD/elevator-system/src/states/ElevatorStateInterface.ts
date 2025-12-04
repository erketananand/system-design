import { Elevator } from '../models/Elevator';
import { Direction } from '../enums/Direction';

/**
 * State Pattern Interface for Elevator States
 * This interface defines the contract for all elevator state implementations
 */
export interface IElevatorState {
  /**
   * Handle a request to move to a specific floor
   * @param elevator - The elevator instance
   * @param floor - The target floor number
   */
  handleRequest(elevator: Elevator, floor: number): void;

  /**
   * Execute the movement logic based on current state
   * @param elevator - The elevator instance
   */
  move(elevator: Elevator): void;

  /**
   * Get the direction associated with this state
   * @returns The direction (UP, DOWN, or IDLE)
   */
  getDirection(): Direction;

  /**
   * Get the name of the current state
   * @returns String representation of the state
   */
  getStateName(): string;
}
