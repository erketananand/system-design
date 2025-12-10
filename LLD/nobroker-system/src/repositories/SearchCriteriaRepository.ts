import { IRepository } from './IRepository';
import { SearchCriteria } from '../models/SearchCriteria';
import { InMemoryDatabase } from '../database/InMemoryDatabase';

export class SearchCriteriaRepository implements IRepository<SearchCriteria> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): SearchCriteria | undefined {
    return this.db.searchCriteria.get(id);
  }

  public findAll(): SearchCriteria[] {
    return Array.from(this.db.searchCriteria.values());
  }

  public save(entity: SearchCriteria): SearchCriteria {
    this.db.searchCriteria.set(entity.id, entity);
    return entity;
  }

  public delete(id: string): boolean {
    return this.db.searchCriteria.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.searchCriteria.has(id);
  }

  public count(): number {
    return this.db.searchCriteria.size;
  }

  public clear(): void {
    this.db.searchCriteria.clear();
  }

  // Custom query methods
  public findByUser(userId: string): SearchCriteria[] {
    return Array.from(this.db.searchCriteria.values()).filter(s => s.userId === userId);
  }

  public findByName(userId: string, name: string): SearchCriteria | undefined {
    return Array.from(this.db.searchCriteria.values()).find(
      s => s.userId === userId && s.name.toLowerCase() === name.toLowerCase()
    );
  }
}
