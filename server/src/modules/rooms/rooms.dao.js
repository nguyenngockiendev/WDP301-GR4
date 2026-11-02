export class ListingDAO {
  assignManager(id, manager) {
    return this.model.findByIdAndUpdate(
      id,
      { $set: { manager } },
      { new: true, runValidators: true },
    );
  }
  assignBuilding(id, building, manager) {
    return this.model.findByIdAndUpdate(
      id,
      { $set: { building, manager } },
      { new: true, runValidators: true },
    );
  }
  updatePrice(id, price) {
    return this.model.findByIdAndUpdate(
      id,
      { $set: { price } },
      { new: true, runValidators: true },
    );
  }
  constructor(model, rentRateModel) {
    this.model = model;
    this.rentRateModel = rentRateModel;
  }
  create(data) {
    return this.model.create(data);
  }
  createMany(data) {
    return this.model.insertMany(data);
  }
  async saveRentRate(room, amount, effectiveFrom, createdBy) {
    return this.rentRateModel.create({ room, amount, effectiveFrom, createdBy });
  }
  rentRates(room) {
    return this.rentRateModel.find({ room }).sort({ effectiveFrom: -1 }).lean();
  }
  rentRateExists(room, effectiveFrom) {
    return this.rentRateModel.exists({ room, effectiveFrom });
  }
  list(filter, skip, limit) {
    return this.model.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit);
  }
  count(filter) {
    return this.model.countDocuments(filter);
  }
  findById(id) {
    return this.model.findById(id);
  }
}
