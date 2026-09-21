import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { UserDAO } from './dao/UserDAO.js';
import { ListingDAO } from './dao/ListingDAO.js';
import { WorkspaceDAO } from './dao/WorkspaceDAO.js';
import { UserService } from './services/UserService.js';
import { ListingService } from './services/ListingService.js';
import { WorkspaceService } from './services/WorkspaceService.js';
import { AuthController } from './controllers/AuthController.js';
import { UserController } from './controllers/UserController.js';
import { ListingController } from './controllers/ListingController.js';
import { WorkspaceController } from './controllers/WorkspaceController.js';
import { USER_ROLES } from './config/roles.js';
import { modules } from './config/modules.js';
import Room from './entities/Room.js';
import { csrf,requireAuth,roles } from './middleware/security.js';
export function createApp({mongoUrl,secret,store,production=false}){
 if(!secret||secret.length<32)throw new Error('SESSION_SECRET requires at least 32 characters.');
 const app=express();app.disable('x-powered-by');app.use(helmet());app.use(express.json({limit:'20kb'}));
 app.use('/api',session({name:'boarding.sid',secret,resave:false,saveUninitialized:false,store:store??MongoStore.create({mongoUrl}),cookie:{httpOnly:true,sameSite:'lax',secure:production,maxAge:28800000}}));
 const service=new UserService(new UserDAO()),auth=new AuthController(service),users=new UserController(service);
 app.use('/api',async(req,res,next)=>{
  if(req.session.userId){try{req.user=await service.detail(req.session.userId);}catch(e){if(e.status!==404)throw e;delete req.session.userId;}
   if(req.user&&!USER_ROLES.includes(req.user.role)){delete req.session.userId;req.user=null;}}
  next();
 });
 app.use('/api',csrf);
 app.get('/api/session',(req,res)=>res.json({user:req.user??null,csrf:req.session.csrf,modules:Object.fromEntries(Object.entries(modules).filter(([,m])=>m.roles.includes(req.user?.role)))}));
 const limiter=rateLimit({windowMs:900000,limit:30,standardHeaders:'draft-7',legacyHeaders:false,handler:(req,res)=>res.status(429).json({message:'Too many attempts. Try again in 15 minutes.'})});
 app.post('/api/auth/register',limiter,auth.register);app.post('/api/auth/login',limiter,auth.login);
 app.use('/api',requireAuth);
 app.post('/api/auth/logout',auth.logout);app.patch('/api/profile',auth.profile);
 app.get('/api/users',roles('ADMIN'),users.list);app.post('/api/users',roles('ADMIN'),users.create);app.get('/api/users/:id',roles('ADMIN'),users.detail);
 const rooms=new ListingController(new ListingService(new ListingDAO(Room),['ADMIN','MANAGER'],new UserDAO()));
 app.use('/api/rooms',roles('ADMIN','MANAGER'));app.get('/api/rooms',rooms.list);app.post('/api/rooms',roles('ADMIN'),rooms.create);app.get('/api/rooms/:id',rooms.detail);app.patch('/api/rooms/:id/manager',roles('ADMIN'),rooms.assign);
 const workspace=new WorkspaceController(new WorkspaceService(new WorkspaceDAO()));app.get('/api/dashboard',workspace.dashboard);app.get('/api/workspace/:module',workspace.list);
 app.use((req,res)=>res.status(404).json({message:'Not found.'}));
 app.use((error,req,res,next)=>{const status=error.status||500;if(status===500)console.error(error);res.status(status).json({message:status===500?'Something went wrong. Please try again.':error.message});});return app;
}
