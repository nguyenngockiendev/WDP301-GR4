import mongoose from 'mongoose';
import { entity, ref, money, quantity, state, shortText } from './fields.js';
export default entity(
  'Building',
  {
    name: shortText,
    address: shortText,
    owner: ref('User'),
    manager: ref('User', false),
    status: state('ACTIVE INACTIVE', 'ACTIVE'),
  },
  [
    [{ owner: 1, name: 1 }, { unique: true }],
    [{ manager: 1, status: 1 }, {}],
  ],
);
