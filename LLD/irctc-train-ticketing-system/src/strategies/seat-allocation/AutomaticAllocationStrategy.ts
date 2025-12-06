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
      let passengerIndex = 0;
      const dateKey = this.getDateKey(date);

      // First-come-first-served allocation with locking
      for (const coach of coaches) {
        if (passengerIndex >= passengers.length) break;

        const availableSeats = coach.getAvailableSeats(date);

        for (const seat of availableSeats) {
          if (passengerIndex >= passengers.length) break;

          // Try to lock the seat
          if (seat.tryLock(dateKey, tempBookingId)) {
            const passenger = passengers[passengerIndex];
            lockedSeats.push({ seat, coach, dateKey });
            passenger.assignSeat(coach.coachNumber, seat.seatNumber);
            allocatedSeats.set(passenger.id, { coach, seat });
            passengerIndex++;
          }
        }
      }

      // Check if all passengers were allocated
      if (passengerIndex < passengers.length) {
        // Not enough seats, release all locks
        this.releaseAllLocks(lockedSeats, tempBookingId);
        
        return {
          success: false,
          allocatedSeats: new Map(),
          message: `Could not allocate seats for all passengers. Only ${passengerIndex}/${passengers.length} available or not locked.`
        };
      }

      // All passengers allocated successfully
      // Now actually book the seats
      for (const { seat, dateKey } of lockedSeats) {
        seat.book(dateKey, tempBookingId);
      }

      return {
        success: true,
        allocatedSeats,
        message: 'All seats allocated automatically (FCFS).'
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

  private getDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getStrategyName(): string {
    return 'AutomaticAllocationStrategy';
  }
}
