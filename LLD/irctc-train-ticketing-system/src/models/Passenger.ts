import { IdGenerator } from '../utils/IdGenerator';
import { Gender } from '../enums/Gender';
import { BerthPreference } from '../enums/BerthPreference';
import { BookingStatus } from '../enums/BookingStatus';

export class Passenger {
  public readonly id: string;
  public name: string;
  public age: number;
  public gender: Gender;
  public berthPreference: BerthPreference;
  public coachNumber: string | null;
  public seatNumber: string | null;
  public status: BookingStatus;
  public waitlistPosition: number | null;

  constructor(
    name: string,
    age: number,
    gender: Gender,
    berthPreference: BerthPreference = BerthPreference.NO_PREFERENCE,
    id?: string
  ) {
    this.id = id || IdGenerator.generateUUID();
    this.name = name;
    this.age = age;
    this.gender = gender;
    this.berthPreference = berthPreference;
    this.coachNumber = null;
    this.seatNumber = null;
    this.status = BookingStatus.PENDING_PAYMENT;
    this.waitlistPosition = null;
  }

  /**
   * Assign seat to passenger
   */
  public assignSeat(coachNumber: string, seatNumber: string): void {
    this.coachNumber = coachNumber;
    this.seatNumber = seatNumber;
    this.status = BookingStatus.CONFIRMED;
    this.waitlistPosition = null;
  }

  /**
   * Clear seat assignment
   */
  public clearSeat(): void {
    this.coachNumber = null;
    this.seatNumber = null;
  }

  /**
   * Set as waitlisted
   */
  public setWaitlisted(position: number): void {
    this.status = BookingStatus.WAITLIST;
    this.waitlistPosition = position;
    this.clearSeat();
  }

  /**
   * Set as RAC
   */
  public setRAC(position: number): void {
    this.status = BookingStatus.RAC;
    this.waitlistPosition = position;
    this.clearSeat();
  }

  /**
   * Validate passenger data
   */
  public isValid(): boolean {
    return (
      this.name.length > 0 &&
      this.age > 0 &&
      this.age <= 120
    );
  }

  /**
   * Check if senior citizen (60+ years)
   */
  public isSeniorCitizen(): boolean {
    return this.age >= 60;
  }

  /**
   * Check if child (below 5 years)
   */
  public isChild(): boolean {
    return this.age < 5;
  }

  /**
   * Get passenger display info
   */
  public getDisplayInfo(): string {
    const seat = this.coachNumber && this.seatNumber 
      ? `${this.coachNumber}-${this.seatNumber}` 
      : 'Not Assigned';
    return `${this.name}, ${this.age}/${this.gender} | Seat: ${seat} | Status: ${this.status}`;
  }
}
