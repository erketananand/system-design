import { Ticket } from '../models/Ticket';

export interface PricingBreakdown {
  baseAmount: number;
  overstayPenalty: number;
  discounts: number;
  totalAmount: number;
}

export interface IPricingStrategy {
  calculateFee(ticket: Ticket): PricingBreakdown;
  getName(): string;
}
