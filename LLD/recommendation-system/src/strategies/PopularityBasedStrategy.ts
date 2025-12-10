import { IRecommendationStrategy } from './IRecommendationStrategy';
import { Recommendation } from '../models/Recommendation';
import { InteractionRepository } from '../repositories/InteractionRepository';
import { ItemRepository } from '../repositories/ItemRepository';

export class PopularityBasedStrategy implements IRecommendationStrategy {
  constructor(
    private interactionRepo: InteractionRepository,
    private itemRepo: ItemRepository
  ) {}

  public getName(): string {
    return 'POPULARITY';
  }

  public recommend(userId: string, topN: number, filters?: Map<string, string>): Recommendation[] {
    // Calculate item popularity scores
    const itemPopularity = this.computeItemPopularity();

    // Get user's interacted items to exclude
    const userInteractions = this.interactionRepo.findByUserId(userId);
    const interactedItemIds = new Set(userInteractions.map(i => i.itemId));

    // Get candidate items
    let candidateItems = Array.from(itemPopularity.keys()).filter(
      itemId => !interactedItemIds.has(itemId)
    );

    // Apply filters if provided
    if (filters && filters.size > 0) {
      candidateItems = candidateItems.filter(itemId => {
        const item = this.itemRepo.findById(itemId);
        if (!item) return false;

        for (const [key, value] of filters.entries()) {
          if (item.getAttribute(key) !== value) {
            return false;
          }
        }
        return true;
      });
    }

    // Normalize scores and create recommendations
    const maxPopularity = Math.max(...Array.from(itemPopularity.values()));
    const recommendations = candidateItems
      .map(itemId => {
        const popularity = itemPopularity.get(itemId) || 0;
        const normalizedScore = maxPopularity > 0 ? popularity / maxPopularity : 0;
        return new Recommendation(userId, itemId, normalizedScore, this.getName());
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);

    return recommendations;
  }

  private computeItemPopularity(): Map<string, number> {
    const popularity = new Map<string, number>();
    const allInteractions = this.interactionRepo.findAll();

    // Aggregate weighted scores per item
    allInteractions.forEach(interaction => {
      const score = interaction.getScore();
      const currentScore = popularity.get(interaction.itemId) || 0;
      popularity.set(interaction.itemId, currentScore + score);
    });

    return popularity;
  }
}