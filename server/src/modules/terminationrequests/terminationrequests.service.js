import mongoose from 'mongoose';

import TerminationRequests from '../../models/TerminationRequests.js';
import Contracts from '../../models/Contracts.js';

const isContractCurrentlyActive = (contract, now = new Date()) => {
  return (
    contract.status === 'active' &&
    new Date(contract.startDate) <= now &&
    new Date(contract.endDate) >= now
  );
};

const userBelongsToContract = (contract, userId) => {
  const currentUserId = userId.toString();

  const isRepresentative =
    contract.representative?.toString() === currentUserId;

  const isMember = (contract.otherMembers || []).some(
    member => member.toString() === currentUserId,
  );

  return isRepresentative || isMember;
};

// Kiểm tra người dùng có ít nhất một hợp đồng active và còn thời hạn hay không.
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
  const { contractId, reason } = data;

  if (!mongoose.Types.ObjectId.isValid(contractId)) {
    throw {
      status: 400,
      message: 'ID hợp đồng không hợp lệ',
    };
  }

  const contract = await Contracts.findById(contractId);

  if (!contract) {
    throw {
      status: 404,
      message: 'Hợp đồng không tồn tại',
    };
  }

  if (!isContractCurrentlyActive(contract)) {
    throw {
      status: 400,
      message: 'Chỉ có thể gửi yêu cầu với hợp đồng đang hoạt động và còn thời hạn',
    };
  }

  if (!userBelongsToContract(contract, userId)) {
    throw {
      status: 403,
      message: 'Bạn không thuộc hợp đồng này',
    };
  }

  const existingRequest = await TerminationRequests.findOne({
    contract: contractId,
    status: { $in: ['pending', 'approved'] },
  });

  if (existingRequest) {
    throw {
      status: 400,
      message: 'Hợp đồng này đã có yêu cầu trả phòng đang được xử lý',
    };
  }

  const terminationRequest = await TerminationRequests.create({
    contract: contractId,
    requestedBy: userId,
    requestedDate: new Date(),
    reason: reason.trim(),
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
