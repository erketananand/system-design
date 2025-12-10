import { IAllocationStrategy } from './IAllocationStrategy';
import { Vehicle } from '../models/Vehicle';
import { Floor } from '../models/Floor';
import { ParkingSpot } from '../models/ParkingSpot';
import { AccessibilityLevel } from '../enums/AccessibilityLevel';

export class DurationAwareStrategy implements IAllocationStrategy {
  private name: string = 'Duration-Aware Allocation Strategy';

  public allocateSpot(
    vehicle: Vehicle,
    expectedDurationHours: number,
    floors: Floor[]
  ): ParkingSpot | null {
    const preferredAccessibility = this.getPreferredAccessibility(expectedDurationHours);

    let availableSpots: ParkingSpot[] = [];

    for (const floor of floors) {
      const spots = floor.findAvailableSpots({ vehicleType: vehicle.type });
      availableSpots.push(...spots);
    }

    if (availableSpots.length === 0) {
      return null;
    }

    let preferredSpots = availableSpots.filter(
      spot => spot.accessibilityLevel === preferredAccessibility
    );

    if (preferredSpots.length === 0) {
      preferredSpots = availableSpots;
    }

    preferredSpots.sort((a, b) => a.distanceScore - b.distanceScore);
    return preferredSpots[0];
  }

  private getPreferredAccessibility(durationHours: number): AccessibilityLevel {
    if (durationHours < 2) {
      return AccessibilityLevel.HIGH;
    } else if (durationHours <= 6) {
      return AccessibilityLevel.MEDIUM;
    } else {
      return AccessibilityLevel.LOW;
    }
  }

  public getName(): string {
    return this.name;
  }
}
