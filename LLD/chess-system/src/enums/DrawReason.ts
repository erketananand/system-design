/**
 * DrawReason.ts
 * Enum representing different reasons for a game to end in a draw
 */

export enum DrawReason {
  STALEMATE = 'STALEMATE',
  INSUFFICIENT_MATERIAL = 'INSUFFICIENT_MATERIAL',
  THREEFOLD_REPETITION = 'THREEFOLD_REPETITION',
  FIFTY_MOVE_RULE = 'FIFTY_MOVE_RULE',
  AGREEMENT = 'AGREEMENT'
}
