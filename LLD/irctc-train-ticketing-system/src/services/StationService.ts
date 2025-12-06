import { Station } from '../models/Station';
import { StationRepository } from '../repositories/StationRepository';
import { Logger } from '../utils/Logger';

export class StationService {
  private stationRepo = new StationRepository();

  /**
   * Add a new station
   */
  public addStation(
    stationCode: string,
    stationName: string,
    city: string,
    state: string,
    platformCount: number = 1
  ): Station | null {
    if (this.stationRepo.existsByCode(stationCode)) {
      Logger.error(`Station with code ${stationCode} already exists.`);
      return null;
    }

    const station = new Station(stationCode, stationName, city, state, platformCount);

    if (!station.isValid()) {
      Logger.error('Invalid station data.');
      return null;
    }

    this.stationRepo.save(station);
    Logger.success(`Station added: ${stationCode} - ${stationName}`);
    return station;
  }

  /**
   * Get station by code
   */
  public getStationByCode(stationCode: string): Station | undefined {
    return this.stationRepo.findByCode(stationCode);
  }

  /**
   * Get station by ID
   */
  public getStationById(stationId: string): Station | undefined {
    return this.stationRepo.findById(stationId);
  }

  /**
   * Search stations
   */
  public searchStations(searchTerm: string): Station[] {
    return this.stationRepo.searchByName(searchTerm);
  }

  /**
   * Get all stations
   */
  public getAllStations(): Station[] {
    return this.stationRepo.findAll();
  }

  /**
   * Get stations by city
   */
  public getStationsByCity(city: string): Station[] {
    return this.stationRepo.findByCity(city);
  }

  /**
   * Get total station count
   */
  public getStationCount(): number {
    return this.stationRepo.count();
  }

  /**
   * Display all stations
   */
  public displayAllStations(): void {
    const stations = this.getAllStations();

    if (stations.length === 0) {
      console.log('No stations available.');
      return;
    }

    console.log('\n' + '='.repeat(80));
    console.log('AVAILABLE STATIONS');
    console.log('='.repeat(80));
    console.log('Code'.padEnd(8) + 'Name'.padEnd(35) + 'City'.padEnd(20) + 'State');
    console.log('-'.repeat(80));

    stations.forEach(station => {
      console.log(
        station.stationCode.padEnd(8) +
        station.stationName.padEnd(35) +
        station.city.padEnd(20) +
        station.state
      );
    });

    console.log('='.repeat(80) + '\n');
  }
}
