import { StrategyName } from '../enums/StrategyName';
import { IdGenerator } from '../utils/IdGenerator';

/**
 * SchedulingStrategy Entity
 * Represents a scheduling strategy configuration for a building
 */
export class SchedulingStrategy {
  public readonly id: string;
  public buildingId: string;
  public strategyName: StrategyName;
  public isActive: boolean;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(
    buildingId: string,
    strategyName: StrategyName,
    isActive: boolean = false,
    id?: string
  ) {
    this.id = id || IdGenerator.generateUUID();
    this.buildingId = buildingId;
    this.strategyName = strategyName;
    this.isActive = isActive;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Activate this strategy
   */
  public activate(): void {
    this.isActive = true;
    this.update();
  }

  /**
   * Deactivate this strategy
   */
  public deactivate(): void {
    this.isActive = false;
    this.update();
  }

  public update(): void {
    this.updatedAt = new Date();
  }
}
