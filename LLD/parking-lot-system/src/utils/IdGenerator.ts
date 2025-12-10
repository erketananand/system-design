export class IdGenerator {
  private static counter = 0;

  static generateUUID(): string {
    this.counter++;
    return `${Date.now()}-${this.counter}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static generateId(prefix: string = 'ID'): string {
    this.counter++;
    return `${prefix}-${Date.now()}-${this.counter}`;
  }

  static generateTicketNumber(): string {
    this.counter++;
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `TKT-${timestamp}-${random}`;
  }

  static generateSpotNumber(floorNumber: number, spotIndex: number): string {
    return `F${floorNumber}-S${String(spotIndex).padStart(3, '0')}`;
  }
}
