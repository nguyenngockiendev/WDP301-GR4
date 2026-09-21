export class ListingDAO {
  assignManager(id, manager) {
    return this.model.findByIdAndUpdate(
      id,
      { $set: { manager } },
      { new: true, runValidators: true },
    );
  }
  assignBuilding(id, building) {
    return this.model.findByIdAndUpdate(
      id,
      { $set: { building } },
      { new: true, runValidators: true },
    );
  }
  constructor(model) {
    this.model = model;
  }
  create(data) {
    return this.model.create(data);
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
