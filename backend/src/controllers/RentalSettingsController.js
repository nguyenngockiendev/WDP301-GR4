export class RentalSettingsController {
  constructor(service) {
    this.service = service;
  }

  list = async (req, res) =>
    res.json({ items: await this.service.list(req.params.kind, req.query.building, req.user) });

  create = async (req, res) =>
    res.status(201).json({
      item: await this.service.create(req.params.kind, req.body, req.user),
    });

  update = async (req, res) =>
    res.json({
      item: await this.service.update(req.params.kind, req.params.id, req.body, req.user),
    });
}
