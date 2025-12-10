import { ParkingSpot } from '../models/ParkingSpot';
import { SpotType } from '../enums/SpotType';
import { AccessibilityLevel } from '../enums/AccessibilityLevel';
import { IdGenerator } from '../utils/IdGenerator';

export class SpotFactory {
  public static createSpot(
    floorId: string,
    floorNumber: number,
    spotIndex: number,
    type: SpotType,
    accessibilityLevel: AccessibilityLevel,
    distanceScore?: number
  ): ParkingSpot {
    const spotNumber = IdGenerator.generateSpotNumber(floorNumber, spotIndex);
    return new ParkingSpot(
      spotNumber,
      floorId,
      type,
      accessibilityLevel,
      distanceScore
    );
  }

  public static createBatch(
    floorId: string,
    floorNumber: number,
    config: {
      type: SpotType;
      accessibilityLevel: AccessibilityLevel;
      count: number;
      startingDistance: number;
    }[]
  ): ParkingSpot[] {
    const spots: ParkingSpot[] = [];
    let spotIndex = 1;

    for (const { type, accessibilityLevel, count, startingDistance } of config) {
      for (let i = 0; i < count; i++) {
        const distanceScore = startingDistance + (i * 5);
        const spot = this.createSpot(
          floorId,
          floorNumber,
          spotIndex++,
          type,
          accessibilityLevel,
          distanceScore
        );
        spots.push(spot);
      }
    }

    return spots;
  }
}
