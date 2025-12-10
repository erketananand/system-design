import { IdGenerator } from '../utils/IdGenerator';
import { UserRole } from '../enums/UserRole';
import { AccountTier } from '../enums/AccountTier';
import { UserPreference } from './UserPreference';

export class User {
  public readonly id: string;
  public name: string;
  public email: string;
  public phone: string;
  public passwordHash: string;
  public roles: UserRole[];
  public accountTier: AccountTier;
  public preferences: UserPreference | null;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(
    name: string,
    email: string,
    phone: string,
    passwordHash: string,
    roles: UserRole[],
    accountTier: AccountTier = AccountTier.STANDARD,
    id?: string
  ) {
    this.id = id || IdGenerator.generateUserId();
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.passwordHash = passwordHash;
    this.roles = roles;
    this.accountTier = accountTier;
    this.preferences = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  public updateProfile(name: string, phone: string): void {
    this.name = name;
    this.phone = phone;
    this.update();
  }

  public setPreferences(prefs: UserPreference): void {
    this.preferences = prefs;
    this.update();
  }

  public isOwner(): boolean {
    return this.roles.includes(UserRole.OWNER);
  }

  public isSeeker(): boolean {
    return this.roles.includes(UserRole.SEEKER);
  }

  public addRole(role: UserRole): void {
    if (!this.roles.includes(role)) {
      this.roles.push(role);
      this.update();
    }
  }

  public upgradeTier(newTier: AccountTier): void {
    this.accountTier = newTier;
    this.update();
  }

  public isPremium(): boolean {
    return this.accountTier === AccountTier.PREMIUM;
  }

  private update(): void {
    this.updatedAt = new Date();
  }
}
