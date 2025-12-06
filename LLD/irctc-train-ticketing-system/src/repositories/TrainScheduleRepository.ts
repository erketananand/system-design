import { IRepository } from './IRepository';
import { TrainSchedule } from '../models/TrainSchedule';
import { InMemoryDatabase } from '../database/InMemoryDatabase';

export class TrainScheduleRepository implements IRepository<TrainSchedule> {
  private db = InMemoryDatabase.getInstance();

  findById(id: string): TrainSchedule | undefined {
    return this.db.trainSchedules.get(id);
  }

  findAll(): TrainSchedule[] {
    return Array.from(this.db.trainSchedules.values());
  }

  save(schedule: TrainSchedule): TrainSchedule {
    this.db.addTrainSchedule(schedule);
    return schedule;
  }

  delete(id: string): boolean {
    return this.db.trainSchedules.delete(id);
  }

  exists(id: string): boolean {
    return this.db.trainSchedules.has(id);
  }

  count(): number {
    return this.db.trainSchedules.size;
  }

  clear(): void {
    this.db.trainSchedules.clear();
  }

  // Custom query methods

  findByTrainId(trainId: string): TrainSchedule | undefined {
    return this.db.schedulesByTrainId.get(trainId);
  }

  findActiveSchedules(date: Date): TrainSchedule[] {
    return this.findAll().filter(s => s.isOperatingOn(date));
  }

  findByEffectiveDate(date: Date): TrainSchedule[] {
    return this.findAll().filter(s => {
      const withinStart = s.effectiveFrom <= date;
      const withinEnd = !s.effectiveTo || s.effectiveTo >= date;
      return withinStart && withinEnd;
    });
  }
}
