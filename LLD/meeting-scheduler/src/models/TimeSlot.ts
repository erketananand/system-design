export class TimeSlot {
  public startTime: Date;
  public endTime: Date;
  public availableParticipants: string[];

  constructor(startTime: Date, endTime: Date, availableParticipants: string[] = []) {
    this.startTime = startTime;
    this.endTime = endTime;
    this.availableParticipants = availableParticipants;
  }

  public getDuration(): number {
    return this.endTime.getTime() - this.startTime.getTime();
  }

  public overlaps(other: TimeSlot): boolean {
    return (this.startTime < other.endTime && this.endTime > other.startTime);
  }

  public addParticipant(userId: string): void {
    if (!this.availableParticipants.includes(userId)) {
      this.availableParticipants.push(userId);
    }
  }

  public getInfo(): string {
    return `${this.startTime.toLocaleString()} - ${this.endTime.toLocaleString()} (${this.availableParticipants.length} available)`;
  }
}
