import { Vehicle } from './Vehicle';
import { VehicleType } from '../enums/VehicleType';

export class Car extends Vehicle {
  constructor(licensePlate: string, color: string, id?: string) {
    super(licensePlate, VehicleType.CAR, color, id);
  }
}
