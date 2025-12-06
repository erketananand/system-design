/**
 * Position.ts
 * Value object representing a position on the chess board
 * Uses algebraic notation (file: a-h, rank: 1-8)
 */

export class Position {
  private readonly file: string; // 'a' to 'h'
  private readonly rank: number; // 1 to 8

  constructor(file: string, rank: number) {
    if (!this.isValidFile(file)) {
      throw new Error(`Invalid file: ${file}. Must be between 'a' and 'h'.`);
    }
    if (!this.isValidRank(rank)) {
      throw new Error(`Invalid rank: ${rank}. Must be between 1 and 8.`);
    }
    this.file = file.toLowerCase();
    this.rank = rank;
  }

  /**
   * Create Position from algebraic notation string
   * @param notation - Algebraic notation (e.g., "e4", "a1")
   * @returns Position object
   */
  public static fromNotation(notation: string): Position {
    if (!notation || notation.length !== 2) {
      throw new Error(`Invalid notation: ${notation}`);
    }
    const file = notation[0].toLowerCase();
    const rank = parseInt(notation[1], 10);
    return new Position(file, rank);
  }

  /**
   * Convert position to algebraic notation
   * @returns Algebraic notation string (e.g., "e4")
   */
  public toNotation(): string {
    return `${this.file}${this.rank}`;
  }

  /**
   * Check if two positions are equal
   * @param other - Position to compare
   * @returns True if positions are equal
   */
  public equals(other: Position): boolean {
    return this.file === other.file && this.rank === other.rank;
  }

  /**
   * Check if position is valid (within board boundaries)
   * @returns True if valid
   */
  public isValid(): boolean {
    return this.isValidFile(this.file) && this.isValidRank(this.rank);
  }

  /**
   * Create a copy of this position
   * @returns Cloned position
   */
  public clone(): Position {
    return new Position(this.file, this.rank);
  }

  public getFile(): string {
    return this.file;
  }

  public getRank(): number {
    return this.rank;
  }

  public toString(): string {
    return this.toNotation();
  }

  private isValidFile(file: string): boolean {
    return file >= 'a' && file <= 'h';
  }

  private isValidRank(rank: number): boolean {
    return rank >= 1 && rank <= 8;
  }
}
