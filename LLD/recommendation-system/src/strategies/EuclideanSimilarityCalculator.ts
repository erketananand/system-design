import { ISimilarityCalculator } from './ISimilarityCalculator';

export class EuclideanSimilarityCalculator implements ISimilarityCalculator {
  public getName(): string {
    return 'EUCLIDEAN';
  }

  public computeSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same length');
    }

    if (vectorA.length === 0) {
      return 0;
    }

    let sumSquaredDiff = 0;

    for (let i = 0; i < vectorA.length; i++) {
      const diff = vectorA[i] - vectorB[i];
      sumSquaredDiff += diff * diff;
    }

    const distance = Math.sqrt(sumSquaredDiff);

    // Convert distance to similarity (0 to 1 range)
    // Using 1 / (1 + distance) formula
    return 1 / (1 + distance);
  }
}