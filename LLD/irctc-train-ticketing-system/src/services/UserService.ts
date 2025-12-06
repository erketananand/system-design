import { User } from '../models/User';
import { UserRepository } from '../repositories/UserRepository';
import { Logger } from '../utils/Logger';

export class UserService {
  private userRepo = new UserRepository();

  /**
   * Register a new user
   */
  public register(
    name: string,
    email: string,
    phone: string,
    password: string,
    dateOfBirth?: Date
  ): User | null {
    // Check if email already exists
    if (this.userRepo.existsByEmail(email)) {
      Logger.error(`Email ${email} is already registered.`);
      return null;
    }

    // Check if phone already exists
    if (this.userRepo.existsByPhone(phone)) {
      Logger.error(`Phone ${phone} is already registered.`);
      return null;
    }

    // Create and save user
    const user = new User(name, email, phone, password, dateOfBirth || null);

    if (!user.isValid()) {
      Logger.error('Invalid user data.');
      return null;
    }

    this.userRepo.save(user);
    Logger.success(`User registered successfully: ${email}`);
    return user;
  }

  /**
   * Login user
   */
  public login(email: string, password: string): User | null {
    const user = this.userRepo.authenticate(email, password);

    if (user) {
      Logger.success(`User logged in: ${email}`);
      return user;
    } else {
      Logger.error('Invalid email or password.');
      return null;
    }
  }

  /**
   * Get user by ID
   */
  public getUserById(userId: string): User | undefined {
    return this.userRepo.findById(userId);
  }

  /**
   * Get user by email
   */
  public getUserByEmail(email: string): User | undefined {
    return this.userRepo.findByEmail(email);
  }

  /**
   * Update user profile
   */
  public updateProfile(userId: string, name: string, email: string, phone: string): boolean {
    const user = this.userRepo.findById(userId);

    if (!user) {
      Logger.error('User not found.');
      return false;
    }

    // Check if new email is already taken by another user
    const existingUserWithEmail = this.userRepo.findByEmail(email);
    if (existingUserWithEmail && existingUserWithEmail.id !== userId) {
      Logger.error('Email is already taken by another user.');
      return false;
    }

    // Check if new phone is already taken by another user
    const existingUserWithPhone = this.userRepo.findByPhone(phone);
    if (existingUserWithPhone && existingUserWithPhone.id !== userId) {
      Logger.error('Phone is already taken by another user.');
      return false;
    }

    user.updateProfile(name, email, phone);
    this.userRepo.save(user);
    Logger.success('Profile updated successfully.');
    return true;
  }

  /**
   * Get all users (admin function)
   */
  public getAllUsers(): User[] {
    return this.userRepo.findAll();
  }

  /**
   * Get total user count
   */
  public getUserCount(): number {
    return this.userRepo.count();
  }
}
