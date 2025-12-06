export class IdGenerator {
  private static counter = 0;

  /**
   * Generate a UUID-like unique identifier
   */
  static generateUUID(): string {
    this.counter++;
    return `${Date.now()}-${this.counter}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a prefixed ID
   * @param prefix - Prefix for the ID (e.g., 'USER', 'TRAIN')
   */
  static generateId(prefix: string = 'ID'): string {
    this.counter++;
    return `${prefix}-${Date.now()}-${this.counter}`;
  }

  /**
   * Generate a 10-digit PNR number
   */
  static generatePNR(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return timestamp + random;
  }

  /**
   * Generate a transaction ID for payments
   */
  static generateTransactionId(): string {
    const prefix = 'TXN';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Reset counter (useful for testing)
   */
  static resetCounter(): void {
    this.counter = 0;
  }
}
