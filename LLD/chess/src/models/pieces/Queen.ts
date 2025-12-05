/**
 * Queen.ts
 * Implements movement rules for Queen pieces (combination of Rook and Bishop)
 * - Moves any number of squares horizontally, vertically, or diagonally
 * - Most powerful piece
 * - Cannot jump over pieces
 */

import { Piece } from './Piece';
import { Position } from '../Position';
import { PieceType } from '../../enums/PieceType';
import { PieceColor } from '../../enums/PieceColor';
import { Board } from '../Board';

export class Queen extends Piece {
  constructor(color: PieceColor, position: Position) {
    super(color, position, PieceType.QUEEN, 9);
  }

  public isValidMoveForPiece(to: Position, board: Board): boolean {
    const fileDiff = Math.abs(to.getFile().charCodeAt(0) - this.position.getFile().charCodeAt(0));
    const rankDiff = Math.abs(to.getRank() - this.position.getRank());

    // Must move in straight line or diagonal
    const isStraight = (fileDiff === 0 || rankDiff === 0) && (fileDiff + rankDiff > 0);
    const isDiagonal = fileDiff === rankDiff && fileDiff > 0;

    if (!isStraight && !isDiagonal) {
      return false;
    }

    // Check if path is clear
    return board.isPathClear(this.position, to);
  }

  public getPossibleMoves(board: Board): Position[] {
    const moves: Position[] = [];
    const directions = [
      { dx: 0, dy: 1 },   // Up
      { dx: 0, dy: -1 },  // Down
      { dx: 1, dy: 0 },   // Right
      { dx: -1, dy: 0 },  // Left
      { dx: 1, dy: 1 },   // Up-Right
      { dx: 1, dy: -1 },  // Down-Right
      { dx: -1, dy: 1 },  // Up-Left
      { dx: -1, dy: -1 }  // Down-Left
    ];

    for (const dir of directions) {
      let file = this.position.getFile().charCodeAt(0) + dir.dx;
      let rank = this.position.getRank() + dir.dy;

      while (file >= 'a'.charCodeAt(0) && file <= 'h'.charCodeAt(0) && rank >= 1 && rank <= 8) {
        const pos = new Position(String.fromCharCode(file), rank);
        const piece = board.getPieceAt(pos);

        if (piece === null) {
          moves.push(pos);
        } else {
          if (piece.getColor() !== this.color) {
            moves.push(pos); // Can capture
          }
          break; // Stop at first piece
        }

        file += dir.dx;
        rank += dir.dy;
      }
    }

    return moves;
  }

  public getAttackingSquares(board: Board): Position[] {
    return this.getPossibleMoves(board);
  }

  public clone(): Queen {
    const cloned = new Queen(this.color, this.position.clone());
    cloned.setHasMoved(this.hasMoved);
    return cloned;
  }
}
