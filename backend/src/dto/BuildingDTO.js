import { text } from './UserDTO.js';
import { AppError } from '../utils/errors.js';

export class BuildingDTO {
  constructor(body) {
    this.name = text(body.name, 'Building name', 2, 200);
    this.address = text(body.address, 'Address', 2, 200);
    this.status = body.status;
    if (!['ACTIVE', 'INACTIVE'].includes(this.status))
      throw new AppError('Please select a valid building status.');
  }
}
