import { IdGenerator } from '../utils/IdGenerator';
import { TrainType } from '../enums/TrainType';
import { CoachType } from '../enums/CoachType';
import { Station } from './Station';
import { Coach } from './Coach';
import { TrainSchedule } from './TrainSchedule';

export class Train {
  public readonly id: string;
  public trainNumber: string;
  public trainName: string;
  public source: Station;
  public destination: Station;
  public trainType: TrainType;
  public schedule: TrainSchedule | null;
  public coaches: Map<CoachType, Coach[]>;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(
    trainNumber: string,
    trainName: string,
    source: Station,
    destination: Station,
    trainType: TrainType,
    id?: string
  ) {
    this.id = id || IdGenerator.generateUUID();
    this.trainNumber = trainNumber;
    this.trainName = trainName;
    this.source = source;
    this.destination = destination;
    this.trainType = trainType;
    this.schedule = null;
    this.coaches = new Map<CoachType, Coach[]>();
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Add a coach to the train
   */
  public addCoach(coach: Coach): void {
    if (!this.coaches.has(coach.coachType)) {
      this.coaches.set(coach.coachType, []);
    }
    this.coaches.get(coach.coachType)!.push(coach);
    this.update();
  }

  /**
   * Get all coaches of a specific type
   */
  public getCoachesByType(coachType: CoachType): Coach[] {
    return this.coaches.get(coachType) || [];
  }

  /**
   * Get total seats for a coach type
   */
  public getTotalSeats(coachType: CoachType): number {
    const coaches = this.getCoachesByType(coachType);
    return coaches.reduce((total, coach) => total + coach.totalSeats, 0);
  }

  /**
   * Get available seats for a coach type on a specific date
   */
  public getAvailableSeats(coachType: CoachType, date: Date): number {
    const coaches = this.getCoachesByType(coachType);
    return coaches.reduce((total, coach) => total + coach.getTotalAvailable(date), 0);
  }

  /**
   * Calculate fare based on coach type and distance
   */
  public calculateFare(coachType: CoachType, distance: number): number {
    const baseFarePerKm = this.getBaseFarePerKm(coachType);
    const fare = baseFarePerKm * distance;
    return Math.round(fare);
  }

  /**
   * Get base fare per km for coach type
   */
  private getBaseFarePerKm(coachType: CoachType): number {
    const fares: Record<CoachType, number> = {
      [CoachType.FIRST_AC]: 5.0,
      [CoachType.SECOND_AC]: 3.5,
      [CoachType.THIRD_AC]: 2.5,
      [CoachType.SLEEPER]: 1.5,
      [CoachType.CHAIR_CAR]: 2.0,
      [CoachType.AC_CHAIR_CAR]: 2.5,
      [CoachType.GENERAL]: 0.5,
      [CoachType.SECOND_SEATING]: 1.0
    };
    return fares[coachType] || 1.0;
  }

  /**
   * Check if train operates on given date
   */
  public isOperatingOn(date: Date): boolean {
    if (!this.schedule) return false;
    return this.schedule.isOperatingOn(date);
  }

  /**
   * Set train schedule
   */
  public setSchedule(schedule: TrainSchedule): void {
    this.schedule = schedule;
    this.update();
  }

  /**
   * Get available coach types
   */
  public getAvailableCoachTypes(): CoachType[] {
    return Array.from(this.coaches.keys());
  }

  /**
   * Update timestamp
   */
  public update(): void {
    this.updatedAt = new Date();
  }

  /**
   * Get train display info
   */
  public getDisplayInfo(): string {
    return `${this.trainNumber} - ${this.trainName} (${this.trainType})`;
  }

  /**
   * Get route display
   */
  public getRouteDisplay(): string {
    return `${this.source.stationCode} → ${this.destination.stationCode}`;
  }
}
