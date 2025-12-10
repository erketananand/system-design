import { IdGenerator } from '../utils/IdGenerator';

export class Recommendation {
  public readonly id: string;
  public readonly userId: string;
  public readonly itemId: string;
  public readonly score: number;
  public readonly strategyName: string;
  public readonly generatedAt: Date;

  constructor(
    userId: string,
    itemId: string,
    score: number,
    strategyName: string,
    id?: string
  ) {
    this.id = id || IdGenerator.generateUUID();
    this.userId = userId;
    this.itemId = itemId;
    this.score = this.validateScore(score);
    this.strategyName = strategyName;
    this.generatedAt = new Date();
  }

  private validateScore(score: number): number {
    if (score < 0 || score > 1.0) {
      throw new Error('Score must be between 0 and 1.0');
    }
    return score;
  }

  public getKey(): string {
    return `${this.userId}-${this.itemId}-${this.strategyName}`;
  }

  public isHighConfidence(): boolean {
    return this.score >= 0.7;
  }

  public isMediumConfidence(): boolean {
    return this.score >= 0.4 && this.score < 0.7;
  }

  public isLowConfidence(): boolean {
    return this.score < 0.4;
  }
}