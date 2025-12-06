/**
 * index.ts
 * Main entry point for the Chess System
 */

import { ChessConsole } from './console/ChessConsole';

async function main() {
  const chessConsole = new ChessConsole();
  await chessConsole.start();
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
