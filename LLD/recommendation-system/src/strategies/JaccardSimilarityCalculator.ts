import { ISimilarityCalculator } from './ISimilarityCalculator';

export class JaccardSimilarityCalculator implements ISimilarityCalculator {
  public getName(): string {
    return 'JACCARD';
  }

  public computeSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same length');
    }

    if (vectorA.length === 0) {
      return 0;
    }

    // Convert vectors to binary sets (non-zero = present)
    const setA = new Set<number>();
    const setB = new Set<number>();

    for (let i = 0; i < vectorA.length; i++) {
      if (vectorA[i] !== 0) {
        setA.add(i);
      }
      if (vectorB[i] !== 0) {
        setB.add(i);
      }
    }

    // Calculate intersection
    let intersection = 0;
    setA.forEach(i => {
      if (setB.has(i)) {
        intersection++;
      }
    });

    // Calculate union
    const union = setA.size + setB.size - intersection;

    if (union === 0) {
      return 0;
    }

    return intersection / union;
  }
}