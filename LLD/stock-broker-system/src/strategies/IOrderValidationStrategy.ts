import { Order } from '../models/Order';
import { Account } from '../models/Account';
import { Portfolio } from '../models/Portfolio';
import { Stock } from '../models/Stock';

export interface IOrderValidationStrategy {
  validate(
    order: Order, 
    account: Account, 
    stock: Stock, 
    portfolio: Portfolio | null
  ): void;
  getStrategyName(): string;
}
