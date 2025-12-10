import { Interaction } from '../models/Interaction';
import { InteractionType } from '../enums/InteractionType';

export class InteractionFactory {
  public static create(
    userId: string,
    itemId: string,
    type: InteractionType,
    weight?: number,
    metadata?: Map<string, string>
  ): Interaction {
    return new Interaction(userId, itemId, type, weight, metadata);
  }

  public static createView(userId: string, itemId: string): Interaction {
    return this.create(userId, itemId, InteractionType.VIEW, 1.0);
  }

  public static createClick(userId: string, itemId: string): Interaction {
    return this.create(userId, itemId, InteractionType.CLICK, 1.0);
  }

  public static createLike(userId: string, itemId: string): Interaction {
    return this.create(userId, itemId, InteractionType.LIKE, 1.0);
  }

  public static createDislike(userId: string, itemId: string): Interaction {
    return this.create(userId, itemId, InteractionType.DISLIKE, 1.0);
  }

  public static createRating(userId: string, itemId: string, rating: number): Interaction {
    if (rating < 0 || rating > 5) {
      throw new Error('Rating must be between 0 and 5');
    }
    return this.create(userId, itemId, InteractionType.RATING, rating);
  }

  public static createPurchase(userId: string, itemId: string): Interaction {
    return this.create(userId, itemId, InteractionType.PURCHASE, 1.0);
  }
}