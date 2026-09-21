import mongoose from 'mongoose';
import { entity, ref, money, quantity, state, shortText } from './fields.js';
export default entity('PaymentEvent', { provider: shortText, eventId: shortText, payment: ref('Payment',false), verified: {type:Boolean,default:false}, status: state('RECEIVED PROCESSED REJECTED','RECEIVED'), payloadDigest: {type:String,required:true}, processedAt: Date, error: String }, [[{provider:1,eventId:1},{unique:true}]]);
