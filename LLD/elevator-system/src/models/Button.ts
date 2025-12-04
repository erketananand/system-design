import { ButtonType } from '../enums/ButtonType';
import { IdGenerator } from '../utils/IdGenerator';

/**
 * Button Entity
 * Represents a physical button on a panel
 */
export class Button {
  public readonly id: string;
  public panelId: string;
  public buttonType: ButtonType;
  public targetFloor: number | null;
  public label: string;
  public isPressed: boolean;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(
    panelId: string,
    buttonType: ButtonType,
    label: string,
    targetFloor: number | null = null,
    id?: string
  ) {
    this.id = id || IdGenerator.generateUUID();
    this.panelId = panelId;
    this.buttonType = buttonType;
    this.targetFloor = targetFloor;
    this.label = label;
    this.isPressed = false;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Press the button
   */
  public press(): void {
    this.isPressed = true;
    this.update();
  }

  /**
   * Reset the button to unpressed state
   */
  public reset(): void {
    this.isPressed = false;
    this.update();
  }

  public update(): void {
    this.updatedAt = new Date();
  }
}
