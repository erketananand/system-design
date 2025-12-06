import { StationService } from './StationService';
import { TrainService } from './TrainService';
import { TrainSchedule } from '../models/TrainSchedule';
import { RouteStation } from '../models/RouteStation';
import { TrainType } from '../enums/TrainType';
import { CoachType } from '../enums/CoachType';
import { DayOfWeek } from '../enums/DayOfWeek';
import { Logger } from '../utils/Logger';

export class SetupService {
  private stationService = new StationService();
  private trainService = new TrainService();

  /**
   * Initialize system with sample data
   */
  public initializeSystem(): void {
    Logger.header('INITIALIZING IRCTC SYSTEM');

    this.setupStations();
    this.setupTrains();

    Logger.success('System initialization complete!');
    Logger.separator();
  }

  /**
   * Setup sample stations
   */
  private setupStations(): void {
    console.log('Setting up stations...');

    this.stationService.addStation('NDLS', 'New Delhi', 'Delhi', 'Delhi', 16);
    this.stationService.addStation('BCT', 'Mumbai Central', 'Mumbai', 'Maharashtra', 12);
    this.stationService.addStation('MAS', 'Chennai Central', 'Chennai', 'Tamil Nadu', 10);
    this.stationService.addStation('HWH', 'Howrah Junction', 'Kolkata', 'West Bengal', 23);
    this.stationService.addStation('BLR', 'Bangalore City', 'Bangalore', 'Karnataka', 8);
    this.stationService.addStation('JP', 'Jaipur Junction', 'Jaipur', 'Rajasthan', 6);
    this.stationService.addStation('AGC', 'Agra Cantt', 'Agra', 'Uttar Pradesh', 5);
    this.stationService.addStation('PUNE', 'Pune Junction', 'Pune', 'Maharashtra', 7);

    console.log(`✓ ${this.stationService.getStationCount()} stations added\n`);
  }

  /**
   * Setup sample trains
   */
  private setupTrains(): void {
    console.log('Setting up trains...');

    // Train 1: Rajdhani Express (Delhi to Mumbai)
    const delhiStation = this.stationService.getStationByCode('NDLS')!;
    const mumbaiStation = this.stationService.getStationByCode('BCT')!;

    const train1 = this.trainService.addTrain(
      '12951',
      'Mumbai Rajdhani Express',
      delhiStation,
      mumbaiStation,
      TrainType.RAJDHANI
    );

    if (train1) {
      // Add coaches
      this.trainService.addCoachToTrain(train1.id, 'A1', CoachType.FIRST_AC, 24);
      this.trainService.addCoachToTrain(train1.id, 'B1', CoachType.SECOND_AC, 48);
      this.trainService.addCoachToTrain(train1.id, 'B2', CoachType.SECOND_AC, 48);
      this.trainService.addCoachToTrain(train1.id, 'C1', CoachType.THIRD_AC, 64);

      // Setup schedule
      const route1 = [
        new RouteStation(delhiStation, 1, 0, null, '16:30', 1),
        new RouteStation(mumbaiStation, 2, 1384, '08:35', null, 1)
      ];

      const schedule1 = new TrainSchedule(
        train1.id,
        route1,
        [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY],
        new Date('2024-01-01')
      );

      this.trainService.setTrainSchedule(train1.id, schedule1);
    }

    // Train 2: Shatabdi Express (Delhi to Agra)
    const agraStation = this.stationService.getStationByCode('AGC')!;

    const train2 = this.trainService.addTrain(
      '12002',
      'Bhopal Shatabdi',
      delhiStation,
      agraStation,
      TrainType.SHATABDI
    );

    if (train2) {
      this.trainService.addCoachToTrain(train2.id, 'CC1', CoachType.AC_CHAIR_CAR, 78);
      this.trainService.addCoachToTrain(train2.id, 'CC2', CoachType.AC_CHAIR_CAR, 78);

      const route2 = [
        new RouteStation(delhiStation, 1, 0, null, '06:00', 1),
        new RouteStation(agraStation, 2, 195, '08:30', null, 1)
      ];

      const schedule2 = new TrainSchedule(
        train2.id,
        route2,
        [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY],
        new Date('2024-01-01')
      );

      this.trainService.setTrainSchedule(train2.id, schedule2);
    }

    console.log(`✓ ${this.trainService.getAllTrains().length} trains added\n`);
  }

  /**
   * Display system summary
   */
  public displaySystemSummary(): void {
    Logger.header('SYSTEM SUMMARY');

    console.log(`Total Stations: ${this.stationService.getStationCount()}`);
    console.log(`Total Trains: ${this.trainService.getAllTrains().length}`);

    Logger.separator();
  }
}
