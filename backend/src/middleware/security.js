import crypto from 'node:crypto';
import { AppError } from '../utils/errors.js';
export function csrf(req,res,next){
 req.session.csrf ??= crypto.randomBytes(32).toString('hex');
 if(!['GET','HEAD','OPTIONS'].includes(req.method)&&req.get('X-CSRF-Token')!==req.session.csrf)return next(new AppError('Your session has expired. Refresh and try again.',403));
 next();
}
export function requireAuth(req,res,next){if(!req.user)return next(new AppError('Please sign in.',401));next();}
export const roles=(...allowed)=>(req,res,next)=>{if(!allowed.includes(req.user?.role))return next(new AppError('You do not have access.',403));next();};
