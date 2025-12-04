import { IRepository } from './IRepository';
import { Button } from '../models/Button';
import { InMemoryDatabase } from '../database/InMemoryDatabase';
import { ButtonType } from '../enums/ButtonType';

/**
 * Button Repository
 * Handles all data operations for Button entities
 */
export class ButtonRepository implements IRepository<Button> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): Button | undefined {
    return this.db.buttons.get(id);
  }

  public findAll(): Button[] {
    return Array.from(this.db.buttons.values());
  }

  public save(button: Button): Button {
    this.db.buttons.set(button.id, button);
    return button;
  }

  public delete(id: string): boolean {
    return this.db.buttons.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.buttons.has(id);
  }

  public count(): number {
    return this.db.buttons.size;
  }

  public clear(): void {
    this.db.buttons.clear();
  }

  /**
   * Find all buttons on a specific panel
   * @param panelId - The panel ID
   * @returns Array of buttons
   */
  public findByPanelId(panelId: string): Button[] {
    return Array.from(this.db.buttons.values()).filter(
      b => b.panelId === panelId
    );
  }

  /**
   * Find button by panel and type
   * @param panelId - The panel ID
   * @param buttonType - The button type
   * @returns The button or undefined
   */
  public findByPanelAndType(panelId: string, buttonType: ButtonType): Button | undefined {
    return Array.from(this.db.buttons.values()).find(
      b => b.panelId === panelId && b.buttonType === buttonType
    );
  }

  /**
   * Find floor button by panel and floor number
   * @param panelId - The panel ID
   * @param targetFloor - The target floor number
   * @returns The button or undefined
   */
  public findFloorButton(panelId: string, targetFloor: number): Button | undefined {
    return Array.from(this.db.buttons.values()).find(
      b => b.panelId === panelId && 
           b.buttonType === ButtonType.FLOOR && 
           b.targetFloor === targetFloor
    );
  }

  /**
   * Find all pressed buttons
   * @returns Array of pressed buttons
   */
  public findPressedButtons(): Button[] {
    return Array.from(this.db.buttons.values()).filter(b => b.isPressed);
  }
}
