import { User } from '../models/User';
import { UserPreference } from '../models/UserPreference';
import { UserRepository } from '../repositories/UserRepository';
import { UserRole } from '../enums/UserRole';
import { AccountTier } from '../enums/AccountTier';

export class UserService {
  private userRepo = new UserRepository();

  public registerUser(
    name: string,
    email: string,
    phone: string,
    password: string,
    roles: UserRole[]
  ): User {
    // Check if email already exists
    const existingUser = this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new Error(`User with email ${email} already exists`);
    }

    // Check if phone already exists
    const existingPhone = this.userRepo.findByPhone(phone);
    if (existingPhone) {
      throw new Error(`User with phone ${phone} already exists`);
    }

    // Simple password hashing (in real app, use bcrypt)
    const passwordHash = this.hashPassword(password);

    const user = new User(name, email, phone, passwordHash, roles);
    return this.userRepo.save(user);
  }

  public authenticate(email: string, password: string): User | null {
    const user = this.userRepo.findByEmail(email);
    if (!user) {
      return null;
    }

    const passwordHash = this.hashPassword(password);
    if (user.passwordHash === passwordHash) {
      return user;
    }

    return null;
  }

  public getUserById(userId: string): User | undefined {
    return this.userRepo.findById(userId);
  }

  public updateProfile(userId: string, name: string, phone: string): void {
    const user = this.userRepo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.updateProfile(name, phone);
    this.userRepo.save(user);
  }

  public setPreferences(userId: string, prefs: UserPreference): void {
    const user = this.userRepo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.setPreferences(prefs);
    this.userRepo.save(user);
  }

  public upgradeTier(userId: string, newTier: AccountTier): void {
    const user = this.userRepo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.upgradeTier(newTier);
    this.userRepo.save(user);
  }

  public addRole(userId: string, role: UserRole): void {
    const user = this.userRepo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.addRole(role);
    this.userRepo.save(user);
  }

  public getAllOwners(): User[] {
    return this.userRepo.findOwners();
  }

  public getAllSeekers(): User[] {
    return this.userRepo.findSeekers();
  }

  public getPremiumUsers(): User[] {
    return this.userRepo.findPremiumUsers();
  }

  private hashPassword(password: string): string {
    // Simple hash for demo (use bcrypt in production)
    return Buffer.from(password).toString('base64');
  }
}
