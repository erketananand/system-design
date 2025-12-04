export class IdGenerator {
  private static counter = 0;

  static generateId(prefix: string = 'ID'): string {
    this.counter++;
    return `${prefix}-${Date.now()}-${this.counter}`;
  }

  static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}