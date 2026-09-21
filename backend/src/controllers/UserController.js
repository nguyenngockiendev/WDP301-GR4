import { CreateUserDTO } from '../dto/UserDTO.js';
export function pageNumber(value) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? Math.min(n, 10000) : 1;
}
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
    const user = await this.service.create(new CreateUserDTO(req.body, true));

    res.status(201).json({ user });
  };
}
