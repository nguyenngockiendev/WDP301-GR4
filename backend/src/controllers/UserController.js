import { CreateUserDTO } from '../dto/UserDTO.js';
import { pageNumber } from '../utils/pagination.js';
export class UserController {
  constructor(service) {
    this.service = service;
  }

  list = async (req, res) => {
    const page = pageNumber(req.query.page);
    const result = await this.service.list(page);

    res.json({ page, ...result });
  };

  detail = async (req, res) => {
    const user = await this.service.detail(req.params.id);

    res.json({ user });
  };

  create = async (req, res) => {
    const user = await this.service.create(new CreateUserDTO(req.body, 'MANAGER'));

    res.status(201).json({ user });
  };
}
