import { BuildingDTO } from '../dto/BuildingDTO.js';
import { pageNumber } from './UserController.js';

export class BuildingController {
  constructor(service) {
    this.service = service;
  }
  list = async (req, res) => {
    const page = pageNumber(req.query.page);
    res.json({ page, ...(await this.service.list(req.user, page)) });
  };
  detail = async (req, res) =>
    res.json({ item: await this.service.detail(req.params.id, req.user) });
  create = async (req, res) =>
    res.status(201).json({ item: await this.service.create(new BuildingDTO(req.body), req.user) });
  update = async (req, res) =>
    res.json({
      item: await this.service.update(req.params.id, new BuildingDTO(req.body), req.user),
    });
  remove = async (req, res) => {
    await this.service.remove(req.params.id, req.user);
    res.status(204).end();
  };
}
