import { Vehicle } from './Vehicle';
import { VehicleType } from '../enums/VehicleType';

export class Truck extends Vehicle {
  constructor(licensePlate: string, color: string, id?: string) {
    super(licensePlate, VehicleType.TRUCK, color, id);
  }
}
