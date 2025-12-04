/**
 * Generic Repository Interface
 * Defines standard CRUD operations for all repositories
 * This abstraction allows easy replacement of in-memory storage with a real database
 */
export interface IRepository<T> {
  /**
   * Find an entity by its unique ID
   * @param id - The unique identifier
   * @returns The entity or undefined if not found
   */
  findById(id: string): T | undefined;

  /**
   * Find all entities
   * @returns Array of all entities
   */
  findAll(): T[];

  /**
   * Save (create or update) an entity
   * @param entity - The entity to save
   * @returns The saved entity
   */
  save(entity: T): T;

  /**
   * Delete an entity by ID
   * @param id - The unique identifier
   * @returns True if deleted, false if not found
   */
  delete(id: string): boolean;

  /**
   * Check if an entity exists
   * @param id - The unique identifier
   * @returns True if exists, false otherwise
   */
  exists(id: string): boolean;

  /**
   * Count total entities
   * @returns Number of entities
   */
  count(): number;

  /**
   * Clear all entities (useful for testing)
   */
  clear(): void;
}
