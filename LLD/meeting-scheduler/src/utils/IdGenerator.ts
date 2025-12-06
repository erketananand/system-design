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

  static generateUserId(): string {
    return this.generateId('USER');
  }

  static generateEventId(): string {
    return this.generateId('EVENT');
  }

  static generateCalendarId(): string {
    return this.generateId('CAL');
  }

  static generateInvitationId(): string {
    return this.generateId('INV');
  }

  static generateRoomId(): string {
    return this.generateId('ROOM');
  }

  static generateNotificationId(): string {
    return this.generateId('NOTIF');
  }

  static generateBookingId(): string {
    return this.generateId('BOOK');
  }
}
