import { Building } from '../models/Building';
import { Floor } from '../models/Floor';
import { Elevator } from '../models/Elevator';
import { Panel } from '../models/Panel';
import { Button } from '../models/Button';
import { BuildingRepository } from '../repositories/BuildingRepository';
import { FloorRepository } from '../repositories/FloorRepository';
import { ElevatorRepository } from '../repositories/ElevatorRepository';
import { PanelRepository } from '../repositories/PanelRepository';
import { ButtonRepository } from '../repositories/ButtonRepository';
import { PanelType } from '../enums/PanelType';
import { ButtonType } from '../enums/ButtonType';
import { Logger } from '../utils/Logger';
import { IdleState } from '../states/IdleState';

/**
 * Building Service
 * Handles business logic for building setup and initialization
 */
export class BuildingService {
  private buildingRepo = new BuildingRepository();
  private floorRepo = new FloorRepository();
  private elevatorRepo = new ElevatorRepository();
  private panelRepo = new PanelRepository();
  private buttonRepo = new ButtonRepository();

  /**
   * Create a new building with floors and elevators
   */
  public createBuilding(
    name: string,
    totalFloors: number,
    numberOfElevators: number,
    elevatorCapacity: number
  ): Building {
    Logger.info(`Creating building: ${name} with ${totalFloors} floors and ${numberOfElevators} elevators`);

    // Create building
    const building = new Building(name, totalFloors);
    this.buildingRepo.save(building);

    // Create floors (0 to totalFloors-1, where 0 is ground floor)
    for (let i = 0; i < totalFloors; i++) {
      const floor = new Floor(building.id, i);
      this.floorRepo.save(floor);

      // Create floor panel (hall panel)
      const floorPanel = new Panel(PanelType.FLOOR, floor.id, null);
      this.panelRepo.save(floorPanel);

      // Create buttons on floor panel
      if (i < totalFloors - 1) {
        // Not top floor - add UP button
        const upButton = new Button(floorPanel.id, ButtonType.UP, 'UP');
        this.buttonRepo.save(upButton);
      }
      if (i > 0) {
        // Not ground floor - add DOWN button
        const downButton = new Button(floorPanel.id, ButtonType.DOWN, 'DOWN');
        this.buttonRepo.save(downButton);
      }
    }

    // Create elevators
    for (let i = 1; i <= numberOfElevators; i++) {
      const elevator = new Elevator(building.id, `E${i}`, elevatorCapacity);

      // Set initial state
      elevator.setStateObject(new IdleState());

      this.elevatorRepo.save(elevator);

      // Create cabin panel (internal panel)
      const cabinPanel = new Panel(PanelType.CABIN, null, elevator.id);
      this.panelRepo.save(cabinPanel);

      // Create floor buttons in cabin
      for (let floorNum = 0; floorNum < totalFloors; floorNum++) {
        const floorButton = new Button(
          cabinPanel.id,
          ButtonType.FLOOR,
          floorNum.toString(),
          floorNum
        );
        this.buttonRepo.save(floorButton);
      }

      // Add emergency button
      const emergencyButton = new Button(cabinPanel.id, ButtonType.EMERGENCY, 'EMERGENCY');
      this.buttonRepo.save(emergencyButton);
    }

    Logger.success(`Building "${name}" created successfully!`);
    return building;
  }

  /**
   * Get building by ID
   */
  public getBuilding(buildingId: string): Building | undefined {
    return this.buildingRepo.findById(buildingId);
  }

  /**
   * Get all buildings
   */
  public getAllBuildings(): Building[] {
    return this.buildingRepo.findAll();
  }

  /**
   * Get building summary
   */
  public getBuildingSummary(buildingId: string): string {
    const building = this.buildingRepo.findById(buildingId);
    if (!building) {
      return 'Building not found';
    }

    const elevators = this.elevatorRepo.findByBuildingId(buildingId);
    const floors = this.floorRepo.findByBuildingId(buildingId);

    return `
Building: ${building.name}
Total Floors: ${building.totalFloors}
Number of Elevators: ${elevators.length}
Floors Created: ${floors.length}
`;
  }
}
