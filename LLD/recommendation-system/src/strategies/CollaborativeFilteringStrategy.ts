import { IRecommendationStrategy } from './IRecommendationStrategy';
import { ISimilarityCalculator } from './ISimilarityCalculator';
import { Recommendation } from '../models/Recommendation';
import { UserRepository } from '../repositories/UserRepository';
import { ItemRepository } from '../repositories/ItemRepository';
import { InteractionRepository } from '../repositories/InteractionRepository';

export class CollaborativeFilteringStrategy implements IRecommendationStrategy {
  constructor(
    private userRepo: UserRepository,
    private itemRepo: ItemRepository,
    private interactionRepo: InteractionRepository,
    private similarityCalculator: ISimilarityCalculator
  ) {}

  public getName(): string {
    return 'COLLABORATIVE_FILTERING';
  }

  public recommend(userId: string, topN: number, filters?: Map<string, string>): Recommendation[] {
    // Check if user exists
    const targetUser = this.userRepo.findById(userId);
    if (!targetUser) {
      return [];
    }

    // Get user's interactions
    const userInteractions = this.interactionRepo.findByUserId(userId);
    if (userInteractions.length === 0) {
      return []; // Cold start - no interactions yet
    }

    // Build user-item matrix
    const { userItemMatrix, userIds, itemIds } = this.buildUserItemMatrix();

    if (userIds.length < 2 || itemIds.length === 0) {
      return []; // Not enough data for collaborative filtering
    }

    // Find similar users
    const targetUserIndex = userIds.indexOf(userId);
    if (targetUserIndex === -1) {
      return [];
    }

    const similarUsers = this.findSimilarUsers(targetUserIndex, userItemMatrix, userIds);

    // Generate recommendations based on similar users
    const recommendations = this.generateRecommendations(
      userId,
      similarUsers,
      userItemMatrix,
      userIds,
      itemIds,
      topN,
      filters
    );

    return recommendations;
  }

  private buildUserItemMatrix(): {
    userItemMatrix: number[][];
    userIds: string[];
    itemIds: string[];
  } {
    const allInteractions = this.interactionRepo.findAll();
    const userIds = this.interactionRepo.getUniqueUserIds();
    const itemIds = this.interactionRepo.getUniqueItemIds();

    // Initialize matrix with zeros
    const matrix: number[][] = [];
    for (let i = 0; i < userIds.length; i++) {
      matrix[i] = new Array(itemIds.length).fill(0);
    }

    // Fill matrix with interaction scores
    allInteractions.forEach(interaction => {
      const userIndex = userIds.indexOf(interaction.userId);
      const itemIndex = itemIds.indexOf(interaction.itemId);
      if (userIndex !== -1 && itemIndex !== -1) {
        matrix[userIndex][itemIndex] = interaction.getScore();
      }
    });

    return { userItemMatrix: matrix, userIds, itemIds };
  }

  private findSimilarUsers(
    targetUserIndex: number,
    userItemMatrix: number[][],
    userIds: string[]
  ): Array<{ userId: string; similarity: number }> {
    const similarities: Array<{ userId: string; similarity: number }> = [];
    const targetVector = userItemMatrix[targetUserIndex];

    for (let i = 0; i < userItemMatrix.length; i++) {
      if (i === targetUserIndex) continue;

      const similarity = this.similarityCalculator.computeSimilarity(
        targetVector,
        userItemMatrix[i]
      );

      if (similarity > 0) {
        similarities.push({ userId: userIds[i], similarity });
      }
    }

    // Sort by similarity descending
    similarities.sort((a, b) => b.similarity - a.similarity);

    return similarities.slice(0, 10); // Top 10 similar users
  }

  private generateRecommendations(
    targetUserId: string,
    similarUsers: Array<{ userId: string; similarity: number }>,
    userItemMatrix: number[][],
    userIds: string[],
    itemIds: string[],
    topN: number,
    filters?: Map<string, string>
  ): Recommendation[] {
    const targetUserInteractions = this.interactionRepo.findByUserId(targetUserId);
    const interactedItemIds = new Set(targetUserInteractions.map(i => i.itemId));

    const itemScores = new Map<string, number>();

    // Calculate weighted scores for items
    similarUsers.forEach(({ userId, similarity }) => {
      const userIndex = userIds.indexOf(userId);
      if (userIndex === -1) return;

      itemIds.forEach((itemId, itemIndex) => {
        // Skip items user has already interacted with
        if (interactedItemIds.has(itemId)) return;

        const score = userItemMatrix[userIndex][itemIndex];
        if (score > 0) {
          const weightedScore = score * similarity;
          itemScores.set(itemId, (itemScores.get(itemId) || 0) + weightedScore);
        }
      });
    });

    // Apply filters if provided
    let candidateItems = Array.from(itemScores.keys());
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

    // Convert to recommendations and normalize scores
    const maxScore = Math.max(...Array.from(itemScores.values()));
    const recommendations = candidateItems
      .map(itemId => {
        const rawScore = itemScores.get(itemId) || 0;
        const normalizedScore = maxScore > 0 ? rawScore / maxScore : 0;
        return new Recommendation(targetUserId, itemId, normalizedScore, this.getName());
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);

    return recommendations;
  }
}