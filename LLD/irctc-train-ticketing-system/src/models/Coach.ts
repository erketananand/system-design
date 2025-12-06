import { IdGenerator } from '../utils/IdGenerator';
import { CoachType } from '../enums/CoachType';
import { Seat } from './Seat';
import { BerthType } from '../enums/BerthType';

export class Coach {
  public readonly id: string;
  public coachNumber: string;
  public coachType: CoachType;
  public totalSeats: number;
  public trainId: string;
  public seats: Seat[];

  constructor(
    coachNumber: string,
    coachType: CoachType,
    totalSeats: number,
    trainId: string,
    id?: string
  ) {
    this.id = id || IdGenerator.generateUUID();
    this.coachNumber = coachNumber;
    this.coachType = coachType;
    this.totalSeats = totalSeats;
    this.trainId = trainId;
    this.seats = [];
    this.initializeSeats();
  }

  /**
   * Initialize seats based on coach type
   */
  private initializeSeats(): void {
    if (this.coachType === CoachType.SLEEPER || 
        this.coachType === CoachType.THIRD_AC ||
        this.coachType === CoachType.SECOND_AC ||
        this.coachType === CoachType.FIRST_AC) {
      // Berth configuration
      this.initializeBerthSeats();
    } else {
      // Seat configuration (Chair Car, General)
      this.initializeChairSeats();
    }
  }

  /**
   * Initialize berth-type seats (Sleeper/AC coaches)
   */
  private initializeBerthSeats(): void {
    const berthPattern = [
      BerthType.LOWER,
      BerthType.MIDDLE,
      BerthType.UPPER,
      BerthType.LOWER,
      BerthType.MIDDLE,
      BerthType.UPPER,
      BerthType.SIDE_LOWER,
      BerthType.SIDE_UPPER
    ];

    for (let i = 1; i <= this.totalSeats; i++) {
      const berthType = berthPattern[(i - 1) % berthPattern.length];
      const seat = new Seat(`${i}`, berthType, this.id);
      this.seats.push(seat);
    }
  }

  /**
   * Initialize chair-type seats
   */
  private initializeChairSeats(): void {
    for (let i = 1; i <= this.totalSeats; i++) {
      const seat = new Seat(`${i}`, BerthType.SEAT, this.id);
      this.seats.push(seat);
    }
  }

  /**
   * Get seat by number
   */
  public getSeatByNumber(seatNumber: string): Seat | undefined {
    return this.seats.find(s => s.seatNumber === seatNumber);
  }

  /**
   * Get available seats for a specific date
   */
  public getAvailableSeats(date: Date): Seat[] {
    return this.seats.filter(seat => seat.isAvailableOn(date));
  }

  /**
   * Get booked seats for a specific date
   */
  public getBookedSeats(date: Date): Seat[] {
    return this.seats.filter(seat => !seat.isAvailableOn(date));
  }

  /**
   * Get total available seats for a date
   */
  public getTotalAvailable(date: Date): number {
    return this.getAvailableSeats(date).length;
  }

  /**
   * Get coach display info
   */
  public getDisplayInfo(): string {
    return `${this.coachNumber} (${this.coachType}) - ${this.totalSeats} seats`;
  }
}
