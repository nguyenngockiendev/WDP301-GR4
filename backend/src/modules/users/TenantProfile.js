import { entity, ref, state } from '../../common/models/fields.js';
export default entity(
  'TenantProfile',
  {
    user: ref('User'),
    address: String,
    emergencyContact: { name: String, phone: String },
    status: state('ACTIVE INACTIVE', 'ACTIVE'),
  },
  [[{ user: 1 }, { unique: true }]],
);
