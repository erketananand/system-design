import { IdGenerator } from '../utils/IdGenerator';
import { Station } from './Station';
import { Passenger } from './Passenger';
import { CoachType } from '../enums/CoachType';
import { BookingStatus } from '../enums/BookingStatus';
import { IBookingState } from '../states/IBookingState';
import { PendingPaymentState } from '../states/PendingPaymentState';

export class Booking {
  public readonly id: string;
  public readonly pnr: string;
  public userId: string;
  public trainId: string;
  public passengers: Passenger[];
  public journeyDate: Date;
  public sourceStation: Station;
  public destinationStation: Station;
  public coachType: CoachType;
  public bookingState: IBookingState;
  public totalFare: number;
  public paymentId: string | null;
  public readonly bookedAt: Date;
  public updatedAt: Date;

  constructor(
    userId: string,
    trainId: string,
    passengers: Passenger[],
    journeyDate: Date,
    sourceStation: Station,
    destinationStation: Station,
    coachType: CoachType,
    totalFare: number,
    id?: string,
    pnr?: string
  ) {
    this.id = id || IdGenerator.generateUUID();
    this.pnr = pnr || IdGenerator.generatePNR();
    this.userId = userId;
    this.trainId = trainId;
    this.passengers = passengers;
    this.journeyDate = journeyDate;
    this.sourceStation = sourceStation;
    this.destinationStation = destinationStation;
    this.coachType = coachType;
    this.totalFare = totalFare;
    this.paymentId = null;
    this.bookedAt = new Date();
    this.updatedAt = new Date();
    this.bookingState = new PendingPaymentState(); // Initial state
  }

  /**
   * Set booking state
   */
  public setState(state: IBookingState): void {
    this.bookingState = state;
    this.update();
  }

  /**
   * Confirm booking (delegates to state)
   */
  public confirm(): void {
    this.bookingState.confirm(this);
  }

  /**
   * Cancel booking (delegates to state)
   */
  public cancel(): void {
    this.bookingState.cancel(this);
  }

  /**
   * Add to waitlist (delegates to state)
   */
  public addToWaitlist(position: number): void {
    this.bookingState.addToWaitlist(this, position);
  }

  /**
   * Promote from waitlist (delegates to state)
   */
  public promoteFromWaitlist(): void {
    this.bookingState.promoteFromWaitlist(this);
  }

  /**
   * Get current booking status
   */
  public getStatus(): BookingStatus {
    return this.bookingState.getStatus();
  }

  /**
   * Calculate refund amount based on cancellation time
   */
  public calculateRefund(): number {
    const now = new Date();
    const hoursBeforeDeparture = (this.journeyDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursBeforeDeparture > 48) {
      return this.totalFare * 0.9; // 90% refund
    } else if (hoursBeforeDeparture > 24) {
      return this.totalFare * 0.75; // 75% refund
    } else if (hoursBeforeDeparture > 12) {
      return this.totalFare * 0.5; // 50% refund
    } else if (hoursBeforeDeparture > 4) {
      return this.totalFare * 0.25; // 25% refund
    } else {
      return 0; // No refund
    }
  }

  /**
   * Set payment ID
   */
  public setPaymentId(paymentId: string): void {
    this.paymentId = paymentId;
    this.update();
  }

  /**
   * Get total number of passengers
   */
  public getPassengerCount(): number {
    return this.passengers.length;
  }

  /**
   * Get confirmed passengers
   */
  public getConfirmedPassengers(): Passenger[] {
    return this.passengers.filter(p => p.status === BookingStatus.CONFIRMED);
  }

  /**
   * Get waitlisted passengers
   */
  public getWaitlistedPassengers(): Passenger[] {
    return this.passengers.filter(p => p.status === BookingStatus.WAITLIST);
  }

  /**
   * Update timestamp
   */
  public update(): void {
    this.updatedAt = new Date();
  }

  /**
   * Get booking display info
   */
  public getDisplayInfo(): string {
    return `PNR: ${this.pnr} | Train: ${this.trainId} | Status: ${this.getStatus()} | Passengers: ${this.passengers.length}`;
  }

  /**
   * Get journey display
   */
  public getJourneyDisplay(): string {
    const date = this.journeyDate.toDateString();
    return `${this.sourceStation.stationCode} → ${this.destinationStation.stationCode} on ${date}`;
  }
}
