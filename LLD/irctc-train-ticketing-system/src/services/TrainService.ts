import { Train } from '../models/Train';
import { TrainSchedule } from '../models/TrainSchedule';
import { Coach } from '../models/Coach';
import { Station } from '../models/Station';
import { TrainRepository } from '../repositories/TrainRepository';
import { TrainScheduleRepository } from '../repositories/TrainScheduleRepository';
import { CoachRepository } from '../repositories/CoachRepository';
import { TrainType } from '../enums/TrainType';
import { CoachType } from '../enums/CoachType';
import { Logger } from '../utils/Logger';

export class TrainService {
  private trainRepo = new TrainRepository();
  private scheduleRepo = new TrainScheduleRepository();
  private coachRepo = new CoachRepository();

  /**
   * Add a new train
   */
  public addTrain(
    trainNumber: string,
    trainName: string,
    source: Station,
    destination: Station,
    trainType: TrainType
  ): Train | null {
    if (this.trainRepo.existsByTrainNumber(trainNumber)) {
      Logger.error(`Train ${trainNumber} already exists.`);
      return null;
    }

    const train = new Train(trainNumber, trainName, source, destination, trainType);
    this.trainRepo.save(train);
    Logger.success(`Train added: ${trainNumber} - ${trainName}`);
    return train;
  }

  /**
   * Add coaches to a train
   */
  public addCoachToTrain(
    trainId: string,
    coachNumber: string,
    coachType: CoachType,
    totalSeats: number
  ): Coach | null {
    const train = this.trainRepo.findById(trainId);

    if (!train) {
      Logger.error('Train not found.');
      return null;
    }

    const coach = new Coach(coachNumber, coachType, totalSeats, trainId);
    this.coachRepo.save(coach);
    train.addCoach(coach);
    this.trainRepo.save(train);

    Logger.success(`Coach ${coachNumber} (${coachType}) added to train ${train.trainNumber}`);
    return coach;
  }

  /**
   * Set train schedule
   */
  public setTrainSchedule(trainId: string, schedule: TrainSchedule): boolean {
    const train = this.trainRepo.findById(trainId);

    if (!train) {
      Logger.error('Train not found.');
      return false;
    }

    train.setSchedule(schedule);
    this.scheduleRepo.save(schedule);
    this.trainRepo.save(train);

    Logger.success(`Schedule set for train ${train.trainNumber}`);
    return true;
  }

  /**
   * Get train by number
   */
  public getTrainByNumber(trainNumber: string): Train | undefined {
    return this.trainRepo.findByTrainNumber(trainNumber);
  }

  /**
   * Get train by ID
   */
  public getTrainById(trainId: string): Train | undefined {
    return this.trainRepo.findById(trainId);
  }

  /**
   * Search trains by route and date
   */
  public searchTrains(sourceCode: string, destCode: string, date: Date): Train[] {
    const trains = this.trainRepo.searchTrains(sourceCode, destCode, date);

    if (trains.length === 0) {
      Logger.warn(`No trains found from ${sourceCode} to ${destCode} on ${date.toDateString()}`);
    }

    return trains;
  }

  /**
   * Get available seats for a train on a date
   */
  public getAvailableSeats(trainId: string, coachType: CoachType, date: Date): number {
    const train = this.trainRepo.findById(trainId);

    if (!train) {
      return 0;
    }

    return train.getAvailableSeats(coachType, date);
  }

  /**
   * Calculate fare
   */
  public calculateFare(trainId: string, coachType: CoachType, sourceCode: string, destCode: string): number {
    const train = this.trainRepo.findById(trainId);

    if (!train || !train.schedule) {
      return 0;
    }

    const distance = train.schedule.getDistanceBetween(sourceCode, destCode);
    return train.calculateFare(coachType, distance);
  }

  /**
   * Get all trains
   */
  public getAllTrains(): Train[] {
    return this.trainRepo.findAll();
  }

  /**
   * Display train details
   */
  public displayTrainDetails(train: Train): void {
    console.log('\n' + '='.repeat(80));
    console.log(`TRAIN DETAILS: ${train.trainNumber} - ${train.trainName}`);
    console.log('='.repeat(80));
    console.log(`Type: ${train.trainType}`);
    console.log(`Route: ${train.source.stationCode} → ${train.destination.stationCode}`);

    if (train.schedule) {
      console.log('\nRoute Stations:');
      train.schedule.route.forEach(rs => {
        console.log(`  ${rs.getDisplayInfo()}`);
      });
    }

    console.log('\nAvailable Coach Types:');
    const coachTypes = train.getAvailableCoachTypes();
    coachTypes.forEach(type => {
      const totalSeats = train.getTotalSeats(type);
      console.log(`  ${type}: ${totalSeats} seats`);
    });

    console.log('='.repeat(80) + '\n');
  }
}
