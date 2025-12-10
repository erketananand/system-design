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
  public findByName(name: string): User[] {
    return Array.from(this.db.users.values()).filter(
      user => user.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  public findByAttribute(key: string, value: string): User[] {
    return Array.from(this.db.users.values()).filter(
      user => user.getAttribute(key) === value
    );
  }

  public findUsersWithAttributes(): User[] {
    return Array.from(this.db.users.values()).filter(
      user => user.getAttributeCount() > 0
    );
  }
}