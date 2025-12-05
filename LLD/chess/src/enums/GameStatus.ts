/**
 * GameStatus.ts
 * Enum representing the current status of a chess game
 */

export enum GameStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  CHECK = 'CHECK',
  CHECKMATE = 'CHECKMATE',
  STALEMATE = 'STALEMATE',
  DRAW = 'DRAW',
  RESIGNED = 'RESIGNED'
}
