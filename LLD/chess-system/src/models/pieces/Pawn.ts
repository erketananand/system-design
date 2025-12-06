/**
 * Pawn.ts
 * Implements movement rules for Pawn pieces
 * - Moves forward 1 square (2 from starting position)
 * - Captures diagonally
 * - En passant
 * - Promotion
 */

import { Piece } from './Piece';
import { Position } from '../Position';
import { PieceType } from '../../enums/PieceType';
import { PieceColor } from '../../enums/PieceColor';
import { Board } from '../Board';

export class Pawn extends Piece {
  private enPassantEligible: boolean = false;

  constructor(color: PieceColor, position: Position) {
    super(color, position, PieceType.PAWN, 1);
  }

  public isValidMoveForPiece(to: Position, board: Board): boolean {
    const direction = this.color === PieceColor.WHITE ? 1 : -1;
    const startRank = this.color === PieceColor.WHITE ? 2 : 7;

    const fileDiff = to.getFile().charCodeAt(0) - this.position.getFile().charCodeAt(0);
    const rankDiff = to.getRank() - this.position.getRank();

    // Forward move (1 square)
    if (fileDiff === 0 && rankDiff === direction) {
      return board.getPieceAt(to) === null;
    }

    // Forward move (2 squares from start)
    if (fileDiff === 0 && rankDiff === 2 * direction && this.position.getRank() === startRank) {
      const intermediatePos = new Position(this.position.getFile(), this.position.getRank() + direction);
      return board.getPieceAt(to) === null && board.getPieceAt(intermediatePos) === null;
    }

    // Diagonal capture
    if (Math.abs(fileDiff) === 1 && rankDiff === direction) {
      const targetPiece = board.getPieceAt(to);
      return targetPiece !== null && targetPiece.getColor() !== this.color;
    }

    return false;
  }

  public getPossibleMoves(board: Board): Position[] {
    const moves: Position[] = [];
    const direction = this.color === PieceColor.WHITE ? 1 : -1;
    const startRank = this.color === PieceColor.WHITE ? 2 : 7;

    // Forward one square
    const forwardOne = new Position(this.position.getFile(), this.position.getRank() + direction);
    if (forwardOne.isValid() && board.getPieceAt(forwardOne) === null) {
      moves.push(forwardOne);

      // Forward two squares from start
      if (this.position.getRank() === startRank) {
        const forwardTwo = new Position(this.position.getFile(), this.position.getRank() + 2 * direction);
        if (forwardTwo.isValid() && board.getPieceAt(forwardTwo) === null) {
          moves.push(forwardTwo);
        }
      }
    }

    // Diagonal captures
    const files = [
      String.fromCharCode(this.position.getFile().charCodeAt(0) - 1),
      String.fromCharCode(this.position.getFile().charCodeAt(0) + 1)
    ];

    for (const file of files) {
      if (file >= 'a' && file <= 'h') {
        const capturePos = new Position(file, this.position.getRank() + direction);
        if (capturePos.isValid()) {
          const targetPiece = board.getPieceAt(capturePos);
          if (targetPiece && targetPiece.getColor() !== this.color) {
            moves.push(capturePos);
          }
        }
      }
    }

    return moves;
  }

  public getAttackingSquares(board: Board): Position[] {
    const attacks: Position[] = [];
    const direction = this.color === PieceColor.WHITE ? 1 : -1;

    const files = [
      String.fromCharCode(this.position.getFile().charCodeAt(0) - 1),
      String.fromCharCode(this.position.getFile().charCodeAt(0) + 1)
    ];

    for (const file of files) {
      if (file >= 'a' && file <= 'h') {
        const attackPos = new Position(file, this.position.getRank() + direction);
        if (attackPos.isValid()) {
          attacks.push(attackPos);
        }
      }
    }

    return attacks;
  }

  public canPromote(): boolean {
    const promotionRank = this.color === PieceColor.WHITE ? 8 : 1;
    return this.position.getRank() === promotionRank;
  }

  public setEnPassantEligible(eligible: boolean): void {
    this.enPassantEligible = eligible;
  }

  public isEnPassantEligible(): boolean {
    return this.enPassantEligible;
  }

  public clone(): Pawn {
    const cloned = new Pawn(this.color, this.position.clone());
    cloned.setHasMoved(this.hasMoved);
    cloned.setEnPassantEligible(this.enPassantEligible);
    return cloned;
  }
}
