import { Recommendation } from '../models/Recommendation';

export interface IRecommendationStrategy {
  getName(): string;
  recommend(userId: string, topN: number, filters?: Map<string, string>): Recommendation[];
}