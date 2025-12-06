/**
 * IRepository.ts
 * Generic repository interface for CRUD operations
 */

export interface IRepository<T> {
  /**
   * Save an entity
   * @param entity - Entity to save
   * @returns Saved entity
   */
  save(entity: T): T;

  /**
   * Find entity by ID
   * @param id - Entity ID
   * @returns Entity or null if not found
   */
  findById(id: string): T | null;

  /**
   * Find all entities
   * @returns Array of all entities
   */
  findAll(): T[];

  /**
   * Delete entity by ID
   * @param id - Entity ID
   * @returns True if deleted successfully
   */
  delete(id: string): boolean;

  /**
   * Update an entity
   * @param entity - Entity to update
   * @returns Updated entity or null if not found
   */
  update(entity: T): T | null;
}
