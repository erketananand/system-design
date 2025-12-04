import { Building } from '../models/Building';
import { Floor } from '../models/Floor';
import { Elevator } from '../models/Elevator';
import { Panel } from '../models/Panel';
import { Button } from '../models/Button';
import { Request } from '../models/Request';

/**
 * In-Memory Database - Singleton Pattern
 * Simulates a database using JavaScript Maps for O(1) lookups
 * Can be easily replaced with a real database connection
 */
export class InMemoryDatabase {
  private static instance: InMemoryDatabase;

  // Storage maps (simulating database tables)
  public buildings: Map<string, Building> = new Map();
  public floors: Map<string, Floor> = new Map();
  public elevators: Map<string, Elevator> = new Map();
  public panels: Map<string, Panel> = new Map();
  public buttons: Map<string, Button> = new Map();
  public requests: Map<string, Request> = new Map();

  // Private constructor to enforce singleton
  private constructor() {
    console.log('[DATABASE] In-Memory Database initialized');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): InMemoryDatabase {
    if (!InMemoryDatabase.instance) {
      InMemoryDatabase.instance = new InMemoryDatabase();
    }
    return InMemoryDatabase.instance;
  }

  /**
   * Clear all data (useful for testing or reset)
   */
  public clearAll(): void {
    this.buildings.clear();
    this.floors.clear();
    this.elevators.clear();
    this.panels.clear();
    this.buttons.clear();
    this.requests.clear();
    console.log('[DATABASE] All data cleared');
  }

  /**
   * Get database statistics
   */
  public getStats(): Record<string, number> {
    return {
      buildings: this.buildings.size,
      floors: this.floors.size,
      elevators: this.elevators.size,
      panels: this.panels.size,
      buttons: this.buttons.size,
      requests: this.requests.size
    };
  }

  /**
   * Print database statistics
   */
  public printStats(): void {
    const stats = this.getStats();
    console.log('\n[DATABASE STATS]');
    console.log(`  Buildings: ${stats.buildings}`);
    console.log(`  Floors: ${stats.floors}`);
    console.log(`  Elevators: ${stats.elevators}`);
    console.log(`  Panels: ${stats.panels}`);
    console.log(`  Buttons: ${stats.buttons}`);
    console.log(`  Requests: ${stats.requests}`);
  }
}
