import { IRepository } from './IRepository';
import { Item } from '../models/Item';
import { InMemoryDatabase } from '../database/InMemoryDatabase';

export class ItemRepository implements IRepository<Item> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): Item | undefined {
    return this.db.items.get(id);
  }

  public findAll(): Item[] {
    return Array.from(this.db.items.values());
  }

  public save(item: Item): Item {
    this.db.items.set(item.id, item);
    return item;
  }

  public delete(id: string): boolean {
    return this.db.items.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.items.has(id);
  }

  public count(): number {
    return this.db.items.size;
  }

  public clear(): void {
    this.db.items.clear();
  }

  // Custom query methods
  public findByName(name: string): Item[] {
    return Array.from(this.db.items.values()).filter(
      item => item.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  public findByTag(tag: string): Item[] {
    return Array.from(this.db.items.values()).filter(
      item => item.hasTag(tag)
    );
  }

  public findByAttribute(key: string, value: string): Item[] {
    return Array.from(this.db.items.values()).filter(
      item => item.getAttribute(key) === value
    );
  }

  public findByTags(tags: string[]): Item[] {
    return Array.from(this.db.items.values()).filter(
      item => tags.some(tag => item.hasTag(tag))
    );
  }

  public findItemsWithTags(): Item[] {
    return Array.from(this.db.items.values()).filter(
      item => item.getTagCount() > 0
    );
  }
}