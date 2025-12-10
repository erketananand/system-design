import { IRecommendationStrategy } from '../strategies/IRecommendationStrategy';
import { ISimilarityCalculator } from '../strategies/ISimilarityCalculator';
import { Recommendation } from '../models/Recommendation';
import { Item } from '../models/Item';
import { UserRepository } from '../repositories/UserRepository';
import { ItemRepository } from '../repositories/ItemRepository';
import { InteractionRepository } from '../repositories/InteractionRepository';
import { RecommendationCache } from '../cache/RecommendationCache';
import { StrategyFactory, StrategyDependencies } from '../factories/StrategyFactory';
import { StrategyType } from '../enums/StrategyType';
import { SimilarityMetric } from '../enums/SimilarityMetric';
import { Logger } from '../utils/Logger';

export class RecommendationEngine {
  private static instance: RecommendationEngine;

  private strategies: Map<StrategyType, IRecommendationStrategy> = new Map();
  private defaultStrategy: StrategyType = StrategyType.HYBRID;

  private constructor(
    private userRepo: UserRepository,
    private itemRepo: ItemRepository,
    private interactionRepo: InteractionRepository,
    private cache: RecommendationCache,
    private defaultSimilarityCalculator: ISimilarityCalculator
  ) {
    Logger.info('RecommendationEngine initialized');
  }

  public static initialize(
    userRepo: UserRepository,
    itemRepo: ItemRepository,
    interactionRepo: InteractionRepository,
    cache: RecommendationCache,
    similarityCalculator: ISimilarityCalculator
  ): RecommendationEngine {
    if (!RecommendationEngine.instance) {
      RecommendationEngine.instance = new RecommendationEngine(
        userRepo,
        itemRepo,
        interactionRepo,
        cache,
        similarityCalculator
      );
    }
    return RecommendationEngine.instance;
  }

  public static getInstance(): RecommendationEngine {
    if (!RecommendationEngine.instance) {
      throw new Error('RecommendationEngine must be initialized first');
    }
    return RecommendationEngine.instance;
  }

  public registerStrategy(type: StrategyType, strategy: IRecommendationStrategy): void {
    this.strategies.set(type, strategy);
    Logger.info(`Strategy registered: ${type}`);
  }

  public setDefaultStrategy(type: StrategyType): void {
    this.defaultStrategy = type;
    Logger.info(`Default strategy set to: ${type}`);
  }

  public getRecommendations(
    userId: string,
    topN: number = 10,
    strategyType?: StrategyType,
    filters?: Map<string, string>
  ): Recommendation[] {
    // Validate user exists
    const user = this.userRepo.findById(userId);
    if (!user) {
      Logger.warn(`User not found: ${userId}`);
      return [];
    }

    // Determine strategy to use
    const strategy = strategyType || this.defaultStrategy;

    // Check cache first
    const cacheKey = this.cache.buildKey(userId, strategy);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      Logger.debug(`Cache hit for user ${userId} with strategy ${strategy}`);
      return cached.slice(0, topN);
    }

    // Get or create strategy
    const recommendationStrategy = this.getOrCreateStrategy(strategy);

    // Generate recommendations
    Logger.info(`Generating recommendations for user ${userId} using ${strategy}`);
    const recommendations = recommendationStrategy.recommend(userId, topN, filters);

    // Cache the results
    if (recommendations.length > 0) {
      this.cache.set(cacheKey, recommendations);
      Logger.debug(`Cached ${recommendations.length} recommendations for user ${userId}`);
    }

    return recommendations;
  }

  public getSimilarItems(
    itemId: string,
    topN: number = 10,
    metric?: SimilarityMetric
  ): Item[] {
    const targetItem = this.itemRepo.findById(itemId);
    if (!targetItem) {
      Logger.warn(`Item not found: ${itemId}`);
      return [];
    }

    // Get similarity calculator
    const calculator = metric 
      ? StrategyFactory.createSimilarityCalculator(metric)
      : this.defaultSimilarityCalculator;

    // Get all items except target
    const allItems = this.itemRepo.findAll().filter(item => item.id !== itemId);

    if (allItems.length === 0) {
      return [];
    }

    // Build feature vectors and compute similarities
    const targetVector = this.buildItemFeatureVector(targetItem);
    const similarities: Array<{ item: Item; score: number }> = [];

    allItems.forEach(item => {
      const itemVector = this.buildItemFeatureVector(item);
      const similarity = calculator.computeSimilarity(targetVector, itemVector);

      if (similarity > 0) {
        similarities.push({ item, score: similarity });
      }
    });

    // Sort by similarity and return top N
    similarities.sort((a, b) => b.score - a.score);
    return similarities.slice(0, topN).map(s => s.item);
  }

  private getOrCreateStrategy(strategyType: StrategyType): IRecommendationStrategy {
    // Check if strategy already exists
    if (this.strategies.has(strategyType)) {
      return this.strategies.get(strategyType)!;
    }

    // Create new strategy
    const deps: StrategyDependencies = {
      userRepo: this.userRepo,
      itemRepo: this.itemRepo,
      interactionRepo: this.interactionRepo,
      similarityCalculator: this.defaultSimilarityCalculator
    };

    const strategy = StrategyFactory.createStrategy(strategyType, deps);
    this.strategies.set(strategyType, strategy);

    return strategy;
  }

  private buildItemFeatureVector(item: Item): number[] {
    const features: number[] = [];

    // Add attribute values
    item.attributes.forEach(value => {
      const numValue = parseFloat(value);
      features.push(isNaN(numValue) ? value.length / 100 : numValue);
    });

    // Add tag count as a feature
    features.push(item.tags.length);

    // Add individual tag presence (limit to prevent huge vectors)
    const topTags = item.tags.slice(0, 10);
    topTags.forEach(() => features.push(1));

    return features.length > 0 ? features : [0];
  }

  public clearCache(): void {
    this.cache.invalidateAll();
    Logger.info('All cache cleared');
  }

  public getCacheStats(): { size: number } {
    return { size: this.cache.getSize() };
  }

  public getAvailableStrategies(): StrategyType[] {
    return Array.from(this.strategies.keys());
  }
}