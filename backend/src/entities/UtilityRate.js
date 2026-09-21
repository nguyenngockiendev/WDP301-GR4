import mongoose from 'mongoose';
import { entity, ref, money, quantity, state, shortText } from './fields.js';
export default entity('UtilityRate', { building: ref('Building'), effectiveFrom: {type:Date,required:true}, electricityPrice: money(), waterPrice: money(), createdBy: ref('User') }, [[{building:1,effectiveFrom:1},{unique:true}]]);
