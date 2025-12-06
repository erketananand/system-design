import { Station } from './Station';

export class RouteStation {
  public station: Station;
  public arrivalTime: string | null;
  public departureTime: string | null;
  public platform: number;
  public distanceFromOrigin: number; // in kilometers
  public stopNumber: number;

  constructor(
    station: Station,
    stopNumber: number,
    distanceFromOrigin: number,
    arrivalTime: string | null = null,
    departureTime: string | null = null,
    platform: number = 1
  ) {
    this.station = station;
    this.stopNumber = stopNumber;
    this.distanceFromOrigin = distanceFromOrigin;
    this.arrivalTime = arrivalTime;
    this.departureTime = departureTime;
    this.platform = platform;
  }

  /**
   * Check if this is the origin station
   */
  public isOrigin(): boolean {
    return this.stopNumber === 1 && this.arrivalTime === null;
  }

  /**
   * Check if this is the destination station
   */
  public isDestination(): boolean {
    return this.departureTime === null;
  }

  /**
   * Get halt duration in minutes
   */
  public getHaltDuration(): number {
    if (!this.arrivalTime || !this.departureTime) return 0;

    const arrival = this.parseTime(this.arrivalTime);
    const departure = this.parseTime(this.departureTime);

    return departure - arrival;
  }

  /**
   * Parse time string to minutes
   */
  private parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Get display string
   */
  public getDisplayInfo(): string {
    const arrival = this.arrivalTime || '--:--';
    const departure = this.departureTime || '--:--';
    return `${this.station.stationCode} | Arr: ${arrival} | Dep: ${departure} | Platform: ${this.platform}`;
  }
}
