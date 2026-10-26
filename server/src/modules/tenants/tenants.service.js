import Contracts from '../../models/Contracts.js';
import Users from '../../models/Users.js';

export const getTenantsByProperty = async (propertyId) => {
  const contracts = await Contracts.find({ status: 'active' })
    .populate({
      path: 'room',
      match: { property: propertyId },
    })
    .populate('representative', 'fullName email phone')
    .populate('otherMembers', 'fullName email phone');

  const tenantsMap = new Map();

  contracts.forEach(contract => {
    if (contract.room) {
      if (!tenantsMap.has(contract.representative._id.toString())) {
        tenantsMap.set(contract.representative._id.toString(), {
          _id: contract.representative._id,
          fullName: contract.representative.fullName,
          email: contract.representative.email,
          phone: contract.representative.phone,
          contracts: [],
        });
      }
      tenantsMap.get(contract.representative._id.toString()).contracts.push({
        contractId: contract._id,
        room: contract.room,
        startDate: contract.startDate,
        endDate: contract.endDate,
        monthlyRent: contract.monthlyRent,
      });

      contract.otherMembers.forEach(member => {
        if (!tenantsMap.has(member._id.toString())) {
          tenantsMap.set(member._id.toString(), {
            _id: member._id,
            fullName: member.fullName,
            email: member.email,
            phone: member.phone,
            contracts: [],
          });
        }
        tenantsMap.get(member._id.toString()).contracts.push({
          contractId: contract._id,
          room: contract.room,
          startDate: contract.startDate,
          endDate: contract.endDate,
          monthlyRent: contract.monthlyRent,
        });
      });
    }
  });

  return Array.from(tenantsMap.values());
};

export const getTenantById = async (tenantId) => {
  const tenant = await Users.findById(tenantId);
  if (!tenant) {
    throw { status: 404, message: 'Người thuê không tồn tại' };
  }

  const contracts = await Contracts.find({
    $or: [{ representative: tenantId }, { otherMembers: tenantId }],
  })
    .populate('room')
    .populate('template');

  return {
    ...tenant.toObject(),
    contracts,
  };
};

export const searchTenants = async (propertyId, searchTerm) => {
  const contracts = await Contracts.find({ status: 'active' })
    .populate({
      path: 'room',
      match: { property: propertyId },
    })
    .populate('representative', 'fullName email phone')
    .populate('otherMembers', 'fullName email phone');

  const tenantsMap = new Map();

  contracts.forEach(contract => {
    if (contract.room) {
      if (!tenantsMap.has(contract.representative._id.toString())) {
        tenantsMap.set(contract.representative._id.toString(), {
          _id: contract.representative._id,
          fullName: contract.representative.fullName,
          email: contract.representative.email,
          phone: contract.representative.phone,
          contracts: [],
        });
      }
      tenantsMap.get(contract.representative._id.toString()).contracts.push({
        contractId: contract._id,
        room: contract.room,
        startDate: contract.startDate,
        endDate: contract.endDate,
      });

      contract.otherMembers.forEach(member => {
        if (!tenantsMap.has(member._id.toString())) {
          tenantsMap.set(member._id.toString(), {
            _id: member._id,
            fullName: member.fullName,
            email: member.email,
            phone: member.phone,
            contracts: [],
          });
        }
      });
    }
  });

  const tenants = Array.from(tenantsMap.values());

  if (searchTerm) {
    return tenants.filter(tenant =>
      tenant.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tenant.phone && tenant.phone.includes(searchTerm)),
    );
  }

  return tenants;
};
