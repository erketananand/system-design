export class IdGenerator {
  private static counter = 0;

  /**
   * Generates a UUID-like string
   * Format: timestamp-counter-random
   */
  static generateUUID(): string {
    this.counter++;
    return `${Date.now()}-${this.counter}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generates a custom ID with prefix
   * @param prefix - Prefix for the ID (e.g., 'USER', 'ORDER', 'TRADE')
   * @returns Formatted ID string
   */
  static generateId(prefix: string = 'ID'): string {
    this.counter++;
    return `${prefix}-${Date.now()}-${this.counter}`;
  }

  /**
   * Generates a numeric order ID
   * @returns Numeric string (e.g., '1234567890')
   */
  static generateOrderId(): string {
    this.counter++;
    return `${Date.now()}${this.counter.toString().padStart(4, '0')}`;
  }

  /**
   * Generates a trade ID
   * @returns Trade ID with TRD prefix
   */
  static generateTradeId(): string {
    return this.generateId('TRD');
  }

  /**
   * Generates a transaction ID
   * @returns Transaction ID with TXN prefix
   */
  static generateTransactionId(): string {
    return this.generateId('TXN');
  }

  /**
   * Generates a watchlist ID
   * @returns Watchlist ID with WL prefix
   */
  static generateWatchlistId(): string {
    return this.generateId('WL');
  }

  /**
   * Resets the counter (useful for testing)
   */
  static resetCounter(): void {
    this.counter = 0;
  }
}
