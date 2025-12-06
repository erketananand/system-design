/**
 * NotationService.ts
 * Service for handling chess notation conversions
 */

import { Move } from '../models/Move';
import { Position } from '../models/Position';
import { Board } from '../models/Board';

export class NotationService {
  /**
   * Convert move to algebraic notation
   * @param move - Move to convert
   * @param board - Board state
   * @returns Algebraic notation string
   */
  public static toAlgebraicNotation(move: Move, board: Board): string {
    return move.toAlgebraicNotation();
  }

  /**
   * Parse algebraic notation to positions
   * Note: This is a simplified implementation
   * @param notation - Algebraic notation (e.g., "e4", "Nf3")
   * @param board - Board state
   * @returns Object with from and to positions (or null)
   */
  public static fromAlgebraicNotation(notation: string, board: Board): { from: Position; to: Position } | null {
    // This is a simplified parser
    // Full implementation would handle all chess notation nuances

    try {
      // Simple pawn move (e.g., "e4")
      if (notation.length === 2 && notation[0] >= 'a' && notation[0] <= 'h') {
        const to = Position.fromNotation(notation);
        // Would need to find the piece that can move there
        return null; // Placeholder
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Convert position to notation
   * @param position - Position object
   * @returns Notation string
   */
  public static positionToNotation(position: Position): string {
    return position.toNotation();
  }

  /**
   * Convert notation to position
   * @param notation - Notation string
   * @returns Position object
   */
  public static notationToPosition(notation: string): Position {
    return Position.fromNotation(notation);
  }

  /**
   * Convert move to PGN format
   * @param move - Move object
   * @returns PGN string
   */
  public static moveToPGN(move: Move): string {
    return move.toAlgebraicNotation();
  }

  /**
   * Validate notation format
   * @param notation - Notation string to validate
   * @returns True if valid
   */
  public static isValidNotation(notation: string): boolean {
    if (!notation || notation.length < 2 || notation.length > 5) {
      return false;
    }

    const file = notation[0];
    const rank = notation[1];

    return file >= 'a' && file <= 'h' && rank >= '1' && rank <= '8';
  }
}
