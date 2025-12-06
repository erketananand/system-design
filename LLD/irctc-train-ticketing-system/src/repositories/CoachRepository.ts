import { IRepository } from './IRepository';
import { Coach } from '../models/Coach';
import { InMemoryDatabase } from '../database/InMemoryDatabase';
import { CoachType } from '../enums/CoachType';

export class CoachRepository implements IRepository<Coach> {
  private db = InMemoryDatabase.getInstance();

  findById(id: string): Coach | undefined {
    return this.db.coaches.get(id);
  }

  findAll(): Coach[] {
    return Array.from(this.db.coaches.values());
  }

  save(coach: Coach): Coach {
    this.db.coaches.set(coach.id, coach);
    return coach;
  }

  delete(id: string): boolean {
    return this.db.coaches.delete(id);
  }

  exists(id: string): boolean {
    return this.db.coaches.has(id);
  }

  count(): number {
    return this.db.coaches.size;
  }

  clear(): void {
    this.db.coaches.clear();
  }

  // Custom query methods

  findByTrainId(trainId: string): Coach[] {
    return this.findAll().filter(c => c.trainId === trainId);
  }

  findByTrainAndType(trainId: string, coachType: CoachType): Coach[] {
    return this.findAll().filter(c => 
      c.trainId === trainId && c.coachType === coachType
    );
  }

  findByCoachNumber(trainId: string, coachNumber: string): Coach | undefined {
    return this.findAll().find(c => 
      c.trainId === trainId && c.coachNumber === coachNumber
    );
  }

  getTotalSeats(trainId: string, coachType: CoachType): number {
    const coaches = this.findByTrainAndType(trainId, coachType);
    return coaches.reduce((total, coach) => total + coach.totalSeats, 0);
  }
}
