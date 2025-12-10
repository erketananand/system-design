import { User } from '../models/User';
import { Item } from '../models/Item';
import { Interaction } from '../models/Interaction';

export class InMemoryDatabase {
  private static instance: InMemoryDatabase;

  // Storage maps
  public users: Map<string, User> = new Map();
  public items: Map<string, Item> = new Map();
  public interactions: Map<string, Interaction> = new Map();

  private constructor() {
    console.log('[DATABASE] In-Memory Database initialized');
  }

  public static getInstance(): InMemoryDatabase {
    if (!InMemoryDatabase.instance) {
      InMemoryDatabase.instance = new InMemoryDatabase();
    }
    return InMemoryDatabase.instance;
  }

  public clearAll(): void {
    this.users.clear();
    this.items.clear();
    this.interactions.clear();
    console.log('[DATABASE] All data cleared');
  }

  public getStats(): Record<string, number> {
    return {
      users: this.users.size,
      items: this.items.size,
      interactions: this.interactions.size,
    };
  }

  public printStats(): void {
    const stats = this.getStats();
    console.log('\n[DATABASE STATS]');
    console.log(`  Users: ${stats.users}`);
    console.log(`  Items: ${stats.items}`);
    console.log(`  Interactions: ${stats.interactions}`);
  }

  public exportData(): {
    users: User[];
    items: Item[];
    interactions: Interaction[];
  } {
    return {
      users: Array.from(this.users.values()),
      items: Array.from(this.items.values()),
      interactions: Array.from(this.interactions.values()),
    };
  }

  public getTotalRecords(): number {
    return this.users.size + this.items.size + this.interactions.size;
  }
}