import { IdGenerator } from '../utils/IdGenerator';
import { ParkingSpot } from './ParkingSpot';
import { VehicleType } from '../enums/VehicleType';
import { SpotState } from '../enums/SpotState';

export class Floor {
  public readonly id: string;
  public floorNumber: number;
  public spots: ParkingSpot[];
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(floorNumber: number, id?: string) {
    this.id = id || IdGenerator.generateUUID();
    this.floorNumber = floorNumber;
    this.spots = [];
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  public addSpot(spot: ParkingSpot): void {
    this.spots.push(spot);
    this.update();
  }

  public removeSpot(spotId: string): void {
    const index = this.spots.findIndex(s => s.id === spotId);
    if (index === -1) {
      throw new Error(`Spot ${spotId} not found on floor ${this.floorNumber}`);
    }
    if (this.spots[index].state === SpotState.OCCUPIED) {
      throw new Error(`Cannot remove occupied spot ${spotId}`);
    }
    this.spots.splice(index, 1);
    this.update();
  }

  public getAvailableSpotsByType(vehicleType: VehicleType): number {
    return this.spots.filter(spot => 
      spot.state === SpotState.AVAILABLE && this.canAccommodate(spot, vehicleType)
    ).length;
  }

  public findAvailableSpots(filter?: {
    vehicleType?: VehicleType;
    accessibilityLevel?: string;
  }): ParkingSpot[] {
    return this.spots.filter(spot => {
      if (spot.state !== SpotState.AVAILABLE) return false;
      if (filter?.vehicleType && !this.canAccommodate(spot, filter.vehicleType)) return false;
      if (filter?.accessibilityLevel && spot.accessibilityLevel !== filter.accessibilityLevel) return false;
      return true;
    });
  }

  private canAccommodate(spot: ParkingSpot, vehicleType: VehicleType): boolean {
    const spotSizeOrder = ['COMPACT', 'STANDARD', 'LARGE', 'HANDICAPPED'];
    const vehicleSizeOrder = ['BIKE', 'CAR', 'VAN', 'TRUCK'];

    const spotSize = spotSizeOrder.indexOf(spot.type);
    const vehicleSize = vehicleSizeOrder.indexOf(vehicleType);

    return spotSize >= vehicleSize;
  }

  private update(): void {
    this.updatedAt = new Date();
  }
}
