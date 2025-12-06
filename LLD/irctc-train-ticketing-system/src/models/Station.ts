import { IdGenerator } from '../utils/IdGenerator';

export class Station {
  public readonly id: string;
  public stationCode: string;
  public stationName: string;
  public city: string;
  public state: string;
  public platformCount: number;

  constructor(
    stationCode: string,
    stationName: string,
    city: string,
    state: string,
    platformCount: number = 1,
    id?: string
  ) {
    this.id = id || IdGenerator.generateUUID();
    this.stationCode = stationCode.toUpperCase();
    this.stationName = stationName;
    this.city = city;
    this.state = state;
    this.platformCount = platformCount;
  }

  /**
   * Validate station data
   */
  public isValid(): boolean {
    return (
      this.stationCode.length >= 2 &&
      this.stationName.length > 0 &&
      this.platformCount > 0
    );
  }

  /**
   * Get full station display name
   */
  public getDisplayName(): string {
    return `${this.stationName} (${this.stationCode})`;
  }

  /**
   * Get location string
   */
  public getLocation(): string {
    return `${this.city}, ${this.state}`;
  }
}
