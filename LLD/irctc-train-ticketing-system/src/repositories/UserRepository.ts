import { IRepository } from './IRepository';
import { User } from '../models/User';
import { InMemoryDatabase } from '../database/InMemoryDatabase';

export class UserRepository implements IRepository<User> {
  private db = InMemoryDatabase.getInstance();

  findById(id: string): User | undefined {
    return this.db.users.get(id);
  }

  findAll(): User[] {
    return Array.from(this.db.users.values());
  }

  save(user: User): User {
    this.db.addUser(user);
    return user;
  }

  delete(id: string): boolean {
    return this.db.users.delete(id);
  }

  exists(id: string): boolean {
    return this.db.users.has(id);
  }

  count(): number {
    return this.db.users.size;
  }

  clear(): void {
    this.db.users.clear();
  }

  // Custom query methods

  findByEmail(email: string): User | undefined {
    return this.db.usersByEmail.get(email);
  }

  findByPhone(phone: string): User | undefined {
    return this.db.usersByPhone.get(phone);
  }

  existsByEmail(email: string): boolean {
    return this.db.usersByEmail.has(email);
  }

  existsByPhone(phone: string): boolean {
    return this.db.usersByPhone.has(phone);
  }

  authenticate(email: string, password: string): User | null {
    const user = this.findByEmail(email);
    if (user && user.verifyPassword(password)) {
      return user;
    }
    return null;
  }
}
