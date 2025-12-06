/**
 * Generic Repository Interface
 * Provides standard CRUD operations for all entities
 */
export interface IRepository<T> {
  findById(id: string): T | undefined;
  findAll(): T[];
  save(entity: T): T;
  delete(id: string): boolean;
  exists(id: string): boolean;
  count(): number;
  clear(): void;
}
