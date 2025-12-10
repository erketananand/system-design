import { IAllocationStrategy } from './IAllocationStrategy';
import { Vehicle } from '../models/Vehicle';
import { Floor } from '../models/Floor';
import { ParkingSpot } from '../models/ParkingSpot';

export class NearestSpotStrategy implements IAllocationStrategy {
  private name: string = 'Nearest Spot Strategy';

  public allocateSpot(
    vehicle: Vehicle,
    expectedDurationHours: number,
    floors: Floor[]
  ): ParkingSpot | null {
    let availableSpots: ParkingSpot[] = [];

    for (const floor of floors) {
      const spots = floor.findAvailableSpots({ vehicleType: vehicle.type });
      availableSpots.push(...spots);
    }

    if (availableSpots.length === 0) {
      return null;
    }

    availableSpots.sort((a, b) => a.distanceScore - b.distanceScore);
    return availableSpots[0];
  }

  public getName(): string {
    return this.name;
  }
}
