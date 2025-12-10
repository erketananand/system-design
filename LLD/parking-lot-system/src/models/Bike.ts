import { Vehicle } from './Vehicle';
import { VehicleType } from '../enums/VehicleType';

export class Bike extends Vehicle {
  constructor(licensePlate: string, color: string, id?: string) {
    super(licensePlate, VehicleType.BIKE, color, id);
  }
}
