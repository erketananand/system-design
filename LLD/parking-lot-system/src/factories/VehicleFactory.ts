import { Vehicle } from '../models/Vehicle';
import { Car } from '../models/Car';
import { Bike } from '../models/Bike';
import { Truck } from '../models/Truck';
import { Van } from '../models/Van';
import { VehicleType } from '../enums/VehicleType';

export class VehicleFactory {
  public static createVehicle(
    type: VehicleType,
    licensePlate: string,
    color: string,
    id?: string
  ): Vehicle {
    switch (type) {
      case VehicleType.CAR:
        return new Car(licensePlate, color, id);
      case VehicleType.BIKE:
        return new Bike(licensePlate, color, id);
      case VehicleType.TRUCK:
        return new Truck(licensePlate, color, id);
      case VehicleType.VAN:
        return new Van(licensePlate, color, id);
      default:
        throw new Error(`Unknown vehicle type: ${type}`);
    }
  }
}
