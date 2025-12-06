import { IdGenerator } from '../utils/IdGenerator';

export class User {
  public readonly id: string;
  public name: string;
  public email: string;
  public phone: string;
  private passwordHash: string;
  public dateOfBirth: Date | null;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(
    name: string,
    email: string,
    phone: string,
    password: string,
    dateOfBirth: Date | null = null,
    id?: string
  ) {
    this.id = id || IdGenerator.generateUUID();
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.passwordHash = this.hashPassword(password);
    this.dateOfBirth = dateOfBirth;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Hash password (simple implementation for demo)
   */
  private hashPassword(password: string): string {
    // In production, use bcrypt or similar
    return Buffer.from(password).toString('base64');
  }

  /**
   * Verify password
   */
  public verifyPassword(password: string): boolean {
    return this.passwordHash === this.hashPassword(password);
  }

  /**
   * Update profile information
   */
  public updateProfile(name: string, email: string, phone: string): void {
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.update();
  }

  /**
   * Get user age
   */
  public getAge(): number | null {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Validate user data
   */
  public isValid(): boolean {
    return (
      this.name.length > 0 &&
      this.email.includes('@') &&
      this.phone.length >= 10
    );
  }

  /**
   * Update timestamp
   */
  public update(): void {
    this.updatedAt = new Date();
  }
}
