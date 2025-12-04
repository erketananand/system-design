import { ExternalRequest, InternalRequest } from '../models/Request';
import { Elevator } from '../models/Elevator';
import { ElevatorRepository } from '../repositories/ElevatorRepository';
import { RequestRepository } from '../repositories/RequestRepository';
import { BuildingRepository } from '../repositories/BuildingRepository';
import { ISchedulingStrategy } from '../strategies/ISchedulingStrategy';
import { NearestElevatorStrategy } from '../strategies/NearestElevatorStrategy';
import { ElevatorService } from './ElevatorService';
import { RequestService } from './RequestService';
import { Logger } from '../utils/Logger';
import { Direction } from '../enums/Direction';

/**
 * Elevator Controller - Singleton Pattern
 * Central dispatcher for managing all elevator operations
 * Coordinates between requests, elevators, and scheduling strategies
 */
export class ElevatorController {
  private static instance: ElevatorController;

  private elevatorRepo = new ElevatorRepository();
  private requestRepo = new RequestRepository();
  private buildingRepo = new BuildingRepository();
  private elevatorService = new ElevatorService();
  private requestService = new RequestService();

  private schedulingStrategy: ISchedulingStrategy;

  // Private constructor to enforce singleton
  private constructor() {
    this.schedulingStrategy = new NearestElevatorStrategy();
    Logger.info('ElevatorController initialized with NearestElevatorStrategy');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ElevatorController {
    if (!ElevatorController.instance) {
      ElevatorController.instance = new ElevatorController();
    }
    return ElevatorController.instance;
  }

  /**
   * Handle external request (hall call)
   * This is triggered when someone presses UP/DOWN button on a floor
   */
  public handleExternalRequest(
    buildingId: string,
    sourceFloor: number,
    direction: Direction
  ): void {
    Logger.info(`\n[EXTERNAL REQUEST] Floor ${sourceFloor}, Direction: ${direction}`);

    // Validate building
    const building = this.buildingRepo.findById(buildingId);
    if (!building) {
      Logger.error('Building not found');
      return;
    }

    // Validate floor
    if (sourceFloor < 0 || sourceFloor >= building.totalFloors) {
      Logger.error(`Invalid floor: ${sourceFloor}`);
      return;
    }

    // Create external request
    const request = this.requestService.createExternalRequest(
      buildingId,
      sourceFloor,
      direction
    );

    // Get available elevators
    const elevators = this.elevatorRepo.findAvailableByBuildingId(buildingId);

    if (elevators.length === 0) {
      Logger.error('No available elevators in the building');
      return;
    }

    // Use scheduling strategy to select best elevator
    const selectedElevator = this.schedulingStrategy.selectElevator(elevators, request);

    if (!selectedElevator) {
      Logger.error('No suitable elevator found');
      return;
    }

    // Assign elevator to request
    request.assignElevator(selectedElevator.id);
    this.requestRepo.save(request);

    // Add source floor to elevator's destination queue
    this.elevatorService.addDestination(selectedElevator.id, sourceFloor);

    Logger.success(
      `Request assigned to elevator ${selectedElevator.elevatorCode} (currently at floor ${selectedElevator.currentFloor})`
    );
  }

  /**
   * Handle internal request (cabin call)
   * This is triggered when someone inside the elevator presses a floor button
   */
  public handleInternalRequest(
    buildingId: string,
    elevatorId: string,
    destinationFloor: number
  ): void {
    Logger.info(`\n[INTERNAL REQUEST] Elevator: ${elevatorId}, Destination: ${destinationFloor}`);

    // Validate building
    const building = this.buildingRepo.findById(buildingId);
    if (!building) {
      Logger.error('Building not found');
      return;
    }

    // Validate floor
    if (destinationFloor < 0 || destinationFloor >= building.totalFloors) {
      Logger.error(`Invalid floor: ${destinationFloor}`);
      return;
    }

    // Get elevator
    const elevator = this.elevatorRepo.findById(elevatorId);
    if (!elevator) {
      Logger.error('Elevator not found');
      return;
    }

    // Check if elevator is overloaded
    if (elevator.isOverloaded()) {
      Logger.warn(`Elevator ${elevator.elevatorCode} is overloaded. Request rejected.`);
      return;
    }

    // Create internal request
    const request = this.requestService.createInternalRequest(
      buildingId,
      elevatorId,
      destinationFloor
    );

    // Add destination to elevator
    const success = this.elevatorService.addDestination(elevatorId, destinationFloor);

    if (success) {
      Logger.success(`Destination ${destinationFloor} added to elevator ${elevator.elevatorCode}`);
    }
  }

  /**
   * Set scheduling strategy (Strategy Pattern)
   */
  public setSchedulingStrategy(strategy: ISchedulingStrategy): void {
    this.schedulingStrategy = strategy;
    Logger.info(`Scheduling strategy changed to: ${strategy.getStrategyName()}`);
  }

  /**
   * Simulate elevator system for one time step
   * This moves all elevators one step toward their destinations
   */
  public simulateStep(buildingId: string): void {
    const elevators = this.elevatorRepo.findByBuildingId(buildingId);

    elevators.forEach(elevator => {
      this.elevatorService.moveElevator(elevator.id);
    });
  }

  /**
   * Auto-run simulation for multiple steps
   */
  public async runSimulation(buildingId: string, steps: number, delayMs: number = 1000): Promise<void> {
    Logger.info(`\n[SIMULATION] Running ${steps} steps with ${delayMs}ms delay...\n`);

    for (let i = 1; i <= steps; i++) {
      console.log(`\n--- Step ${i} ---`);
      this.simulateStep(buildingId);
      console.log(this.elevatorService.getAllElevatorStatus(buildingId));

      if (i < steps) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    Logger.success('\nSimulation completed!');
  }

  /**
   * Get status of all elevators
   */
  public getSystemStatus(buildingId: string): string {
    return this.elevatorService.getAllElevatorStatus(buildingId);
  }
}
