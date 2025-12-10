import { IRecommendationStrategy } from './IRecommendationStrategy';
import { Recommendation } from '../models/Recommendation';

export class HybridStrategy implements IRecommendationStrategy {
  constructor(private strategies: IRecommendationStrategy[]) {
    if (strategies.length === 0) {
      throw new Error('HybridStrategy requires at least one strategy');
    }
  }

  public getName(): string {
    return 'HYBRID';
  }

  public recommend(userId: string, topN: number, filters?: Map<string, string>): Recommendation[] {
    // Collect recommendations from all strategies
    const allRecommendations: Recommendation[] = [];

    this.strategies.forEach(strategy => {
      const recommendations = strategy.recommend(userId, topN * 2, filters);
      allRecommendations.push(...recommendations);
    });

    if (allRecommendations.length === 0) {
      return [];
    }

    // Merge and rank recommendations
    const mergedRecommendations = this.mergeAndRank(allRecommendations, topN);

    return mergedRecommendations;
  }

  private mergeAndRank(recommendations: Recommendation[], topN: number): Recommendation[] {
    // Group by itemId
    const itemScores = new Map<string, number[]>();

    recommendations.forEach(rec => {
      if (!itemScores.has(rec.itemId)) {
        itemScores.set(rec.itemId, []);
      }
      itemScores.get(rec.itemId)!.push(rec.score);
    });

    // Calculate average score for each item
    const mergedRecs: Recommendation[] = [];
    itemScores.forEach((scores, itemId) => {
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

      // Boost score if recommended by multiple strategies
      const diversityBoost = scores.length > 1 ? 0.1 : 0;
      const finalScore = Math.min(1.0, avgScore + diversityBoost);

      mergedRecs.push(
        new Recommendation(
          recommendations[0].userId,
          itemId,
          finalScore,
          this.getName()
        )
      );
    });

    // Sort by final score and return top N
    return mergedRecs.sort((a, b) => b.score - a.score).slice(0, topN);
  }
}