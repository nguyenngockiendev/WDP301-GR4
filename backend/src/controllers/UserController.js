import { CreateUserDTO } from '../dto/UserDTO.js';
export function pageNumber(value){const n=Number(value);return Number.isSafeInteger(n)&&n>0?Math.min(n,10000):1;}
export class UserController{
 constructor(service){this.service=service;}
 list=async(req,res)=>{const page=pageNumber(req.query.page);res.json({page,...await this.service.list(page)});};
 detail=async(req,res)=>res.json({user:await this.service.detail(req.params.id)});
 create=async(req,res)=>res.status(201).json({user:await this.service.create(new CreateUserDTO(req.body,true))});
}
