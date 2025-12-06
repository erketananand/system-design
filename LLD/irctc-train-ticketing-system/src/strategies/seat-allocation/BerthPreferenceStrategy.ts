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
    const lockedSeats: Array<{ seat: any; coach: any; dateKey: string }> = [];
    const tempBookingId = `temp-${Date.now()}`;

    if (coaches.length === 0) {
      return {
        success: false,
        allocatedSeats,
        message: `No coaches of type ${coachType} found.`
      };
    }

    try {
      for (const passenger of passengers) {
        let allocated = false;
        const dateKey = this.getDateKey(date);

        // Try to allocate based on preference
        if (passenger.berthPreference !== BerthPreference.NO_PREFERENCE) {
          const preferredBerth = this.mapPreferenceToBerthType(passenger.berthPreference);

          for (const coach of coaches) {
            const availableSeats = coach.getAvailableSeats(date);
            const preferredSeat = availableSeats.find(s => s.berthType === preferredBerth);

            if (preferredSeat) {
              // Try to lock the seat
              if (preferredSeat.tryLock(dateKey, tempBookingId)) {
                lockedSeats.push({ seat: preferredSeat, coach, dateKey });
                passenger.assignSeat(coach.coachNumber, preferredSeat.seatNumber);
                allocatedSeats.set(passenger.id, { coach, seat: preferredSeat });
                allocated = true;
                break;
              }
            }
          }
        }

        // If preference not satisfied, allocate any available seat
        if (!allocated) {
          for (const coach of coaches) {
            const availableSeats = coach.getAvailableSeats(date);
            if (availableSeats.length > 0) {
              const seat = availableSeats[0];
              
              // Try to lock the seat
              if (seat.tryLock(dateKey, tempBookingId)) {
                lockedSeats.push({ seat, coach, dateKey });
                passenger.assignSeat(coach.coachNumber, seat.seatNumber);
                allocatedSeats.set(passenger.id, { coach, seat });
                allocated = true;
                break;
              }
            }
          }
        }

        if (!allocated) {
          // Release all previously locked seats
          this.releaseAllLocks(lockedSeats, tempBookingId);
          
          return {
            success: false,
            allocatedSeats: new Map(),
            message: `Could not allocate seat for passenger: ${passenger.name}. All seats taken or locked.`
          };
        }
      }

      // All passengers allocated successfully
      // Now actually book the seats
      for (const { seat, dateKey } of lockedSeats) {
        seat.book(dateKey, tempBookingId);
      }

      return {
        success: true,
        allocatedSeats,
        message: 'All seats allocated successfully with berth preferences.'
      };

    } catch (error) {
      // On any error, release all locks
      this.releaseAllLocks(lockedSeats, tempBookingId);
      throw error;
    }
  }

  private releaseAllLocks(
    lockedSeats: Array<{ seat: any; coach: any; dateKey: string }>,
    bookingId: string
  ): void {
    for (const { seat, dateKey } of lockedSeats) {
      seat.releaseLock(dateKey, bookingId);
    }
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
