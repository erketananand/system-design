import { IdGenerator } from '../utils/IdGenerator';
import { InteractionType } from '../enums/InteractionType';

export class Interaction {
  public readonly id: string;
  public readonly userId: string;
  public readonly itemId: string;
  public readonly type: InteractionType;
  public weight: number;
  public readonly timestamp: Date;
  public metadata: Map<string, string>;

  constructor(
    userId: string,
    itemId: string,
    type: InteractionType,
    weight: number = 1.0,
    metadata?: Map<string, string>,
    id?: string
  ) {
    this.id = id || IdGenerator.generateUUID();
    this.userId = userId;
    this.itemId = itemId;
    this.type = type;
    this.weight = this.validateWeight(weight);
    this.timestamp = new Date();
    this.metadata = metadata || new Map<string, string>();
  }

  private validateWeight(weight: number): number {
    if (weight < 0 || weight > 5.0) {
      throw new Error('Weight must be between 0 and 5.0');
    }
    return weight;
  }

  public getKey(): string {
    return `${this.userId}-${this.itemId}-${this.type}`;
  }

  public setMetadata(key: string, value: string): void {
    this.metadata.set(key, value);
  }

  public getMetadata(key: string): string | undefined {
    return this.metadata.get(key);
  }

  public isRating(): boolean {
    return this.type === InteractionType.RATING;
  }

  public isPositive(): boolean {
    return this.type === InteractionType.LIKE || 
           this.type === InteractionType.PURCHASE ||
           (this.type === InteractionType.RATING && this.weight >= 3.0);
  }

  public isNegative(): boolean {
    return this.type === InteractionType.DISLIKE ||
           (this.type === InteractionType.RATING && this.weight < 3.0);
  }

  public getScore(): number {
    // Normalize different interaction types to a common score
    switch (this.type) {
      case InteractionType.VIEW:
        return 0.1;
      case InteractionType.CLICK:
        return 0.3;
      case InteractionType.LIKE:
        return 1.0;
      case InteractionType.DISLIKE:
        return -1.0;
      case InteractionType.RATING:
        return (this.weight / 5.0) * 2 - 1; // Normalize to -1 to 1
      case InteractionType.PURCHASE:
        return 2.0;
      default:
        return this.weight;
    }
  }
}