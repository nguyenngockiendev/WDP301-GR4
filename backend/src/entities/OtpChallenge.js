import mongoose from 'mongoose';
import { entity, ref, money, quantity, state, shortText } from './fields.js';
export default entity('OtpChallenge', { user: ref('User',false), email: {type:String,required:true,lowercase:true,trim:true}, purpose: state('VERIFY_ACCOUNT RESET_PASSWORD','VERIFY_ACCOUNT'), tokenHash: {type:String,required:true,select:false}, attempts: {type:Number,default:0,min:0,max:5}, expiresAt: {type:Date,required:true}, consumedAt: Date }, [[{expiresAt:1},{expireAfterSeconds:0}],[{email:1,purpose:1,createdAt:-1},{}]]);
