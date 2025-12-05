/**
 * ChessConsole.ts
 * Interactive console interface for playing chess
 */

import * as readline from 'readline';
import { GameService } from '../services/GameService';
import { PieceType } from '../enums/PieceType';
import { GameStatus } from '../enums/GameStatus';
import { Logger } from '../utils/Logger';

export class ChessConsole {
  private gameService: GameService;
  private rl: readline.Interface;
  private isRunning: boolean = false;

  constructor() {
    this.gameService = new GameService();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Start the console application
   */
  public async start(): Promise<void> {
    this.isRunning = true;
    this.displayWelcome();

    while (this.isRunning) {
      await this.displayMenu();
    }

    this.rl.close();
  }

  /**
   * Display welcome message
   */
  private displayWelcome(): void {
    console.clear();
    console.log('╔════════════════════════════════════════╗');
    console.log('║        ♔  CHESS GAME SYSTEM  ♚        ║');
    console.log('╚════════════════════════════════════════╝');
    console.log();
  }

  /**
   * Display main menu
   */
  private async displayMenu(): Promise<void> {
    console.log('\n════════════════════════════════════════');
    console.log('Main Menu:');
    console.log('1. Start New Game');
    console.log('2. Make Move');
    console.log('3. Display Board');
    console.log('4. Show Possible Moves');
    console.log('5. View Move History');
    console.log('6. Game Statistics');
    console.log('7. Offer Draw');
    console.log('8. Resign');
    console.log('9. Export to PGN');
    console.log('0. Exit');
    console.log('════════════════════════════════════════\n');

    const choice = await this.readInput('Select an option: ');
    await this.handleMenuChoice(choice.trim());
  }

  /**
   * Handle menu choice
   */
  private async handleMenuChoice(choice: string): Promise<void> {
    switch (choice) {
      case '1':
        await this.handleStartNewGame();
        break;
      case '2':
        await this.handleMakeMove();
        break;
      case '3':
        this.handleDisplayBoard();
        break;
      case '4':
        await this.handleShowMoves();
        break;
      case '5':
        this.handleMoveHistory();
        break;
      case '6':
        this.handleGameStatistics();
        break;
      case '7':
        this.handleOfferDraw();
        break;
      case '8':
        this.handleResign();
        break;
      case '9':
        this.handleExportPGN();
        break;
      case '0':
        this.handleExit();
        break;
      default:
        console.log('Invalid option. Please try again.');
    }
  }

  /**
   * Handle starting a new game
   */
  private async handleStartNewGame(): Promise<void> {
    console.log('\n═══ Start New Game ═══');

    const whiteName = await this.readInput('Enter White player name: ');
    const blackName = await this.readInput('Enter Black player name: ');

    if (!whiteName.trim() || !blackName.trim()) {
      console.log('❌ Invalid player names!');
      return;
    }

    this.gameService.createNewGame(whiteName.trim(), blackName.trim());
    console.log('\n✅ New game started!');
    console.log(`${whiteName} (White) vs ${blackName} (Black)\n`);

    this.gameService.displayBoard();
  }

  /**
   * Handle making a move
   */
  private async handleMakeMove(): Promise<void> {
    const game = this.gameService.getCurrentGame();
    if (!game) {
      console.log('❌ No active game. Please start a new game first.');
      return;
    }

    const status = this.gameService.getCurrentGameStatus();
    if (status !== GameStatus.IN_PROGRESS && status !== GameStatus.CHECK) {
      console.log(`❌ Game is over. Status: ${status}`);
      return;
    }

    console.log(`\n═══ Make Move (${game.getCurrentPlayer().getName()}'s turn) ═══`);
    console.log('Enter move in format: from to (e.g., e2 e4)');
    console.log('For pawn promotion, add piece: e7 e8 Q');

    const moveInput = await this.readInput('Move: ');
    const parts = moveInput.trim().split(' ');

    if (parts.length < 2) {
      console.log('❌ Invalid move format!');
      return;
    }

    const from = parts[0];
    const to = parts[1];
    const promotion = parts[2] ? this.parsePromotionPiece(parts[2]) : undefined;

    const move = this.gameService.makeMove(from, to, promotion);

    if (move) {
      console.log(`\n✅ Move: ${move.toAlgebraicNotation()}`);
      this.gameService.displayBoard();

      // Check game status
      const newStatus = this.gameService.getCurrentGameStatus();
      if (newStatus === GameStatus.CHECK) {
        console.log('\n⚠️  CHECK!');
      } else if (newStatus === GameStatus.CHECKMATE) {
        console.log('\n🏆 CHECKMATE! Game Over!');
      } else if (newStatus === GameStatus.STALEMATE) {
        console.log('\n🤝 STALEMATE! Game is a draw.');
      } else if (newStatus === GameStatus.DRAW) {
        console.log('\n🤝 DRAW! Game Over.');
      }
    } else {
      console.log('❌ Invalid move!');
    }
  }

  /**
   * Parse promotion piece from input
   */
  private parsePromotionPiece(input: string): PieceType | undefined {
    const upperInput = input.toUpperCase();
    switch (upperInput) {
      case 'Q':
        return PieceType.QUEEN;
      case 'R':
        return PieceType.ROOK;
      case 'B':
        return PieceType.BISHOP;
      case 'N':
        return PieceType.KNIGHT;
      default:
        return PieceType.QUEEN; // Default to queen
    }
  }

  /**
   * Handle displaying board
   */
  private handleDisplayBoard(): void {
    const game = this.gameService.getCurrentGame();
    if (!game) {
      console.log('❌ No active game.');
      return;
    }

    console.log('\n═══ Current Board ═══');
    this.gameService.displayBoard();
    console.log(`\nCurrent turn: ${game.getCurrentPlayer().getName()}`);
    console.log(`Status: ${this.gameService.getCurrentGameStatus()}`);
  }

  /**
   * Handle showing possible moves
   */
  private async handleShowMoves(): Promise<void> {
    const game = this.gameService.getCurrentGame();
    if (!game) {
      console.log('❌ No active game.');
      return;
    }

    console.log('\n═══ Show Possible Moves ═══');
    const position = await this.readInput('Enter piece position (e.g., e2): ');

    const moves = this.gameService.getPossibleMoves(position.trim());

    if (moves.length === 0) {
      console.log('No legal moves for this piece.');
    } else {
      console.log(`\nPossible moves from ${position}:`);
      console.log(moves.join(', '));
    }
  }

  /**
   * Handle displaying move history
   */
  private handleMoveHistory(): void {
    const history = this.gameService.getMoveHistory();

    if (history.length === 0) {
      console.log('\n❌ No moves yet.');
      return;
    }

    console.log('\n═══ Move History ═══');
    for (let i = 0; i < history.length; i++) {
      if (i % 2 === 0) {
        process.stdout.write(`${Math.floor(i / 2) + 1}. `);
      }
      process.stdout.write(`${history[i].toAlgebraicNotation()} `);
      if (i % 2 === 1) {
        console.log();
      }
    }
    console.log();
  }

  /**
   * Handle displaying game statistics
   */
  private handleGameStatistics(): void {
    const stats = this.gameService.getGameStatistics();

    if (!stats) {
      console.log('\n❌ No active game.');
      return;
    }

    console.log('\n═══ Game Statistics ═══');
    console.log(`Game ID: ${stats.gameId}`);
    console.log(`Status: ${stats.status}`);
    console.log(`Current Turn: ${stats.currentTurn}`);
    console.log(`Total Moves: ${stats.moveCount}`);
    console.log(`Full Move Number: ${stats.fullMoveNumber}`);
    console.log('\nWhite Player:');
    console.log(`  Name: ${stats.whitePlayer.name}`);
    console.log(`  Captured Pieces: ${stats.whitePlayer.capturedPieces}`);
    console.log(`  Captured Value: ${stats.whitePlayer.capturedValue}`);
    console.log('\nBlack Player:');
    console.log(`  Name: ${stats.blackPlayer.name}`);
    console.log(`  Captured Pieces: ${stats.blackPlayer.capturedPieces}`);
    console.log(`  Captured Value: ${stats.blackPlayer.capturedValue}`);
    console.log(`\nStart Time: ${stats.startTime}`);
    if (stats.endTime) {
      console.log(`End Time: ${stats.endTime}`);
    }
  }

  /**
   * Handle offering a draw
   */
  private handleOfferDraw(): void {
    const game = this.gameService.getCurrentGame();
    if (!game) {
      console.log('❌ No active game.');
      return;
    }

    this.gameService.offerDraw();
    console.log(`\n🤝 ${game.getCurrentPlayer().getName()} offers a draw.`);
    console.log('The opponent can accept by selecting "Offer Draw" on their turn.');
  }

  /**
   * Handle resignation
   */
  private handleResign(): void {
    const game = this.gameService.getCurrentGame();
    if (!game) {
      console.log('❌ No active game.');
      return;
    }

    const currentPlayer = game.getCurrentPlayer();
    this.gameService.resign();
    console.log(`\n🏳️  ${currentPlayer.getName()} resigns!`);
  }

  /**
   * Handle PGN export
   */
  private handleExportPGN(): void {
    const pgn = this.gameService.exportGameToPGN();

    if (!pgn) {
      console.log('❌ No active game to export.');
      return;
    }

    console.log('\n═══ Game in PGN Format ═══');
    console.log(pgn);
  }

  /**
   * Handle exit
   */
  private handleExit(): void {
    console.log('\nThank you for playing Chess! 👋');
    this.isRunning = false;
  }

  /**
   * Read input from user
   */
  private readInput(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer);
      });
    });
  }
}

// Main entry point
if (require.main === module) {
  const console_app = new ChessConsole();
  console_app.start().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}
