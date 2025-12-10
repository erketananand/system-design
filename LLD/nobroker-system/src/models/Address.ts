import { IdGenerator } from '../utils/IdGenerator';

export class Address {
  public readonly id: string;
  public city: string;
  public area: string;
  public locality: string;
  public landmark: string | null;
  public latitude: number | null;
  public longitude: number | null;
  public readonly createdAt: Date;

  constructor(
    city: string,
    area: string,
    locality: string,
    landmark: string | null = null,
    latitude: number | null = null,
    longitude: number | null = null,
    id?: string
  ) {
    this.id = id || IdGenerator.generateAddressId();
    this.city = city;
    this.area = area;
    this.locality = locality;
    this.landmark = landmark;
    this.latitude = latitude;
    this.longitude = longitude;
    this.createdAt = new Date();
  }

  public getFullAddress(): string {
    const parts = [this.locality, this.area, this.city];
    if (this.landmark) {
      parts.unshift(`Near ${this.landmark}`);
    }
    return parts.join(', ');
  }

  public matchesLocation(location: string): boolean {
    const lowerLocation = location.toLowerCase();
    return (
      this.city.toLowerCase().includes(lowerLocation) ||
      this.area.toLowerCase().includes(lowerLocation) ||
      this.locality.toLowerCase().includes(lowerLocation)
    );
  }

  public hasGeoCoordinates(): boolean {
    return this.latitude !== null && this.longitude !== null;
  }
}
