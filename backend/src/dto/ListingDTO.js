import { text } from './UserDTO.js';
import { AppError } from '../utils/errors.js';
export class ListingDTO {
  constructor(body) {
    this.title = text(body.title, 'Name', 2, 150);
    this.description = text(body.description, 'Description', 5, 5000);
    if (!['string', 'number'].includes(typeof body.price) || String(body.price).trim() === '')
      throw new AppError('Please enter a price.');
    this.price = Number(body.price);
    if (!Number.isSafeInteger(this.price) || this.price < 0 || this.price > 1000000000)
      throw new AppError('Price must be a whole number between 0 and 1 billion VND.');
  }
}
