/**
 * PositionHistory.ts
 * Tracks board positions for threefold repetition detection
 */

import { IdGenerator } from '../utils/IdGenerator';

export class PositionHistory {
  private readonly id: string;
  private readonly gameId: string;
  private readonly boardHash: string;
  private occurrenceCount: number;
  private readonly firstOccurrenceMove: number;
  private lastOccurrenceMove: number;

  constructor(gameId: string, boardHash: string, moveNumber: number) {
    this.id = IdGenerator.generateId('POSITION');
    this.gameId = gameId;
    this.boardHash = boardHash;
    this.occurrenceCount = 1;
    this.firstOccurrenceMove = moveNumber;
    this.lastOccurrenceMove = moveNumber;
  }

  public incrementOccurrence(moveNumber: number): void {
    this.occurrenceCount++;
    this.lastOccurrenceMove = moveNumber;
  }

  public getId(): string {
    return this.id;
  }

  public getGameId(): string {
    return this.gameId;
  }

  public getBoardHash(): string {
    return this.boardHash;
  }

  public getOccurrenceCount(): number {
    return this.occurrenceCount;
  }

  public getFirstOccurrenceMove(): number {
    return this.firstOccurrenceMove;
  }

  public getLastOccurrenceMove(): number {
    return this.lastOccurrenceMove;
  }

  public isThreefoldRepetition(): boolean {
    return this.occurrenceCount >= 3;
  }
}
