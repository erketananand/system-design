import { IRepository } from './IRepository';
import { User } from '../models/User';
import { InMemoryDatabase } from '../database/InMemoryDatabase';

export class UserRepository implements IRepository<User> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): User | undefined {
    return this.db.users.get(id);
  }

  public findAll(): User[] {
    return Array.from(this.db.users.values());
  }

  public save(user: User): User {
    this.db.users.set(user.id, user);
    return user;
  }

  public delete(id: string): boolean {
    return this.db.users.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.users.has(id);
  }

  public count(): number {
    return this.db.users.size;
  }

  public clear(): void {
    this.db.users.clear();
  }

  // Custom query methods
  public findByEmail(email: string): User | undefined {
    return Array.from(this.db.users.values()).find(u => u.email === email);
  }

  public findByTimezone(timezone: string): User[] {
    return Array.from(this.db.users.values()).filter(u => u.timezone === timezone);
  }

  public emailExists(email: string): boolean {
    return this.findByEmail(email) !== undefined;
  }
}
