import { IRepository } from './IRepository';
import { User } from '../models/User';
import { InMemoryDatabase } from '../database/InMemoryDatabase';
import { UserRole } from '../enums/UserRole';
import { AccountTier } from '../enums/AccountTier';

export class UserRepository implements IRepository<User> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): User | undefined {
    return this.db.users.get(id);
  }

  public findAll(): User[] {
    return Array.from(this.db.users.values());
  }

  public save(entity: User): User {
    this.db.users.set(entity.id, entity);
    return entity;
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

  public findByPhone(phone: string): User | undefined {
    return Array.from(this.db.users.values()).find(u => u.phone === phone);
  }

  public findByRole(role: UserRole): User[] {
    return Array.from(this.db.users.values()).filter(u => u.roles.includes(role));
  }

  public findByAccountTier(tier: AccountTier): User[] {
    return Array.from(this.db.users.values()).filter(u => u.accountTier === tier);
  }

  public findOwners(): User[] {
    return this.findByRole(UserRole.OWNER);
  }

  public findSeekers(): User[] {
    return this.findByRole(UserRole.SEEKER);
  }

  public findPremiumUsers(): User[] {
    return this.findByAccountTier(AccountTier.PREMIUM);
  }
}
