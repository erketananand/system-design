import { Elevator } from '../models/Elevator';
import { ExternalRequest } from '../models/Request';

/**
 * Strategy Pattern Interface for Elevator Scheduling Algorithms
 * This interface allows pluggable scheduling strategies for elevator assignment
 */
export interface ISchedulingStrategy {
  /**
   * Select the most optimal elevator for a given external request
   * @param elevators - Array of available elevators in the building
   * @param request - The external request (hall call) to be served
   * @returns The selected elevator, or null if no suitable elevator found
   */
  selectElevator(elevators: Elevator[], request: ExternalRequest): Elevator | null;

  /**
   * Get the name of the scheduling strategy
   * @returns String representation of the strategy
   */
  getStrategyName(): string;

  /**
   * Get a description of how this strategy works
   * @returns Human-readable description
   */
  getDescription(): string;
}
