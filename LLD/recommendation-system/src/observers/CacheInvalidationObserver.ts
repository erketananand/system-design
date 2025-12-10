import { IInteractionObserver } from './IInteractionObserver';
import { Interaction } from '../models/Interaction';
import { RecommendationCache } from '../cache/RecommendationCache';
import { Logger } from '../utils/Logger';

export class CacheInvalidationObserver implements IInteractionObserver {
  constructor(private cache: RecommendationCache) {}

  public onInteractionRecorded(interaction: Interaction): void {
    // Invalidate cache for the user who made the interaction
    this.cache.invalidateForUser(interaction.userId);

    Logger.debug(
      `Cache invalidated for user ${interaction.userId} due to ${interaction.type} interaction`
    );
  }
}