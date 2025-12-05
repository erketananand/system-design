/**
 * Cell.ts
 * Represents a single square on the chess board
 */

import { Position } from './Position';
import { Piece } from './pieces/Piece';
import { IdGenerator } from '../utils/IdGenerator';

export class Cell {
  private readonly id: string;
  private readonly position: Position;
  private piece: Piece | null = null;

  constructor(position: Position) {
    this.id = IdGenerator.generateId('CELL');
    this.position = position;
  }

  public setPiece(piece: Piece | null): void {
    this.piece = piece;
  }

  public getPiece(): Piece | null {
    return this.piece;
  }

  public isEmpty(): boolean {
    return this.piece === null;
  }

  public getPosition(): Position {
    return this.position;
  }

  public getId(): string {
    return this.id;
  }

  public toString(): string {
    if (this.piece) {
      return this.piece.getSymbol();
    }
    // Return checkerboard pattern for empty squares
    const fileIndex = this.position.getFile().charCodeAt(0) - 'a'.charCodeAt(0);
    const isLight = (fileIndex + this.position.getRank()) % 2 === 0;
    return isLight ? '□' : '■';
  }
}
