/**
 * Knight.ts
 * Implements movement rules for Knight pieces (L-shape)
 * - Moves in L-shape: 2 squares in one direction, 1 in perpendicular
 * - Can jump over pieces
 * - Only piece that can jump
 */

import { Piece } from './Piece';
import { Position } from '../Position';
import { PieceType } from '../../enums/PieceType';
import { PieceColor } from '../../enums/PieceColor';
import { Board } from '../Board';

export class Knight extends Piece {
  constructor(color: PieceColor, position: Position) {
    super(color, position, PieceType.KNIGHT, 3);
  }

  public isValidMoveForPiece(to: Position, board: Board): boolean {
    const fileDiff = Math.abs(to.getFile().charCodeAt(0) - this.position.getFile().charCodeAt(0));
    const rankDiff = Math.abs(to.getRank() - this.position.getRank());

    // L-shape: 2 squares in one direction, 1 in perpendicular
    return (fileDiff === 2 && rankDiff === 1) || (fileDiff === 1 && rankDiff === 2);
  }

  public getPossibleMoves(board: Board): Position[] {
    const moves: Position[] = [];
    const offsets = [
      { dx: 2, dy: 1 }, { dx: 2, dy: -1 },
      { dx: -2, dy: 1 }, { dx: -2, dy: -1 },
      { dx: 1, dy: 2 }, { dx: 1, dy: -2 },
      { dx: -1, dy: 2 }, { dx: -1, dy: -2 }
    ];

    for (const offset of offsets) {
      const file = String.fromCharCode(this.position.getFile().charCodeAt(0) + offset.dx);
      const rank = this.position.getRank() + offset.dy;

      if (file >= 'a' && file <= 'h' && rank >= 1 && rank <= 8) {
        const pos = new Position(file, rank);
        const piece = board.getPieceAt(pos);

        if (piece === null || piece.getColor() !== this.color) {
          moves.push(pos);
        }
      }
    }

    return moves;
  }

  public getAttackingSquares(board: Board): Position[] {
    return this.getPossibleMoves(board);
  }

  public clone(): Knight {
    const cloned = new Knight(this.color, this.position.clone());
    cloned.setHasMoved(this.hasMoved);
    return cloned;
  }
}
