import { IdGenerator } from '../utils/IdGenerator';
import { RouteStation } from './RouteStation';
import { DayOfWeek } from '../enums/DayOfWeek';

export class TrainSchedule {
  public readonly id: string;
  public trainId: string;
  public route: RouteStation[];
  public operatingDays: DayOfWeek[];
  public effectiveFrom: Date;
  public effectiveTo: Date | null;

  constructor(
    trainId: string,
    route: RouteStation[],
    operatingDays: DayOfWeek[],
    effectiveFrom: Date,
    effectiveTo: Date | null = null,
    id?: string
  ) {
    this.id = id || IdGenerator.generateUUID();
    this.trainId = trainId;
    this.route = route.sort((a, b) => a.stopNumber - b.stopNumber);
    this.operatingDays = operatingDays;
    this.effectiveFrom = effectiveFrom;
    this.effectiveTo = effectiveTo;
  }

  /**
   * Add a station to the route
   */
  public addStation(routeStation: RouteStation): void {
    this.route.push(routeStation);
    this.route.sort((a, b) => a.stopNumber - b.stopNumber);
  }

  /**
   * Get station by code
   */
  public getStationByCode(stationCode: string): RouteStation | undefined {
    return this.route.find(rs => rs.station.stationCode === stationCode);
  }

  /**
   * Check if train operates on given date
   */
  public isOperatingOn(date: Date): boolean {
    // Check if date is within effective period
    if (date < this.effectiveFrom) return false;
    if (this.effectiveTo && date > this.effectiveTo) return false;

    // Check if train operates on this day of week
    const dayName = this.getDayName(date);
    return this.operatingDays.includes(dayName);
  }

  /**
   * Get distance between two stations
   */
  public getDistanceBetween(sourceCode: string, destCode: string): number {
    const source = this.getStationByCode(sourceCode);
    const dest = this.getStationByCode(destCode);

    if (!source || !dest) return 0;

    return Math.abs(dest.distanceFromOrigin - source.distanceFromOrigin);
  }

  /**
   * Get all stations between source and destination
   */
  public getIntermediateStations(sourceCode: string, destCode: string): RouteStation[] {
    const sourceIdx = this.route.findIndex(rs => rs.station.stationCode === sourceCode);
    const destIdx = this.route.findIndex(rs => rs.station.stationCode === destCode);

    if (sourceIdx === -1 || destIdx === -1) return [];

    return this.route.slice(sourceIdx, destIdx + 1);
  }

  /**
   * Get day name from date
   */
  private getDayName(date: Date): DayOfWeek {
    const days = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY
    ];
    return days[date.getDay()];
  }

  /**
   * Get origin station
   */
  public getOrigin(): RouteStation {
    return this.route[0];
  }

  /**
   * Get destination station
   */
  public getDestination(): RouteStation {
    return this.route[this.route.length - 1];
  }

  /**
   * Get total journey distance
   */
  public getTotalDistance(): number {
    const destination = this.getDestination();
    return destination.distanceFromOrigin;
  }
}
