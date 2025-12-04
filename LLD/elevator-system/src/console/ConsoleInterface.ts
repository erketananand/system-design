import * as readline from 'readline';
import { BuildingService } from '../services/BuildingService';
import { ElevatorService } from '../services/ElevatorService';
import { ElevatorController } from '../services/ElevatorController';
import { Direction } from '../enums/Direction';
import { InMemoryDatabase } from '../database/InMemoryDatabase';
import { Logger } from '../utils/Logger';

/**
 * Console Interface
 * Interactive command-line interface for the Elevator System
 */
export class ConsoleInterface {
  private buildingService = new BuildingService();
  private elevatorService = new ElevatorService();
  private controller = ElevatorController.getInstance();
  private db = InMemoryDatabase.getInstance();

  private rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  private currentBuildingId: string | null = null;

  /**
   * Start the console interface
   */
  public async start(): Promise<void> {
    this.printWelcome();
    await this.mainMenu();
  }

  /**
   * Print welcome banner
   */
  private printWelcome(): void {
    console.clear();
    console.log('\n' + '='.repeat(70));
    console.log(' '.repeat(15) + 'ELEVATOR SYSTEM - LLD Implementation');
    console.log('='.repeat(70));
    console.log('  Design Patterns: State, Strategy, Singleton, Repository');
    console.log('  Technology: Node.js + TypeScript + In-Memory Database');
    console.log('='.repeat(70) + '\n');
  }

  /**
   * Main menu
   */
  private async mainMenu(): Promise<void> {
    while (true) {
      console.log('\n--- MAIN MENU ---');
      console.log('1. Create New Building');
      console.log('2. Select Building');
      console.log('3. View Database Stats');
      console.log('4. Exit');
      console.log();

      const choice = await this.prompt('Enter your choice: ');

      switch (choice) {
        case '1':
          await this.createBuildingFlow();
          break;
        case '2':
          await this.selectBuildingFlow();
          break;
        case '3':
          this.db.printStats();
          break;
        case '4':
          console.log('\nThank you for using Elevator System!\n');
          this.rl.close();
          process.exit(0);
          break;
        default:
          console.log('Invalid choice. Please try again.');
      }
    }
  }

  /**
   * Create building flow
   */
  private async createBuildingFlow(): Promise<void> {
    console.log('\n--- CREATE NEW BUILDING ---');

    const name = await this.prompt('Building name: ');
    const floorsStr = await this.prompt('Number of floors (e.g., 10): ');
    const elevatorsStr = await this.prompt('Number of elevators (e.g., 3): ');
    const capacityStr = await this.prompt('Elevator capacity (passengers, e.g., 8): ');

    const floors = parseInt(floorsStr);
    const elevators = parseInt(elevatorsStr);
    const capacity = parseInt(capacityStr);

    if (isNaN(floors) || isNaN(elevators) || isNaN(capacity) || 
        floors < 2 || elevators < 1 || capacity < 1) {
      Logger.error('Invalid input. Please enter valid positive numbers.');
      return;
    }

    const building = this.buildingService.createBuilding(name, floors, elevators, capacity);
    this.currentBuildingId = building.id;

    console.log('\n' + '='.repeat(70));
    Logger.success(`Building "${name}" created successfully!`);
    console.log(this.buildingService.getBuildingSummary(building.id));
    console.log('='.repeat(70));

    await this.buildingMenu();
  }

  /**
   * Select building flow
   */
  private async selectBuildingFlow(): Promise<void> {
    const buildings = this.buildingService.getAllBuildings();

    if (buildings.length === 0) {
      Logger.warn('No buildings found. Please create a building first.');
      return;
    }

    console.log('\n--- SELECT BUILDING ---');
    buildings.forEach((b, idx) => {
      console.log(`${idx + 1}. ${b.name} (${b.totalFloors} floors)`);
    });

    const choiceStr = await this.prompt('\nSelect building number: ');
    const choice = parseInt(choiceStr);

    if (isNaN(choice) || choice < 1 || choice > buildings.length) {
      Logger.error('Invalid selection.');
      return;
    }

    this.currentBuildingId = buildings[choice - 1].id;
    Logger.success(`Selected: ${buildings[choice - 1].name}`);

    await this.buildingMenu();
  }

  /**
   * Building operations menu
   */
  private async buildingMenu(): Promise<void> {
    if (!this.currentBuildingId) {
      Logger.error('No building selected.');
      return;
    }

    while (true) {
      const building = this.buildingService.getBuilding(this.currentBuildingId);
      console.log('\n--- BUILDING: ' + building?.name.toUpperCase() + ' ---');
      console.log('1. Make External Request (Hall Call - Press UP/DOWN)');
      console.log('2. Make Internal Request (Cabin Call - Select Floor)');
      console.log('3. View All Elevator Status');
      console.log('4. View Specific Elevator Status');
      console.log('5. Simulate One Step');
      console.log('6. Run Auto Simulation');
      console.log('7. Set Elevator Maintenance Mode');
      console.log('8. Back to Main Menu');
      console.log();

      const choice = await this.prompt('Enter your choice: ');

      switch (choice) {
        case '1':
          await this.externalRequestFlow();
          break;
        case '2':
          await this.internalRequestFlow();
          break;
        case '3':
          console.log(this.elevatorService.getAllElevatorStatus(this.currentBuildingId));
          break;
        case '4':
          await this.viewElevatorStatusFlow();
          break;
        case '5':
          this.controller.simulateStep(this.currentBuildingId);
          console.log(this.elevatorService.getAllElevatorStatus(this.currentBuildingId));
          break;
        case '6':
          await this.autoSimulationFlow();
          break;
        case '7':
          await this.maintenanceModeFlow();
          break;
        case '8':
          this.currentBuildingId = null;
          return;
        default:
          console.log('Invalid choice. Please try again.');
      }
    }
  }

  /**
   * External request flow (hall call)
   */
  private async externalRequestFlow(): Promise<void> {
    console.log('\n--- EXTERNAL REQUEST (Hall Call) ---');

    const building = this.buildingService.getBuilding(this.currentBuildingId!);
    if (!building) return;

    console.log(`Floors available: 0 (Ground) to ${building.totalFloors - 1} (Top)`);

    const floorStr = await this.prompt('Which floor are you on? ');
    const floor = parseInt(floorStr);

    if (isNaN(floor) || floor < 0 || floor >= building.totalFloors) {
      Logger.error('Invalid floor number.');
      return;
    }

    let direction: Direction;

    if (floor === 0) {
      direction = Direction.UP;
      console.log('Ground floor - Direction: UP');
    } else if (floor === building.totalFloors - 1) {
      direction = Direction.DOWN;
      console.log('Top floor - Direction: DOWN');
    } else {
      const dirStr = await this.prompt('Direction (1=UP, 2=DOWN): ');
      direction = dirStr === '1' ? Direction.UP : Direction.DOWN;
    }

    this.controller.handleExternalRequest(this.currentBuildingId!, floor, direction);
  }

  /**
   * Internal request flow (cabin call)
   */
  private async internalRequestFlow(): Promise<void> {
    console.log('\n--- INTERNAL REQUEST (Cabin Call) ---');

    const elevators = this.elevatorService.getElevatorsByBuilding(this.currentBuildingId!);

    if (elevators.length === 0) {
      Logger.error('No elevators in this building.');
      return;
    }

    console.log('\nAvailable Elevators:');
    elevators.forEach((e, idx) => {
      console.log(`${idx + 1}. ${e.elevatorCode} (Floor ${e.currentFloor}, ${e.state})`);
    });

    const elevatorIdx = await this.prompt('\nSelect elevator number: ');
    const idx = parseInt(elevatorIdx) - 1;

    if (isNaN(idx) || idx < 0 || idx >= elevators.length) {
      Logger.error('Invalid elevator selection.');
      return;
    }

    const elevator = elevators[idx];
    const building = this.buildingService.getBuilding(this.currentBuildingId!);

    const floorStr = await this.prompt(`Select destination floor (0 to ${building!.totalFloors - 1}): `);
    const floor = parseInt(floorStr);

    if (isNaN(floor) || floor < 0 || floor >= building!.totalFloors) {
      Logger.error('Invalid floor number.');
      return;
    }

    this.controller.handleInternalRequest(this.currentBuildingId!, elevator.id, floor);
  }

  /**
   * View specific elevator status
   */
  private async viewElevatorStatusFlow(): Promise<void> {
    const elevators = this.elevatorService.getElevatorsByBuilding(this.currentBuildingId!);

    if (elevators.length === 0) {
      Logger.error('No elevators in this building.');
      return;
    }

    console.log('\nElevators:');
    elevators.forEach((e, idx) => {
      console.log(`${idx + 1}. ${e.elevatorCode}`);
    });

    const choiceStr = await this.prompt('\nSelect elevator number: ');
    const choice = parseInt(choiceStr) - 1;

    if (isNaN(choice) || choice < 0 || choice >= elevators.length) {
      Logger.error('Invalid selection.');
      return;
    }

    console.log(this.elevatorService.getElevatorStatus(elevators[choice].id));
  }

  /**
   * Auto simulation flow
   */
  private async autoSimulationFlow(): Promise<void> {
    const stepsStr = await this.prompt('\nNumber of simulation steps (e.g., 10): ');
    const delayStr = await this.prompt('Delay between steps in ms (e.g., 1000): ');

    const steps = parseInt(stepsStr);
    const delay = parseInt(delayStr);

    if (isNaN(steps) || isNaN(delay) || steps < 1 || delay < 0) {
      Logger.error('Invalid input.');
      return;
    }

    await this.controller.runSimulation(this.currentBuildingId!, steps, delay);
  }

  /**
   * Maintenance mode flow
   */
  private async maintenanceModeFlow(): Promise<void> {
    const elevators = this.elevatorService.getElevatorsByBuilding(this.currentBuildingId!);

    if (elevators.length === 0) {
      Logger.error('No elevators in this building.');
      return;
    }

    console.log('\nElevators:');
    elevators.forEach((e, idx) => {
      console.log(`${idx + 1}. ${e.elevatorCode} (${e.state})`);
    });

    const choiceStr = await this.prompt('\nSelect elevator number: ');
    const choice = parseInt(choiceStr) - 1;

    if (isNaN(choice) || choice < 0 || choice >= elevators.length) {
      Logger.error('Invalid selection.');
      return;
    }

    const modeStr = await this.prompt('Enable maintenance? (1=Yes, 2=No): ');
    const maintenance = modeStr === '1';

    this.elevatorService.setMaintenanceMode(elevators[choice].id, maintenance);
  }

  /**
   * Prompt helper
   */
  private prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }
}

// Start the application
const app = new ConsoleInterface();
app.start().catch(console.error);
