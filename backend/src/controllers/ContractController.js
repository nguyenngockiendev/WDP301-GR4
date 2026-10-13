export class ContractController {
  constructor(service) {
    this.service = service;
  }
  options = async (req, res) => res.json(await this.service.options(req.user));
  create = async (req, res) =>
    res.status(201).json({ item: await this.service.create(req.body, req.user) });
}
