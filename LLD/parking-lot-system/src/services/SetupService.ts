import { Floor } from '../models/Floor';
import { FloorRepository } from '../repositories/FloorRepository';
import { ParkingSpotRepository } from '../repositories/ParkingSpotRepository';
import { SpotFactory } from '../factories/SpotFactory';
import { SpotType } from '../enums/SpotType';
import { AccessibilityLevel } from '../enums/AccessibilityLevel';
import { Logger } from '../utils/Logger';

export class SetupService {
  private floorRepo = new FloorRepository();
  private spotRepo = new ParkingSpotRepository();

  public initializeParkingLot(numberOfFloors: number = 3): void {
    Logger.header('INITIALIZING PARKING LOT');

    for (let i = 1; i <= numberOfFloors; i++) {
      const floor = new Floor(i);
      this.floorRepo.save(floor);

      // Create spots with different accessibility levels
      const spots = SpotFactory.createBatch(floor.id, i, [
        // HIGH accessibility - near gates (20% of spots)
        { type: SpotType.COMPACT, accessibilityLevel: AccessibilityLevel.HIGH, count: 3, startingDistance: 10 },
        { type: SpotType.STANDARD, accessibilityLevel: AccessibilityLevel.HIGH, count: 4, startingDistance: 15 },
        { type: SpotType.LARGE, accessibilityLevel: AccessibilityLevel.HIGH, count: 2, startingDistance: 20 },

        // MEDIUM accessibility - mid-level (60% of spots)
        { type: SpotType.COMPACT, accessibilityLevel: AccessibilityLevel.MEDIUM, count: 8, startingDistance: 30 },
        { type: SpotType.STANDARD, accessibilityLevel: AccessibilityLevel.MEDIUM, count: 12, startingDistance: 40 },
        { type: SpotType.LARGE, accessibilityLevel: AccessibilityLevel.MEDIUM, count: 5, startingDistance: 50 },

        // LOW accessibility - back areas (20% of spots)
        { type: SpotType.COMPACT, accessibilityLevel: AccessibilityLevel.LOW, count: 3, startingDistance: 70 },
        { type: SpotType.STANDARD, accessibilityLevel: AccessibilityLevel.LOW, count: 4, startingDistance: 80 },
        { type: SpotType.LARGE, accessibilityLevel: AccessibilityLevel.LOW, count: 2, startingDistance: 90 },
        { type: SpotType.HANDICAPPED, accessibilityLevel: AccessibilityLevel.HIGH, count: 2, startingDistance: 5 }
      ]);

      // Add spots to floor and save
      spots.forEach(spot => {
        floor.addSpot(spot);
        this.spotRepo.save(spot);
      });

      this.floorRepo.save(floor);

      Logger.info(`Floor ${i}: ${spots.length} spots created`);
    }

    Logger.success(`Parking lot initialized with ${numberOfFloors} floors`);
    this.printSummary();
  }

  private printSummary(): void {
    const floors = this.floorRepo.findAll();
    const totalSpots = this.spotRepo.count();

    console.log('\n' + '='.repeat(70));
    console.log('PARKING LOT SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total Floors: ${floors.length}`);
    console.log(`Total Spots: ${totalSpots}`);

    floors.forEach(floor => {
      const spots = this.spotRepo.findByFloorId(floor.id);
      const high = spots.filter(s => s.accessibilityLevel === AccessibilityLevel.HIGH).length;
      const medium = spots.filter(s => s.accessibilityLevel === AccessibilityLevel.MEDIUM).length;
      const low = spots.filter(s => s.accessibilityLevel === AccessibilityLevel.LOW).length;

      console.log(`  Floor ${floor.floorNumber}: ${spots.length} spots (HIGH: ${high}, MEDIUM: ${medium}, LOW: ${low})`);
    });
    console.log('='.repeat(70) + '\n');
  }
}
