import mongoose from 'mongoose';
import { entity, ref, money, quantity, state, shortText } from './fields.js';
export default entity('TenantProfile', { user: ref('User'), address: String, emergencyContact: { name: String, phone: String }, status: state('ACTIVE INACTIVE','ACTIVE') }, [[{user:1},{unique:true}]]);
