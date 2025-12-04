import { ExternalRequest, InternalRequest } from '../models/Request';
import { RequestRepository } from '../repositories/RequestRepository';
import { Direction } from '../enums/Direction';
import { Logger } from '../utils/Logger';

/**
 * Request Service
 * Handles business logic for request creation and management
 */
export class RequestService {
  private requestRepo = new RequestRepository();

  /**
   * Create external request (hall call)
   */
  public createExternalRequest(
    buildingId: string,
    sourceFloor: number,
    direction: Direction
  ): ExternalRequest {
    if (direction === Direction.IDLE) {
      throw new Error('External request must have UP or DOWN direction');
    }

    const request = new ExternalRequest(buildingId, sourceFloor, direction);
    this.requestRepo.save(request);

    Logger.info(`External request created: Floor ${sourceFloor}, Direction ${direction}`);
    return request;
  }

  /**
   * Create internal request (cabin call)
   */
  public createInternalRequest(
    buildingId: string,
    elevatorId: string,
    destinationFloor: number
  ): InternalRequest {
    const request = new InternalRequest(buildingId, elevatorId, destinationFloor);
    this.requestRepo.save(request);

    Logger.info(`Internal request created: Elevator ${elevatorId}, Destination ${destinationFloor}`);
    return request;
  }

  /**
   * Get all pending external requests for a building
   */
  public getPendingExternalRequests(buildingId: string): ExternalRequest[] {
    return this.requestRepo.findPendingExternalRequests(buildingId);
  }

  /**
   * Complete a request
   */
  public completeRequest(requestId: string): void {
    const request = this.requestRepo.findById(requestId);
    if (request) {
      request.complete();
      this.requestRepo.save(request);
      Logger.success(`Request ${requestId} completed`);
    }
  }

  /**
   * Get all requests for a building
   */
  public getRequestsByBuilding(buildingId: string): any[] {
    return this.requestRepo.findByBuildingId(buildingId);
  }
}
