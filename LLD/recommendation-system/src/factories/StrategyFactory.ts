import { IRecommendationStrategy } from '../strategies/IRecommendationStrategy';
import { ISimilarityCalculator } from '../strategies/ISimilarityCalculator';
import { CollaborativeFilteringStrategy } from '../strategies/CollaborativeFilteringStrategy';
import { ContentBasedStrategy } from '../strategies/ContentBasedStrategy';
import { PopularityBasedStrategy } from '../strategies/PopularityBasedStrategy';
import { HybridStrategy } from '../strategies/HybridStrategy';
import { CosineSimilarityCalculator } from '../strategies/CosineSimilarityCalculator';
import { JaccardSimilarityCalculator } from '../strategies/JaccardSimilarityCalculator';
import { EuclideanSimilarityCalculator } from '../strategies/EuclideanSimilarityCalculator';
import { StrategyType } from '../enums/StrategyType';
import { SimilarityMetric } from '../enums/SimilarityMetric';
import { UserRepository } from '../repositories/UserRepository';
import { ItemRepository } from '../repositories/ItemRepository';
import { InteractionRepository } from '../repositories/InteractionRepository';

export interface StrategyDependencies {
  userRepo: UserRepository;
  itemRepo: ItemRepository;
  interactionRepo: InteractionRepository;
  similarityCalculator?: ISimilarityCalculator;
}

export class StrategyFactory {
  public static createStrategy(
    type: StrategyType,
    deps: StrategyDependencies
  ): IRecommendationStrategy {
    const calculator = deps.similarityCalculator || new CosineSimilarityCalculator();

    switch (type) {
      case StrategyType.COLLABORATIVE_FILTERING:
        return new CollaborativeFilteringStrategy(
          deps.userRepo,
          deps.itemRepo,
          deps.interactionRepo,
          calculator
        );

      case StrategyType.CONTENT_BASED:
        return new ContentBasedStrategy(
          deps.itemRepo,
          deps.interactionRepo,
          calculator
        );

      case StrategyType.POPULARITY:
        return new PopularityBasedStrategy(
          deps.interactionRepo,
          deps.itemRepo
        );

      case StrategyType.HYBRID:
        const cfStrategy = new CollaborativeFilteringStrategy(
          deps.userRepo,
          deps.itemRepo,
          deps.interactionRepo,
          calculator
        );
        const cbStrategy = new ContentBasedStrategy(
          deps.itemRepo,
          deps.interactionRepo,
          calculator
        );
        const popStrategy = new PopularityBasedStrategy(
          deps.interactionRepo,
          deps.itemRepo
        );
        return new HybridStrategy([cfStrategy, cbStrategy, popStrategy]);

      default:
        throw new Error(`Unknown strategy type: ${type}`);
    }
  }

  public static createSimilarityCalculator(metric: SimilarityMetric): ISimilarityCalculator {
    switch (metric) {
      case SimilarityMetric.COSINE:
        return new CosineSimilarityCalculator();
      case SimilarityMetric.JACCARD:
        return new JaccardSimilarityCalculator();
      case SimilarityMetric.EUCLIDEAN:
        return new EuclideanSimilarityCalculator();
      default:
        throw new Error(`Unknown similarity metric: ${metric}`);
    }
  }
}