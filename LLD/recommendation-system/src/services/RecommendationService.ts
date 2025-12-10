import { Recommendation } from '../models/Recommendation';
import { Item } from '../models/Item';
import { RecommendationEngine } from '../engine/RecommendationEngine';
import { StrategyType } from '../enums/StrategyType';
import { SimilarityMetric } from '../enums/SimilarityMetric';
import { Logger } from '../utils/Logger';

export class RecommendationService {
  constructor(private engine: RecommendationEngine) {}

  public getRecommendations(
    userId: string,
    topN: number = 10,
    strategyType?: StrategyType,
    filters?: Map<string, string>
  ): Recommendation[] {
    Logger.info(`Getting recommendations for user ${userId}`);
    return this.engine.getRecommendations(userId, topN, strategyType, filters);
  }

  public getRecommendationsWithDetails(
    userId: string,
    topN: number = 10,
    strategyType?: StrategyType
  ): Array<{ recommendation: Recommendation; item: Item | undefined }> {
    const recommendations = this.engine.getRecommendations(userId, topN, strategyType);

    return recommendations.map(rec => ({
      recommendation: rec,
      item: this.getItemFromEngine(rec.itemId)
    }));
  }

  public getSimilarItems(
    itemId: string,
    topN: number = 10,
    metric?: SimilarityMetric
  ): Item[] {
    Logger.info(`Getting similar items for item ${itemId}`);
    return this.engine.getSimilarItems(itemId, topN, metric);
  }

  public clearCache(): void {
    this.engine.clearCache();
    Logger.success('Recommendation cache cleared');
  }

  public getCacheStats(): { size: number } {
    return this.engine.getCacheStats();
  }

  public getAvailableStrategies(): StrategyType[] {
    return this.engine.getAvailableStrategies();
  }

  private getItemFromEngine(itemId: string): Item | undefined {
    // Access through reflection or pass repository
    // For now, return undefined - will be resolved in console layer
    return undefined;
  }
}