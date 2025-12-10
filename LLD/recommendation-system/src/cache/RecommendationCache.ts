import { Recommendation } from '../models/Recommendation';

export class RecommendationCache {
  private cache: Map<string, { recommendations: Recommendation[]; timestamp: number }> = new Map();
  private ttlInMillis: number;

  constructor(ttlInMillis: number = 300000) { // Default 5 minutes
    this.ttlInMillis = ttlInMillis;
  }

  public get(key: string): Recommendation[] | undefined {
    const cached = this.cache.get(key);

    if (!cached) {
      return undefined;
    }

    // Check if expired
    const now = Date.now();
    if (now - cached.timestamp > this.ttlInMillis) {
      this.cache.delete(key);
      return undefined;
    }

    return cached.recommendations;
  }

  public set(key: string, recommendations: Recommendation[]): void {
    this.cache.set(key, {
      recommendations,
      timestamp: Date.now()
    });
  }

  public invalidate(key: string): void {
    this.cache.delete(key);
  }

  public invalidateForUser(userId: string): void {
    const keysToDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  public invalidateAll(): void {
    this.cache.clear();
  }

  public buildKey(userId: string, strategyName: string): string {
    return `${userId}:${strategyName}`;
  }

  public getSize(): number {
    return this.cache.size;
  }

  public cleanupExpired(): number {
    const now = Date.now();
    let removed = 0;

    const keysToDelete: string[] = [];
    this.cache.forEach((value, key) => {
      if (now - value.timestamp > this.ttlInMillis) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      removed++;
    });

    return removed;
  }
}