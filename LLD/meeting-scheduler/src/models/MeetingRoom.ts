import { IdGenerator } from '../utils/IdGenerator';

export class MeetingRoom {
  public readonly id: string;
  public name: string;
  public capacity: number;
  public amenities: string[];
  public location: string;
  public isAvailable: boolean;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(name: string, capacity: number, location: string, amenities: string[] = [], id?: string) {
    this.id = id || IdGenerator.generateRoomId();
    this.name = name;
    this.capacity = capacity;
    this.location = location;
    this.amenities = amenities;
    this.isAvailable = true;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    if (capacity <= 0) throw new Error('Capacity must be greater than 0');
  }

  public addAmenity(amenity: string): void {
    if (!this.amenities.includes(amenity)) {
      this.amenities.push(amenity);
      this.update();
    }
  }

  public checkCapacity(requiredCapacity: number): boolean {
    return this.capacity >= requiredCapacity;
  }

  public setAvailability(available: boolean): void {
    this.isAvailable = available;
    this.update();
  }

  private update(): void {
    this.updatedAt = new Date();
  }

  public getInfo(): string {
    return `${this.name} (${this.location}) - Capacity: ${this.capacity}`;
  }
}
