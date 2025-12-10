import { Vehicle } from '../models/Vehicle';
import { Floor } from '../models/Floor';
import { ParkingSpot } from '../models/ParkingSpot';

export interface IAllocationStrategy {
  allocateSpot(
    vehicle: Vehicle,
    expectedDurationHours: number,
    floors: Floor[]
  ): ParkingSpot | null;

  getName(): string;
}
