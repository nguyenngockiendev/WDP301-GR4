import mongoose from 'mongoose';
import TerminationRequests from '../../models/TerminationRequests.js';
import Contracts from '../../models/Contracts.js';
import Rooms from '../../models/Rooms.js';
import ManagerAssignments from '../../models/ManagerAssignments.js';
import { validateCreateTerminationRequest } from './terminationrequests.validation.js';

// Kiểm tra người dùng có hợp đồng active và còn thời hạn hay không.
export const canSubmitCheckoutRequest = async (userId) => {
  const now = new Date();

  const contract = await Contracts.findOne({
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { representative: userId },
      { otherMembers: userId },
    ],
  })
    .select('_id room startDate endDate status')
    .populate('room', 'roomNumber');

  return contract;
};

export const createTerminationRequest = async (data, userId) => {
  const validationError = validateCreateTerminationRequest(data);

  if (validationError) {
    throw {
      status: 400,
      message: validationError,
    };
  }

  // Không nhận contractId từ frontend. Backend tự tìm hợp đồng theo JWT userId.
  const contract = await canSubmitCheckoutRequest(userId);

  if (!contract) {
    throw {
      status: 400,
      message: 'Bạn không có hợp đồng đang hoạt động và còn thời hạn để gửi yêu cầu trả phòng',
    };
  }

  const existingRequest = await TerminationRequests.findOne({
    contract: contract._id,
    status: { $in: ['pending', 'approved'] },
  });

  if (existingRequest) {
    throw {
      status: 400,
      message: 'Hợp đồng này đã có yêu cầu trả phòng đang được xử lý',
    };
  }

  const terminationRequest = await TerminationRequests.create({
    contract: contract._id,
    requestedBy: userId,
    requestedDate: new Date(),
    moveOutDate: new Date(`${data.moveOutDate}T00:00:00.000Z`),
    reason: data.reason.trim(),
    status: 'pending',
  });

  return terminationRequest.populate([
    {
      path: 'contract',
      populate: {
        path: 'room',
      },
    },
    {
      path: 'requestedBy',
      select: 'fullName email phone',
    },
  ]);
};

export const getMyTerminationRequests = async (userId) => {
  const requests = await TerminationRequests.find({
    requestedBy: userId,
  })
    .sort({ requestedDate: -1, createdAt: -1 })
    .populate({
      path: 'contract',
      select: 'room startDate endDate monthlyRent depositAmount status',
      populate: {
        path: 'room',
        select: 'roomNumber area price status',
      },
    })
    .lean();

  return requests;
};

const getManagerContractIds = async (managerId) => {
    const assignment = await ManagerAssignments.findOne({
        manager: managerId,
        status: 'active',
    }).select('property');

    if (!assignment) {
        throw {
            status: 404,
            message: 'Bạn chưa được phân công Property nào đang hoạt động',
        };
    }

    const rooms = await Rooms.find({
        property: assignment.property,
    }).select('_id');

    const roomIds = rooms.map((room) => room._id);

    if (roomIds.length === 0) {
        return [];
    }

    const contracts = await Contracts.find({
        room: { $in: roomIds },
    }).select('_id');

    return contracts.map((contract) => contract._id);
};

export const getManagerTerminationRequests = async (managerId, filters = {}) => {
    const contractIds = await getManagerContractIds(managerId);

    if (contractIds.length === 0) {
        return [];
    }

    const query = {
        contract: { $in: contractIds },
    };

    if (filters.status && filters.status !== 'all') {
        query.status = filters.status;
    }

    let requests = await TerminationRequests.find(query)
        .populate({
            path: 'contract',
            select: 'room representative startDate endDate monthlyRent depositAmount status',
            populate: [
                {
                    path: 'room',
                    select: 'roomNumber area price status',
                },
                {
                    path: 'representative',
                    select: 'fullName email phone',
                },
            ],
        })
        .populate('requestedBy', 'fullName email phone')
        .populate('processedBy', 'fullName')
        .lean();

    // Tìm theo tên phòng
    const roomKeyword = filters.room?.trim().toLowerCase();

    if (roomKeyword) {
        requests = requests.filter((request) =>
            request.contract?.room?.roomNumber
                ?.toLowerCase()
                .includes(roomKeyword)
        );
    }

    // Tìm theo người đứng tên hợp đồng
    const tenantKeyword = filters.tenant?.trim().toLowerCase();

    if (tenantKeyword) {
        requests = requests.filter((request) =>
            request.contract?.representative?.fullName
                ?.toLowerCase()
                .includes(tenantKeyword)
        );
    }

    // Yêu cầu cũ nhất đứng trước
    requests.sort(
        (a, b) =>
            new Date(a.requestedDate || a.createdAt) -
            new Date(b.requestedDate || b.createdAt)
    );

    return requests;
};

export const getManagerTerminationRequestDetail = async (managerId, requestId) => {
    if (!mongoose.isValidObjectId(requestId)) {
        throw {
            status: 400,
            message: 'ID checkout request không hợp lệ',
        };
    }

    const contractIds = await getManagerContractIds(managerId);

    const request = await TerminationRequests.findOne({
        _id: requestId,
        contract: { $in: contractIds },
    })
        .populate({
            path: 'contract',
            select: 'room representative otherMembers startDate endDate monthlyRent depositAmount status',
            populate: [
                {
                    path: 'room',
                    select: 'roomNumber area price status',
                },
                {
                    path: 'representative',
                    select: 'fullName email phone',
                },
            ],
        })
        .populate('requestedBy', 'fullName email phone')
        .populate('processedBy', 'fullName')
        .lean();

    if (!request) {
        throw {
            status: 404,
            message: 'Không tìm thấy checkout request trong Property bạn quản lý',
        };
    }

    return request;
};
