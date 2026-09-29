export class ReportController {
  constructor(service) {
    this.service = service;
  }
  summary = async (req, res) => res.json(await this.service.summary(req.user));
}
