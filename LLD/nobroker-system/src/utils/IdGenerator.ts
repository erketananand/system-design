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

  static generatePropertyId(): string {
    return this.generateId('PROP');
  }

  static generateListingId(): string {
    return this.generateId('LIST');
  }

  static generateChatThreadId(): string {
    return this.generateId('CHAT');
  }

  static generateMessageId(): string {
    return this.generateId('MSG');
  }

  static generateOfferId(): string {
    return this.generateId('OFFER');
  }

  static generateVisitId(): string {
    return this.generateId('VISIT');
  }

  static generateReviewId(): string {
    return this.generateId('REVIEW');
  }

  static generateSearchCriteriaId(): string {
    return this.generateId('SEARCH');
  }

  static generateAlertId(): string {
    return this.generateId('ALERT');
  }

  static generateAddressId(): string {
    return this.generateId('ADDR');
  }
}
