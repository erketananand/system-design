import { Train } from '../../models/Train';
import { Passenger } from '../../models/Passenger';
import { CoachType } from '../../enums/CoachType';
import { Seat } from '../../models/Seat';
import { Coach } from '../../models/Coach';

export interface AllocationResult {
  success: boolean;
  allocatedSeats: Map<string, { coach: Coach; seat: Seat }>; // passengerId -> { coach, seat }
  message: string;
}

/**
 * Strategy Pattern Interface for Seat Allocation
 */
export interface ISeatAllocationStrategy {
  /**
   * Allocate seats to passengers
   */
  allocateSeats(
    train: Train,
    passengers: Passenger[],
    coachType: CoachType,
    date: Date
  ): AllocationResult;

  /**
   * Get strategy name
   */
  getStrategyName(): string;
}
