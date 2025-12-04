import { PanelType } from '../enums/PanelType';
import { IdGenerator } from '../utils/IdGenerator';

/**
 * Panel Entity
 * Represents a button panel (either floor panel or cabin panel)
 */
export class Panel {
  public readonly id: string;
  public panelType: PanelType;
  public floorId: string | null;
  public elevatorId: string | null;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(
    panelType: PanelType,
    floorId: string | null = null,
    elevatorId: string | null = null,
    id?: string
  ) {
    this.id = id || IdGenerator.generateUUID();
    this.panelType = panelType;
    this.floorId = floorId;
    this.elevatorId = elevatorId;
    this.createdAt = new Date();
    this.updatedAt = new Date();

    // Validation: FLOOR panel must have floorId, CABIN panel must have elevatorId
    if (panelType === PanelType.FLOOR && !floorId) {
      throw new Error('Floor panel must have a floorId');
    }
    if (panelType === PanelType.CABIN && !elevatorId) {
      throw new Error('Cabin panel must have an elevatorId');
    }
  }

  public update(): void {
    this.updatedAt = new Date();
  }
}
