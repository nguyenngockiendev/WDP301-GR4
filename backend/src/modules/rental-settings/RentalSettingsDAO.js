import UtilityRate from './UtilityRate.js';
import ServiceFee from './ServiceFee.js';
import ContractPolicy from '../contracts/ContractPolicy.js';

const models = { rates: UtilityRate, fees: ServiceFee, policies: ContractPolicy };

export class RentalSettingsDAO {
  model(kind) {
    return models[kind];
  }

  list(kind, building) {
    return this.model(kind).find({ building }).sort({ createdAt: -1, _id: -1 }).lean();
  }

  create(kind, data) {
    return this.model(kind).create(data);
  }

  update(kind, id, data) {
    return this.model(kind)
      .findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
      .lean();
  }

  latestPolicyVersion(building) {
    return ContractPolicy.findOne({ building }).sort({ version: -1 }).select('version').lean();
  }

  find(kind, id) {
    return this.model(kind).findById(id).lean();
  }
}
