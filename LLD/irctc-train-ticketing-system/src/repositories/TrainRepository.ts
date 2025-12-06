import { IRepository } from './IRepository';
import { Train } from '../models/Train';
import { InMemoryDatabase } from '../database/InMemoryDatabase';

export class TrainRepository implements IRepository<Train> {
  private db = InMemoryDatabase.getInstance();

  findById(id: string): Train | undefined {
    return this.db.trains.get(id);
  }

  findAll(): Train[] {
    return Array.from(this.db.trains.values());
  }

  save(train: Train): Train {
    this.db.addTrain(train);
    return train;
  }

  delete(id: string): boolean {
    return this.db.trains.delete(id);
  }

  exists(id: string): boolean {
    return this.db.trains.has(id);
  }

  count(): number {
    return this.db.trains.size;
  }

  clear(): void {
    this.db.trains.clear();
  }

  // Custom query methods

  findByTrainNumber(trainNumber: string): Train | undefined {
    return this.db.trainsByNumber.get(trainNumber);
  }

  existsByTrainNumber(trainNumber: string): boolean {
    return this.db.trainsByNumber.has(trainNumber);
  }

  findBySourceAndDestination(sourceCode: string, destCode: string): Train[] {
    return this.findAll().filter(t => 
      t.source.stationCode === sourceCode &&
      t.destination.stationCode === destCode
    );
  }

  searchTrains(sourceCode: string, destCode: string, date: Date): Train[] {
    return this.findAll().filter(t => {
      // Check if train operates on this route
      const matchesRoute = t.source.stationCode === sourceCode &&
                           t.destination.stationCode === destCode;

      // Check if train operates on this date
      const operatesOnDate = t.isOperatingOn(date);

      return matchesRoute && operatesOnDate;
    });
  }

  findByTrainType(trainType: string): Train[] {
    return this.findAll().filter(t => t.trainType === trainType);
  }
}
