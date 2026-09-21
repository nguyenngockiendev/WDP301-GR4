export class BuildingDAO {
  constructor(model, roomModel) {
    this.model = model;
    this.roomModel = roomModel;
  }
  create(data) {
    return this.model.create(data);
  }
  list(owner, skip, limit) {
    return this.model
      .find({ owner })
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }
  count(owner) {
    return this.model.countDocuments({ owner });
  }
  findById(id) {
    return this.model.findById(id).lean();
  }
  update(id, data) {
    return this.model
      .findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
      .lean();
  }
  delete(id) {
    return this.model.findByIdAndDelete(id).lean();
  }
  roomCount(id) {
    return this.roomModel.countDocuments({ building: id });
  }
  available(owner) {
    return this.model.find({ owner, status: 'ACTIVE' }).sort({ name: 1 }).lean();
  }
}
