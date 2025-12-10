export interface ISimilarityCalculator {
  getName(): string;
  computeSimilarity(vectorA: number[], vectorB: number[]): number;
}