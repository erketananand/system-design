import { ISeatAllocationStrategy, AllocationResult } from './ISeatAllocationStrategy';
import { Train } from '../../models/Train';
import { Passenger } from '../../models/Passenger';
import { CoachType } from '../../enums/CoachType';

export class AutomaticAllocationStrategy implements ISeatAllocationStrategy {
  allocateSeats(
    train: Train,
    passengers: Passenger[],
    coachType: CoachType,
    date: Date
  ): AllocationResult {
    const coaches = train.getCoachesByType(coachType);
    const allocatedSeats = new Map();

    if (coaches.length === 0) {
      return {
        success: false,
        allocatedSeats,
        message: `No coaches of type ${coachType} found.`
      };
    }

    let passengerIndex = 0;

    // First-come-first-served allocation
    for (const coach of coaches) {
      if (passengerIndex >= passengers.length) break;

      const availableSeats = coach.getAvailableSeats(date);

      for (const seat of availableSeats) {
        if (passengerIndex >= passengers.length) break;

        const passenger = passengers[passengerIndex];
        seat.book(this.getDateKey(date), 'temp-booking-id');
        passenger.assignSeat(coach.coachNumber, seat.seatNumber);
        allocatedSeats.set(passenger.id, { coach, seat });
        passengerIndex++;
      }
    }

    if (passengerIndex < passengers.length) {
      return {
        success: false,
        allocatedSeats,
        message: `Could not allocate seats for all passengers. Allocated: ${passengerIndex}/${passengers.length}`
      };
    }

    return {
      success: true,
      allocatedSeats,
      message: 'All seats allocated automatically (FCFS).'
    };
  }

  private getDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getStrategyName(): string {
    return 'AutomaticAllocationStrategy';
  }
}
