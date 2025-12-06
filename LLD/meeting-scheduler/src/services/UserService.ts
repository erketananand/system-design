import { User } from '../models/User';
import { Calendar } from '../models/Calendar';
import { UserRepository } from '../repositories/UserRepository';
import { CalendarRepository } from '../repositories/CalendarRepository';
import { Logger } from '../utils/Logger';

export class UserService {
  private userRepo = new UserRepository();
  private calendarRepo = new CalendarRepository();

  public createUser(name: string, email: string, timezone: string = 'UTC'): User {
    if (this.userRepo.emailExists(email)) {
      throw new Error(`User with email ${email} already exists`);
    }

    const user = new User(name, email, timezone);
    this.userRepo.save(user);

    // Create calendar for user
    const calendar = new Calendar(user.id);
    this.calendarRepo.save(calendar);

    Logger.success(`User created: ${user.name} (${user.id})`);
    return user;
  }

  public getUserById(id: string): User {
    const user = this.userRepo.findById(id);
    if (!user) {
      throw new Error(`User not found: ${id}`);
    }
    return user;
  }

  public getUserByEmail(email: string): User {
    const user = this.userRepo.findByEmail(email);
    if (!user) {
      throw new Error(`User not found with email: ${email}`);
    }
    return user;
  }

  public getAllUsers(): User[] {
    return this.userRepo.findAll();
  }

  public updateWorkingHours(userId: string, start: number, end: number): void {
    const user = this.getUserById(userId);
    user.updateWorkingHours(start, end);
    this.userRepo.save(user);
    Logger.info(`Working hours updated for ${user.name}`);
  }

  public deleteUser(userId: string): void {
    const user = this.getUserById(userId);
    this.userRepo.delete(userId);

    // Delete user's calendar
    const calendar = this.calendarRepo.findByUser(userId);
    if (calendar) {
      this.calendarRepo.delete(calendar.id);
    }

    Logger.info(`User deleted: ${user.name}`);
  }

  public getUserCount(): number {
    return this.userRepo.count();
  }
}
