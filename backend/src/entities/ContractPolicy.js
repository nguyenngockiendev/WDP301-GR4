import mongoose from 'mongoose';
import { entity, ref, money, quantity, state, shortText } from './fields.js';
export default entity('ContractPolicy', { building: ref('Building'), version: {type:Number,required:true,min:1,validate:Number.isInteger}, minMonths: {type:Number,required:true,min:1,validate:Number.isInteger}, noticeDays: {type:Number,required:true,min:0,validate:Number.isInteger}, terms: {type:String,required:true,maxlength:20000}, createdBy: ref('User') }, [[{building:1,version:1},{unique:true}]]);
