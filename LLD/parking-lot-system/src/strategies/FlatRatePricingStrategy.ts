import { IPricingStrategy, PricingBreakdown } from './IPricingStrategy';
import { Ticket } from '../models/Ticket';
import { VehicleType } from '../enums/VehicleType';

export class FlatRatePricingStrategy implements IPricingStrategy {
  private name: string = 'Flat Rate Pricing Strategy';
  private flatRates: Map<VehicleType, number>;

  constructor() {
    this.flatRates = new Map([
      [VehicleType.BIKE, 50],
      [VehicleType.CAR, 100],
      [VehicleType.VAN, 150],
      [VehicleType.TRUCK, 200]
    ]);
  }

  public calculateFee(ticket: Ticket): PricingBreakdown {
    const flatRate = this.flatRates.get(VehicleType.CAR) || 100;

    return {
      baseAmount: flatRate,
      overstayPenalty: 0,
      discounts: 0,
      totalAmount: flatRate
    };
  }

  public getName(): string {
    return this.name;
  }

  public setRateForVehicleType(type: VehicleType, rate: number): void {
    this.flatRates.set(type, rate);
  }
}
