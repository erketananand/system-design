import { RequestType } from '../enums/RequestType';
import { RequestStatus } from '../enums/RequestStatus';
import { Direction } from '../enums/Direction';
import { IdGenerator } from '../utils/IdGenerator';

/**
 * Abstract Request Entity
 * Base class for all request types
 */
export abstract class Request {
  public readonly id: string;
  public requestType: RequestType;
  public buildingId: string;
  public status: RequestStatus;
  public createdAt: Date;
  public updatedAt: Date;
  public completedAt: Date | null;

  constructor(requestType: RequestType, buildingId: string, id?: string) {
    this.id = id || IdGenerator.generateUUID();
    this.requestType = requestType;
    this.buildingId = buildingId;
    this.status = RequestStatus.PENDING;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.completedAt = null;
  }

  /**
   * Update request status
   */
  public updateStatus(status: RequestStatus): void {
    this.status = status;
    if (status === RequestStatus.COMPLETED) {
      this.completedAt = new Date();
    }
    this.update();
  }

  /**
   * Mark request as completed
   */
  public complete(): void {
    this.status = RequestStatus.COMPLETED;
    this.completedAt = new Date();
    this.update();
  }

  public update(): void {
    this.updatedAt = new Date();
  }
}

/**
 * External Request (Hall Call)
 * Represents a request made from a floor panel (UP/DOWN button)
 */
export class ExternalRequest extends Request {
  public sourceFloor: number;
  public direction: Direction;
  public elevatorId: string | null;

  constructor(
    buildingId: string,
    sourceFloor: number,
    direction: Direction,
    id?: string
  ) {
    super(RequestType.EXTERNAL, buildingId, id);
    this.sourceFloor = sourceFloor;
    this.direction = direction;
    this.elevatorId = null;
  }

  /**
   * Assign an elevator to this external request
   */
  public assignElevator(elevatorId: string): void {
    this.elevatorId = elevatorId;
    this.updateStatus(RequestStatus.ASSIGNED);
  }
}

/**
 * Internal Request (Cabin Call)
 * Represents a request made from inside an elevator (floor selection)
 */
export class InternalRequest extends Request {
  public elevatorId: string;
  public destinationFloor: number;

  constructor(
    buildingId: string,
    elevatorId: string,
    destinationFloor: number,
    id?: string
  ) {
    super(RequestType.INTERNAL, buildingId, id);
    this.elevatorId = elevatorId;
    this.destinationFloor = destinationFloor;
  }
}
