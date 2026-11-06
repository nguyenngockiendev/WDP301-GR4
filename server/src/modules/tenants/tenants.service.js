import Contracts from '../../models/Contracts.js';
import Rooms from '../../models/Rooms.js';
import Users from '../../models/Users.js';
import { assertPropertyAccess, getMyProperties } from '../properties/properties.service.js';

// Chỉ trả các trường an toàn của user (không bao giờ trả password, googleId...)
const SAFE_USER_FIELDS = 'fullName email phone status isVerified createdAt';

/** Gom người thuê (đại diện + người ở cùng) từ các hợp đồng đang hiệu lực của nhà trọ. */
export const getTenantsByProperty = async (propertyId, user, searchTerm = '') => {
  await assertPropertyAccess(user, propertyId);

  const roomIds = await Rooms.find({ property: propertyId }).distinct('_id');
  const contracts = await Contracts.find({ room: { $in: roomIds }, status: 'active' })
    .populate('room', 'roomNumber')
    .populate('representative', SAFE_USER_FIELDS)
    .populate('otherMembers', SAFE_USER_FIELDS);

  const tenantsMap = new Map();

  const addTenant = (member, contract, roleInContract) => {
    if (!member) return;
    const key = member._id.toString();
    if (!tenantsMap.has(key)) {
      tenantsMap.set(key, {
        _id: member._id,
        fullName: member.fullName,
        email: member.email,
        phone: member.phone,
        status: member.status,
        isRepresentative: false,
        contracts: [],
      });
    }
    const tenant = tenantsMap.get(key);
    if (roleInContract === 'representative') tenant.isRepresentative = true;
    tenant.contracts.push({
      contractId: contract._id,
      room: contract.room,
      startDate: contract.startDate,
      endDate: contract.endDate,
      monthlyRent: contract.monthlyRent,
      memberCount: 1 + contract.otherMembers.length,
      roleInContract,
    });
  };

  contracts.forEach(contract => {
    addTenant(contract.representative, contract, 'representative');
    contract.otherMembers.forEach(member => addTenant(member, contract, 'member'));
  });

  let tenants = Array.from(tenantsMap.values());

  const kw = String(searchTerm || '').trim().toLowerCase();
  if (kw) {
    tenants = tenants.filter(t =>
      [t.fullName, t.email, t.phone, ...t.contracts.map(c => c.room?.roomNumber)]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(kw)),
    );
  }

  return tenants.sort((a, b) => String(a.fullName).localeCompare(String(b.fullName), 'vi'));
};

/** Chi tiết người thuê + lịch sử hợp đồng, chỉ trong các nhà trọ user được quản lý. */
export const getTenantById = async (tenantId, user) => {
  const tenant = await Users.findOne({ _id: tenantId, role: 'tenant' }).select(SAFE_USER_FIELDS);
  if (!tenant) {
    throw { status: 404, message: 'Người thuê không tồn tại' };
  }

  const properties = await getMyProperties(user);
  const roomIds = await Rooms.find({ property: { $in: properties.map(p => p._id) } }).distinct('_id');

  const contracts = await Contracts.find({
    room: { $in: roomIds },
    $or: [{ representative: tenantId }, { otherMembers: tenantId }],
  })
    .sort({ startDate: -1 })
    .populate({ path: 'room', select: 'roomNumber property', populate: { path: 'property', select: 'name' } })
    .populate('representative', 'fullName phone')
    .populate('otherMembers', 'fullName phone');

  if (contracts.length === 0) {
    throw { status: 403, message: 'Người thuê này không thuộc nhà trọ bạn quản lý!' };
  }

  return { ...tenant.toObject(), contracts };
};
