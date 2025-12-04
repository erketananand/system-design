import { IRepository } from './IRepository';
import { Request, ExternalRequest, InternalRequest } from '../models/Request';
import { InMemoryDatabase } from '../database/InMemoryDatabase';
import { RequestStatus } from '../enums/RequestStatus';
import { RequestType } from '../enums/RequestType';

/**
 * Request Repository
 * Handles all data operations for Request entities
 */
export class RequestRepository implements IRepository<Request> {
  private db = InMemoryDatabase.getInstance();

  public findById(id: string): Request | undefined {
    return this.db.requests.get(id);
  }

  public findAll(): Request[] {
    return Array.from(this.db.requests.values());
  }

  public save(request: Request): Request {
    this.db.requests.set(request.id, request);
    return request;
  }

  public delete(id: string): boolean {
    return this.db.requests.delete(id);
  }

  public exists(id: string): boolean {
    return this.db.requests.has(id);
  }

  public count(): number {
    return this.db.requests.size;
  }

  public clear(): void {
    this.db.requests.clear();
  }

  /**
   * Find all requests for a specific building
   * @param buildingId - The building ID
   * @returns Array of requests
   */
  public findByBuildingId(buildingId: string): Request[] {
    return Array.from(this.db.requests.values()).filter(
      r => r.buildingId === buildingId
    );
  }

  /**
   * Find all external requests
   * @returns Array of external requests
   */
  public findExternalRequests(): ExternalRequest[] {
    return Array.from(this.db.requests.values()).filter(
      r => r.requestType === RequestType.EXTERNAL
    ) as ExternalRequest[];
  }

  /**
   * Find all internal requests
   * @returns Array of internal requests
   */
  public findInternalRequests(): InternalRequest[] {
    return Array.from(this.db.requests.values()).filter(
      r => r.requestType === RequestType.INTERNAL
    ) as InternalRequest[];
  }

  /**
   * Find requests by status
   * @param status - The request status
   * @returns Array of requests
   */
  public findByStatus(status: RequestStatus): Request[] {
    return Array.from(this.db.requests.values()).filter(
      r => r.status === status
    );
  }

  /**
   * Find pending external requests for a building
   * @param buildingId - The building ID
   * @returns Array of pending external requests
   */
  public findPendingExternalRequests(buildingId: string): ExternalRequest[] {
    return Array.from(this.db.requests.values()).filter(
      r => r.buildingId === buildingId &&
           r.requestType === RequestType.EXTERNAL &&
           r.status === RequestStatus.PENDING
    ) as ExternalRequest[];
  }

  /**
   * Find all requests assigned to a specific elevator
   * @param elevatorId - The elevator ID
   * @returns Array of requests
   */
  public findByElevatorId(elevatorId: string): Request[] {
    return Array.from(this.db.requests.values()).filter(r => {
      if (r.requestType === RequestType.EXTERNAL) {
        return (r as ExternalRequest).elevatorId === elevatorId;
      } else if (r.requestType === RequestType.INTERNAL) {
        return (r as InternalRequest).elevatorId === elevatorId;
      }
      return false;
    });
  }
}
