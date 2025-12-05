/**
 * IdGenerator.ts
 * Utility class for generating unique IDs for entities
 */

export class IdGenerator {
  private static counters: Map<string, number> = new Map();

  /**
   * Generate a unique ID with the given prefix
   * @param prefix - Prefix for the ID (e.g., 'GAME', 'PLAYER', 'MOVE')
   * @returns Unique ID string (e.g., 'GAME-001')
   */
  public static generateId(prefix: string): string {
    const currentCount = this.counters.get(prefix) || 0;
    const newCount = currentCount + 1;
    this.counters.set(prefix, newCount);

    // Pad with zeros to make it 3 digits
    const paddedCount = String(newCount).padStart(3, '0');
    return `${prefix}-${paddedCount}`;
  }

  /**
   * Reset all counters (useful for testing)
   */
  public static reset(): void {
    this.counters.clear();
  }

  /**
   * Reset counter for a specific prefix
   * @param prefix - Prefix to reset
   */
  public static resetPrefix(prefix: string): void {
    this.counters.delete(prefix);
  }

  /**
   * Get current count for a prefix
   * @param prefix - Prefix to query
   * @returns Current count
   */
  public static getCurrentCount(prefix: string): number {
    return this.counters.get(prefix) || 0;
  }
}
