/**
 * Player.ts
 * Represents a chess player
 */

import { PieceColor } from '../enums/PieceColor';
import { Piece } from './pieces/Piece';
import { Board } from './Board';
import { BoardObserver } from './BoardObserver';
import { IdGenerator } from '../utils/IdGenerator';

export class Player implements BoardObserver {
  private readonly id: string;
  private readonly name: string;
  private readonly color: PieceColor;
  private readonly isHuman: boolean;
  private capturedPieces: Piece[] = [];
  private drawOffered: boolean = false;

  constructor(name: string, color: PieceColor, isHuman: boolean = true) {
    this.id = IdGenerator.generateId('PLAYER');
    this.name = name;
    this.color = color;
    this.isHuman = isHuman;
  }

  public getName(): string {
    return this.name;
  }

  public getColor(): PieceColor {
    return this.color;
  }

  public getIsHuman(): boolean {
    return this.isHuman;
  }

  public addCapturedPiece(piece: Piece): void {
    this.capturedPieces.push(piece);
  }

  public getCapturedPieces(): Piece[] {
    return [...this.capturedPieces];
  }

  public getCapturedValue(): number {
    return this.capturedPieces.reduce((sum, piece) => sum + piece.getValue(), 0);
  }

  public offerDraw(): void {
    this.drawOffered = true;
  }

  public acceptDraw(): boolean {
    return this.drawOffered;
  }

  public isDrawOffered(): boolean {
    return this.drawOffered;
  }

  public resetDrawOffer(): void {
    this.drawOffered = false;
  }

  /**
   * Observer pattern - called when board changes
   * @param board - Updated board
   */
  public onBoardChanged(board: Board): void {
    // Can be used for AI analysis or UI updates
    // For now, just a placeholder
  }

  public toString(): string {
    return `${this.name} (${this.color})`;
  }

  public getId(): string {
    return this.id;
  }
}
