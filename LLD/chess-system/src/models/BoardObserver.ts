/**
 * BoardObserver.ts
 * Observer pattern interface for board state changes
 */

import { Board } from './Board';

export interface BoardObserver {
  onBoardChanged(board: Board): void;
}
