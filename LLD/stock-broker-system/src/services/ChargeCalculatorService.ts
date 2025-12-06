import { OrderSide } from '../enums/OrderSide';

/**
 * Service for calculating trading charges
 * Brokerage, STT, GST, Stamp Duty, Transaction Charges
 */
export class ChargeCalculatorService {
  private static readonly BROKERAGE_RATE = 0.0003; // 0.03%
  private static readonly STT_RATE = 0.00025; // 0.025% on sell side
  private static readonly GST_RATE = 0.18; // 18% on brokerage
  private static readonly STAMP_DUTY_RATE = 0.00003; // 0.003% on buy side
  private static readonly TRANSACTION_CHARGE_RATE = 0.0000345; // 0.00345%
  private static readonly SEBI_CHARGES_RATE = 0.000001; // 0.0001%

  /**
   * Calculate brokerage charges
   */
  public calculateBrokerage(tradeValue: number, side: OrderSide): number {
    const brokerage = tradeValue * ChargeCalculatorService.BROKERAGE_RATE;
    // Zerodha has max ₹20 per order, but we'll keep it simple
    return Math.min(brokerage, 20);
  }

  /**
   * Calculate STT (Securities Transaction Tax)
   * Applied only on sell side
   */
  public calculateSTT(tradeValue: number, side: OrderSide): number {
    if (side === OrderSide.SELL) {
      return tradeValue * ChargeCalculatorService.STT_RATE;
    }
    return 0;
  }

  /**
   * Calculate GST on brokerage
   */
  public calculateGST(brokerage: number): number {
    return brokerage * ChargeCalculatorService.GST_RATE;
  }

  /**
   * Calculate Stamp Duty
   * Applied only on buy side
   */
  public calculateStampDuty(tradeValue: number, side: OrderSide): number {
    if (side === OrderSide.BUY) {
      return tradeValue * ChargeCalculatorService.STAMP_DUTY_RATE;
    }
    return 0;
  }

  /**
   * Calculate Transaction Charges (NSE/BSE)
   */
  public calculateTransactionCharges(tradeValue: number): number {
    return tradeValue * ChargeCalculatorService.TRANSACTION_CHARGE_RATE;
  }

  /**
   * Calculate SEBI Charges
   */
  public calculateSEBICharges(tradeValue: number): number {
    return tradeValue * ChargeCalculatorService.SEBI_CHARGES_RATE;
  }

  /**
   * Calculate all taxes (STT + GST + Stamp Duty + Transaction Charges + SEBI)
   */
  public calculateTaxes(tradeValue: number, brokerage: number, side: OrderSide): number {
    const stt = this.calculateSTT(tradeValue, side);
    const gst = this.calculateGST(brokerage);
    const stampDuty = this.calculateStampDuty(tradeValue, side);
    const transactionCharges = this.calculateTransactionCharges(tradeValue);
    const sebiCharges = this.calculateSEBICharges(tradeValue);

    return stt + gst + stampDuty + transactionCharges + sebiCharges;
  }

  /**
   * Calculate total charges for a trade
   */
  public calculateTotalCharges(tradeValue: number, side: OrderSide): { 
    brokerage: number; 
    taxes: number; 
    total: number;
    breakdown: {
      brokerage: number;
      stt: number;
      gst: number;
      stampDuty: number;
      transactionCharges: number;
      sebiCharges: number;
    };
  } {
    const brokerage = this.calculateBrokerage(tradeValue, side);
    const stt = this.calculateSTT(tradeValue, side);
    const gst = this.calculateGST(brokerage);
    const stampDuty = this.calculateStampDuty(tradeValue, side);
    const transactionCharges = this.calculateTransactionCharges(tradeValue);
    const sebiCharges = this.calculateSEBICharges(tradeValue);

    const taxes = stt + gst + stampDuty + transactionCharges + sebiCharges;
    const total = brokerage + taxes;

    return {
      brokerage,
      taxes,
      total,
      breakdown: {
        brokerage,
        stt,
        gst,
        stampDuty,
        transactionCharges,
        sebiCharges
      }
    };
  }
}
