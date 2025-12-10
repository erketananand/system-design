import { Vehicle } from './Vehicle';
import { VehicleType } from '../enums/VehicleType';

export class Van extends Vehicle {
  constructor(licensePlate: string, color: string, id?: string) {
    super(licensePlate, VehicleType.VAN, color, id);
  }
}
