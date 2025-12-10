import { IRecommendationStrategy } from './IRecommendationStrategy';
import { ISimilarityCalculator } from './ISimilarityCalculator';
import { Recommendation } from '../models/Recommendation';
import { Item } from '../models/Item';
import { ItemRepository } from '../repositories/ItemRepository';
import { InteractionRepository } from '../repositories/InteractionRepository';

export class ContentBasedStrategy implements IRecommendationStrategy {
  constructor(
    private itemRepo: ItemRepository,
    private interactionRepo: InteractionRepository,
    private similarityCalculator: ISimilarityCalculator
  ) {}

  public getName(): string {
    return 'CONTENT_BASED';
  }

  public recommend(userId: string, topN: number, filters?: Map<string, string>): Recommendation[] {
    // Get user's positive interactions
    const userInteractions = this.interactionRepo.findPositiveInteractions(userId);

    if (userInteractions.length === 0) {
      return []; // No interaction history
    }

    // Get items user liked
    const likedItemIds = userInteractions.map(i => i.itemId);
    const likedItems = likedItemIds
      .map(id => this.itemRepo.findById(id))
      .filter(item => item !== undefined) as Item[];

    if (likedItems.length === 0) {
      return [];
    }

    // Build user profile from liked items
    const userProfile = this.buildUserProfile(likedItems);

    // Get all items user hasn't interacted with
    const allInteractions = this.interactionRepo.findByUserId(userId);
    const interactedItemIds = new Set(allInteractions.map(i => i.itemId));

    let candidateItems = this.itemRepo.findAll().filter(
      item => !interactedItemIds.has(item.id)
    );

    // Apply filters if provided
    if (filters && filters.size > 0) {
      candidateItems = candidateItems.filter(item => {
        for (const [key, value] of filters.entries()) {
          if (item.getAttribute(key) !== value) {
            return false;
          }
        }
        return true;
      });
    }

    // Calculate similarity scores
    const recommendations = candidateItems
      .map(item => {
        const itemFeatures = this.buildItemFeatureVector(item);
        const similarity = this.similarityCalculator.computeSimilarity(
          userProfile,
          itemFeatures
        );
        return new Recommendation(userId, item.id, similarity, this.getName());
      })
      .filter(rec => rec.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);

    return recommendations;
  }

  private buildUserProfile(likedItems: Item[]): number[] {
    // Collect all unique feature keys
    const featureKeys = new Set<string>();
    likedItems.forEach(item => {
      item.attributes.forEach((_, key) => {
        featureKeys.add(key);
      });
      item.tags.forEach(tag => {
        featureKeys.add(`tag:${tag}`);
      });
    });

    const featureArray = Array.from(featureKeys);
    const profile = new Array(featureArray.length).fill(0);

    // Aggregate features from liked items
    likedItems.forEach(item => {
      const itemVector = this.buildItemFeatureVectorWithKeys(item, featureArray);
      for (let i = 0; i < itemVector.length; i++) {
        profile[i] += itemVector[i];
      }
    });

    // Normalize by number of liked items
    for (let i = 0; i < profile.length; i++) {
      profile[i] /= likedItems.length;
    }

    return profile;
  }

  private buildItemFeatureVector(item: Item): number[] {
    // Create feature vector from item attributes and tags
    const features: number[] = [];

    // Add attribute values (assuming numeric or convertible)
    item.attributes.forEach(value => {
      const numValue = parseFloat(value);
      features.push(isNaN(numValue) ? value.length / 100 : numValue);
    });

    // Add tag presence (1 for each tag)
    item.tags.forEach(() => {
      features.push(1);
    });

    return features;
  }

  private buildItemFeatureVectorWithKeys(item: Item, featureKeys: string[]): number[] {
    const vector = new Array(featureKeys.length).fill(0);

    featureKeys.forEach((key, index) => {
      if (key.startsWith('tag:')) {
        const tag = key.substring(4);
        vector[index] = item.hasTag(tag) ? 1 : 0;
      } else {
        const value = item.getAttribute(key);
        if (value !== undefined) {
          const numValue = parseFloat(value);
          vector[index] = isNaN(numValue) ? 1 : numValue;
        }
      }
    });

    return vector;
  }
}