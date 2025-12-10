import { IRepository } from './IRepository';
import { SavedSearchAlert } from '../models/SavedSearchAlert';
import { InMemoryDatabase } from '../database/InMemoryDatabase';
import { AlertFrequency } from '../enums/AlertFrequency';

export class SavedSearchAlertRepository implements IRepository<SavedSearchAlert> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): SavedSearchAlert | undefined {
    return this.db.savedSearchAlerts.get(id);
  }

  public findAll(): SavedSearchAlert[] {
    return Array.from(this.db.savedSearchAlerts.values());
  }

  public save(entity: SavedSearchAlert): SavedSearchAlert {
    this.db.savedSearchAlerts.set(entity.id, entity);
    return entity;
  }

  public delete(id: string): boolean {
    return this.db.savedSearchAlerts.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.savedSearchAlerts.has(id);
  }

  public count(): number {
    return this.db.savedSearchAlerts.size;
  }

  public clear(): void {
    this.db.savedSearchAlerts.clear();
  }

  // Custom query methods
  public findByUser(userId: string): SavedSearchAlert[] {
    return Array.from(this.db.savedSearchAlerts.values()).filter(a => a.userId === userId);
  }

  public findActiveAlerts(): SavedSearchAlert[] {
    return Array.from(this.db.savedSearchAlerts.values()).filter(a => a.active);
  }

  public findByFrequency(frequency: AlertFrequency): SavedSearchAlert[] {
    return Array.from(this.db.savedSearchAlerts.values()).filter(a => a.frequency === frequency);
  }

  public findBySearchCriteria(searchCriteriaId: string): SavedSearchAlert[] {
    return Array.from(this.db.savedSearchAlerts.values()).filter(
      a => a.searchCriteriaId === searchCriteriaId
    );
  }

  public findInstantAlerts(): SavedSearchAlert[] {
    return Array.from(this.db.savedSearchAlerts.values()).filter(
      a => a.active && a.frequency === AlertFrequency.INSTANT
    );
  }
}
