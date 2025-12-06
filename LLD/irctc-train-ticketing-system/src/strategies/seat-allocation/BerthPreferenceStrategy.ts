import { ISeatAllocationStrategy, AllocationResult } from './ISeatAllocationStrategy';
import { Train } from '../../models/Train';
import { Passenger } from '../../models/Passenger';
import { CoachType } from '../../enums/CoachType';
import { BerthPreference } from '../../enums/BerthPreference';
import { BerthType } from '../../enums/BerthType';

export class BerthPreferenceStrategy implements ISeatAllocationStrategy {
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

    for (const passenger of passengers) {
      let allocated = false;

      // Try to allocate based on preference
      if (passenger.berthPreference !== BerthPreference.NO_PREFERENCE) {
        const preferredBerth = this.mapPreferenceToBerthType(passenger.berthPreference);

        for (const coach of coaches) {
          const availableSeats = coach.getAvailableSeats(date);
          const preferredSeat = availableSeats.find(s => s.berthType === preferredBerth);

          if (preferredSeat) {
            preferredSeat.book(this.getDateKey(date), 'temp-booking-id');
            passenger.assignSeat(coach.coachNumber, preferredSeat.seatNumber);
            allocatedSeats.set(passenger.id, { coach, seat: preferredSeat });
            allocated = true;
            break;
          }
        }
      }

      // If preference not satisfied, allocate any available seat
      if (!allocated) {
        for (const coach of coaches) {
          const availableSeats = coach.getAvailableSeats(date);
          if (availableSeats.length > 0) {
            const seat = availableSeats[0];
            seat.book(this.getDateKey(date), 'temp-booking-id');
            passenger.assignSeat(coach.coachNumber, seat.seatNumber);
            allocatedSeats.set(passenger.id, { coach, seat });
            allocated = true;
            break;
          }
        }
      }

      if (!allocated) {
        return {
          success: false,
          allocatedSeats,
          message: `Could not allocate seat for passenger: ${passenger.name}`
        };
      }
    }

    return {
      success: true,
      allocatedSeats,
      message: 'All seats allocated successfully with berth preferences.'
    };
  }

  private mapPreferenceToBerthType(preference: BerthPreference): BerthType {
    const mapping: Record<BerthPreference, BerthType> = {
      [BerthPreference.LOWER]: BerthType.LOWER,
      [BerthPreference.MIDDLE]: BerthType.MIDDLE,
      [BerthPreference.UPPER]: BerthType.UPPER,
      [BerthPreference.SIDE_LOWER]: BerthType.SIDE_LOWER,
      [BerthPreference.SIDE_UPPER]: BerthType.SIDE_UPPER,
      [BerthPreference.NO_PREFERENCE]: BerthType.LOWER
    };
    return mapping[preference];
  }

  private getDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getStrategyName(): string {
    return 'BerthPreferenceStrategy';
  }
}
