import { pageNumber } from './UserController.js';
export class WorkspaceController{
 constructor(service){this.service=service;}
 dashboard=async(req,res)=>res.json(await this.service.dashboard(req.user));
 list=async(req,res)=>{const page=pageNumber(req.query.page);res.json({page,...await this.service.list(req.params.module,req.user,page)});};
}
