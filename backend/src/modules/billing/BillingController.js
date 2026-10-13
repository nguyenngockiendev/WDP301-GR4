export class BillingController {
  constructor(service) {
    this.service = service;
  }
  reading = async (req, res) =>
    res.status(201).json({ item: await this.service.recordReading(req.body, req.user) });
  invoice = async (req, res) =>
    res.status(201).json({ item: await this.service.createInvoice(req.body, req.user) });
}
