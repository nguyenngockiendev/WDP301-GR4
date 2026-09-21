import { ListingDTO } from '../dto/ListingDTO.js';
import { pageNumber } from './UserController.js';
export class ListingController{
 constructor(service){this.service=service;}
 list=async(req,res)=>{const page=pageNumber(req.query.page);res.json({page,...await this.service.list(req.user,page)});};
 detail=async(req,res)=>res.json({item:await this.service.detail(req.params.id,req.user),managers:await this.service.managers(req.user)});
 create=async(req,res)=>res.status(201).json({item:await this.service.create(new ListingDTO(req.body),req.user)});
 assign=async(req,res)=>res.json({item:await this.service.assign(req.params.id,req.body.manager,req.user)});
}
