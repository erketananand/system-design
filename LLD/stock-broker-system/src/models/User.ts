import { IdGenerator } from '../utils/IdGenerator';

export class User {
  public readonly id: string;
  public name: string;
  public email: string;
  public pan: string;
  public bankAccountNumber: string;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(
    name: string,
    email: string,
    pan: string,
    bankAccountNumber: string,
    id?: string
  ) {
    this.id = id || IdGenerator.generateId('USER');
    this.name = name;
    this.email = email;
    this.pan = pan.toUpperCase();
    this.bankAccountNumber = bankAccountNumber;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Update user profile information
   */
  public updateProfile(name?: string, email?: string, bankAccountNumber?: string): void {
    if (name) this.name = name;
    if (email) this.email = email;
    if (bankAccountNumber) this.bankAccountNumber = bankAccountNumber;
    this.updatedAt = new Date();
  }

  /**
   * Get masked bank account number for display
   */
  public getMaskedBankAccount(): string {
    const length = this.bankAccountNumber.length;
    if (length <= 4) return this.bankAccountNumber;
    const lastFour = this.bankAccountNumber.slice(-4);
    return `${'*'.repeat(length - 4)}${lastFour}`;
  }

  /**
   * Validate PAN format (basic validation)
   */
  public isValidPAN(): boolean {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(this.pan);
  }

  /**
   * Get user summary
   */
  public getSummary(): string {
    return `${this.name} (${this.email}) - PAN: ${this.pan}`;
  }
}
