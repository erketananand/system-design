import { IPricingStrategy, PricingBreakdown } from './IPricingStrategy';
import { Ticket } from '../models/Ticket';
import { VehicleType } from '../enums/VehicleType';

export class HourlyPricingStrategy implements IPricingStrategy {
  private name: string = 'Hourly Pricing Strategy';
  private baseRatePerHour: Map<VehicleType, number>;
  private overstayPenaltyRate: number = 1.5;

  constructor() {
    this.baseRatePerHour = new Map([
      [VehicleType.BIKE, 10],
      [VehicleType.CAR, 20],
      [VehicleType.VAN, 30],
      [VehicleType.TRUCK, 40]
    ]);
  }

  public calculateFee(ticket: Ticket): PricingBreakdown {
    const actualDuration = ticket.actualDurationHours || ticket.calculateActualDuration();
    const hourlyRate = this.baseRatePerHour.get(VehicleType.CAR) || 20;

    let baseAmount = actualDuration * hourlyRate;
    let overstayPenalty = 0;

    if (ticket.isOverstayed(20)) {
      const overstayHours = actualDuration - (ticket.expectedDurationHours * 1.2);
      overstayPenalty = overstayHours * hourlyRate * this.overstayPenaltyRate;
    }

    const totalAmount = baseAmount + overstayPenalty;

    return {
      baseAmount,
      overstayPenalty,
      discounts: 0,
      totalAmount
    };
  }

  public getName(): string {
    return this.name;
  }

  public setRateForVehicleType(type: VehicleType, rate: number): void {
    this.baseRatePerHour.set(type, rate);
  }
}
