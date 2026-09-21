import mongoose from 'mongoose';
import { entity, ref, money, quantity, state, shortText } from './fields.js';
export default entity('AuditLog', { actor: ref('User',false), action: shortText, targetType: shortText, targetId: {type:mongoose.Schema.Types.ObjectId,required:true}, summary: {type:String,maxlength:2000} }, [[{targetType:1,targetId:1,createdAt:-1},{}],[{actor:1,createdAt:-1},{}]]);
