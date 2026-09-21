import { ListingDTO } from '../dto/ListingDTO.js';
import { pageNumber } from './UserController.js';
export class ListingController {
  constructor(service) {
    this.service = service;
  }

  list = async (req, res) => {
    const page = pageNumber(req.query.page);
    const result = await this.service.list(req.user, page);

    res.json({ page, ...result });
  };

  detail = async (req, res) => {
    const [item, managers] = await Promise.all([
      this.service.detail(req.params.id, req.user),
      this.service.managers(req.user),
    ]);

    res.json({ item, managers });
  };

  create = async (req, res) => {
    const item = await this.service.create(new ListingDTO(req.body), req.user);

    res.status(201).json({ item });
  };

  assign = async (req, res) => {
    const item = await this.service.assign(req.params.id, req.body.manager, req.user);

    res.json({ item });
  };
}
