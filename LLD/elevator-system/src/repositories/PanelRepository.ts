import { IRepository } from './IRepository';
import { Panel } from '../models/Panel';
import { InMemoryDatabase } from '../database/InMemoryDatabase';
import { PanelType } from '../enums/PanelType';

/**
 * Panel Repository
 * Handles all data operations for Panel entities
 */
export class PanelRepository implements IRepository<Panel> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): Panel | undefined {
    return this.db.panels.get(id);
  }

  public findAll(): Panel[] {
    return Array.from(this.db.panels.values());
  }

  public save(panel: Panel): Panel {
    this.db.panels.set(panel.id, panel);
    return panel;
  }

  public delete(id: string): boolean {
    return this.db.panels.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.panels.has(id);
  }

  public count(): number {
    return this.db.panels.size;
  }

  public clear(): void {
    this.db.panels.clear();
  }

  /**
   * Find panel by floor ID
   * @param floorId - The floor ID
   * @returns The floor panel or undefined
   */
  public findByFloorId(floorId: string): Panel | undefined {
    return Array.from(this.db.panels.values()).find(
      p => p.floorId === floorId && p.panelType === PanelType.FLOOR
    );
  }

  /**
   * Find panel by elevator ID
   * @param elevatorId - The elevator ID
   * @returns The cabin panel or undefined
   */
  public findByElevatorId(elevatorId: string): Panel | undefined {
    return Array.from(this.db.panels.values()).find(
      p => p.elevatorId === elevatorId && p.panelType === PanelType.CABIN
    );
  }

  /**
   * Find all floor panels
   * @returns Array of floor panels
   */
  public findFloorPanels(): Panel[] {
    return Array.from(this.db.panels.values()).filter(
      p => p.panelType === PanelType.FLOOR
    );
  }

  /**
   * Find all cabin panels
   * @returns Array of cabin panels
   */
  public findCabinPanels(): Panel[] {
    return Array.from(this.db.panels.values()).filter(
      p => p.panelType === PanelType.CABIN
    );
  }
}
