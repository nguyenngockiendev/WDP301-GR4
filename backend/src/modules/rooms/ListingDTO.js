import { text } from '../users/UserDTO.js';
import { AppError } from '../../common/utils/errors.js';
export class ListingDTO {
  constructor(body) {
    this.title = text(
      body.title || (Array.isArray(body.codes) ? body.codes[0] : ''),
      'Name',
      2,
      150,
    );
    this.description = text(body.description, 'Description', 5, 5000);
    if (!['string', 'number'].includes(typeof body.price) || String(body.price).trim() === '')
      throw new AppError('Please enter a price.');
    this.price = Number(body.price);
    if (!Number.isSafeInteger(this.price) || this.price < 0 || this.price > 1000000000)
      throw new AppError('Price must be a whole number between 0 and 1 billion VND.');
    this.building = body.building || '';
    if (
      typeof this.building !== 'string' ||
      (this.building && !/^[a-f\d]{24}$/i.test(this.building))
    )
      throw new AppError('Please select a valid building.');
    this.code = body.code ? text(body.code, 'Room code', 1, 50).toUpperCase() : '';
    this.area = body.area === undefined || body.area === '' ? undefined : Number(body.area);
    if (
      this.area !== undefined &&
      (!Number.isFinite(this.area) || this.area <= 0 || this.area > 10000)
    )
      throw new AppError('Area must be greater than 0 and no more than 10,000 m².');
    this.capacity =
      body.capacity === undefined || body.capacity === '' ? undefined : Number(body.capacity);
    if (
      this.capacity !== undefined &&
      (!Number.isInteger(this.capacity) || this.capacity < 1 || this.capacity > 100)
    )
      throw new AppError('Capacity must be from 1 to 100 people.');
    this.amenities = Array.isArray(body.amenities)
      ? body.amenities.map(value => String(value).trim()).filter(Boolean)
      : String(body.amenities || '')
          .split(',')
          .map(value => value.trim())
          .filter(Boolean);
    if (this.amenities.some(value => value.length > 100))
      throw new AppError('Each amenity must be 100 characters or fewer.');
    this.codes = body.codes;
    if (this.codes !== undefined) {
      if (!Array.isArray(this.codes) || !this.codes.length || this.codes.length > 100)
        throw new AppError('Enter between 1 and 100 room codes.');
      this.codes = this.codes.map(code => String(code).trim().toUpperCase());
      if (this.codes.some(code => !code || code.length > 50))
        throw new AppError('Room codes must be between 1 and 50 characters.');
      if (new Set(this.codes.map(code => code.toUpperCase())).size !== this.codes.length)
        throw new AppError('Room codes must be unique.');
    }
  }
}
