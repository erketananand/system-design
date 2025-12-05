/**
 * BoardUtils.ts
 * Utility class for board-related operations and calculations
 */

import { Position } from '../models/Position';
import { Board } from '../models/Board';
import * as crypto from 'crypto';

export class BoardUtils {
  /**
   * Check if a position is within the board boundaries
   * @param position - Position to check
   * @returns True if position is valid
   */
  public static isPositionOnBoard(position: Position): boolean {
    const file = position.getFile();
    const rank = position.getRank();

    return file >= 'a' && file <= 'h' && rank >= 1 && rank <= 8;
  }

  /**
   * Calculate Manhattan distance between two positions
   * @param from - Starting position
   * @param to - Ending position
   * @returns Manhattan distance
   */
  public static getDistance(from: Position, to: Position): number {
    const fileDistance = Math.abs(from.getFile().charCodeAt(0) - to.getFile().charCodeAt(0));
    const rankDistance = Math.abs(from.getRank() - to.getRank());
    return fileDistance + rankDistance;
  }

  /**
   * Check if move is diagonal
   * @param from - Starting position
   * @param to - Ending position
   * @returns True if move is diagonal
   */
  public static isDiagonal(from: Position, to: Position): boolean {
    const fileDiff = Math.abs(from.getFile().charCodeAt(0) - to.getFile().charCodeAt(0));
    const rankDiff = Math.abs(from.getRank() - to.getRank());
    return fileDiff === rankDiff && fileDiff > 0;
  }

  /**
   * Check if move is straight (horizontal or vertical)
   * @param from - Starting position
   * @param to - Ending position
   * @returns True if move is straight
   */
  public static isStraight(from: Position, to: Position): boolean {
    const fileDiff = Math.abs(from.getFile().charCodeAt(0) - to.getFile().charCodeAt(0));
    const rankDiff = Math.abs(from.getRank() - to.getRank());
    return (fileDiff === 0 && rankDiff > 0) || (rankDiff === 0 && fileDiff > 0);
  }

  /**
   * Get direction vector from one position to another
   * @param from - Starting position
   * @param to - Ending position
   * @returns Direction object with dx and dy
   */
  public static getDirection(from: Position, to: Position): { dx: number; dy: number } {
    const fileDiff = to.getFile().charCodeAt(0) - from.getFile().charCodeAt(0);
    const rankDiff = to.getRank() - from.getRank();

    const dx = fileDiff === 0 ? 0 : fileDiff / Math.abs(fileDiff);
    const dy = rankDiff === 0 ? 0 : rankDiff / Math.abs(rankDiff);

    return { dx, dy };
  }

  /**
   * Generate a hash of the board state for position comparison
   * @param board - Board to hash
   * @returns Hash string
   */
  public static hashBoard(board: Board): string {
    const pieces: string[] = [];

    // Collect all pieces with their positions
    for (let rank = 1; rank <= 8; rank++) {
      for (let file = 'a'; file <= 'h'; file = String.fromCharCode(file.charCodeAt(0) + 1)) {
        const position = new Position(file, rank);
        const piece = board.getPieceAt(position);

        if (piece) {
          pieces.push(`${file}${rank}:${piece.getColor()}${piece.getType()}`);
        }
      }
    }

    // Create hash from concatenated piece data
    const boardString = pieces.join('|');
    return crypto.createHash('sha256').update(boardString).digest('hex');
  }

  /**
   * Convert file character to column index (0-7)
   * @param file - File character ('a'-'h')
   * @returns Column index
   */
  public static fileToIndex(file: string): number {
    return file.charCodeAt(0) - 'a'.charCodeAt(0);
  }

  /**
   * Convert column index to file character
   * @param index - Column index (0-7)
   * @returns File character
   */
  public static indexToFile(index: number): string {
    return String.fromCharCode('a'.charCodeAt(0) + index);
  }

  /**
   * Get all positions between two positions (exclusive)
   * @param from - Starting position
   * @param to - Ending position
   * @returns Array of positions in between
   */
  public static getPositionsBetween(from: Position, to: Position): Position[] {
    const positions: Position[] = [];
    const direction = this.getDirection(from, to);

    if (direction.dx === 0 && direction.dy === 0) {
      return positions; // Same position
    }

    let currentFile = from.getFile().charCodeAt(0) + direction.dx;
    let currentRank = from.getRank() + direction.dy;
    const endFile = to.getFile().charCodeAt(0);
    const endRank = to.getRank();

    while (currentFile !== endFile || currentRank !== endRank) {
      positions.push(new Position(String.fromCharCode(currentFile), currentRank));
      currentFile += direction.dx;
      currentRank += direction.dy;
    }

    return positions;
  }
}
