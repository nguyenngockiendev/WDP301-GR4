import { pageNumber } from './UserController.js';
export class WorkspaceController {
  constructor(service) {
    this.service = service;
  }

  dashboard = async (req, res) => {
    const dashboard = await this.service.dashboard(req.user);

    res.json(dashboard);
  };

  list = async (req, res) => {
    const page = pageNumber(req.query.page);
    const result = await this.service.list(req.params.module, req.user, page);

    res.json({ page, ...result });
  };
}
