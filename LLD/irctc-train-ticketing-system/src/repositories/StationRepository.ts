import { IRepository } from './IRepository';
import { Station } from '../models/Station';
import { InMemoryDatabase } from '../database/InMemoryDatabase';

export class StationRepository implements IRepository<Station> {
  private db = InMemoryDatabase.getInstance();

  findById(id: string): Station | undefined {
    return this.db.stations.get(id);
  }

  findAll(): Station[] {
    return Array.from(this.db.stations.values());
  }

  save(station: Station): Station {
    this.db.addStation(station);
    return station;
  }

  delete(id: string): boolean {
    return this.db.stations.delete(id);
  }

  exists(id: string): boolean {
    return this.db.stations.has(id);
  }

  count(): number {
    return this.db.stations.size;
  }

  clear(): void {
    this.db.stations.clear();
  }

  // Custom query methods

  findByCode(stationCode: string): Station | undefined {
    return this.db.stationsByCode.get(stationCode.toUpperCase());
  }

  existsByCode(stationCode: string): boolean {
    return this.db.stationsByCode.has(stationCode.toUpperCase());
  }

  findByCity(city: string): Station[] {
    return this.findAll().filter(s => 
      s.city.toLowerCase().includes(city.toLowerCase())
    );
  }

  findByState(state: string): Station[] {
    return this.findAll().filter(s => 
      s.state.toLowerCase() === state.toLowerCase()
    );
  }

  searchByName(searchTerm: string): Station[] {
    const term = searchTerm.toLowerCase();
    return this.findAll().filter(s => 
      s.stationName.toLowerCase().includes(term) ||
      s.stationCode.toLowerCase().includes(term) ||
      s.city.toLowerCase().includes(term)
    );
  }
}
