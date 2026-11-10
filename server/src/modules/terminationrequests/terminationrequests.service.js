import mongoose from 'mongoose';
import TerminationRequests from '../../models/TerminationRequests.js';
import Contracts from '../../models/Contracts.js';
import Rooms from '../../models/Rooms.js';
import Assets from '../../models/Assets.js';
import Invoices from '../../models/Invoices.js';
import Payments from '../../models/Payments.js';
import { createNotification } from '../notifications/notifications.service.js';
import UtilityReadings from '../../models/UtilityReadings.js';
import Properties from '../../models/Properties.js';
import ManagerAssignments from '../../models/ManagerAssignments.js';
import { validateCreateTerminationRequest } from './terminationrequests.validation.js';

// Kiểm tra người dùng có hợp đồng active và còn thời hạn hay không.
export const canSubmitCheckoutRequest = async (userId, contractId) => {
  if (contractId !== undefined && (typeof contractId !== 'string' || !mongoose.isObjectIdOrHexString(contractId))) {
    throw { status: 400, message: 'Mã hợp đồng không hợp lệ' };
  }
  const now = new Date();

  const contract = await Contracts.findOne({
    ...(contractId ? { _id: contractId } : {}),
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

  const contract = await canSubmitCheckoutRequest(userId, data.contractId);

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

    const paymentInvoiceIds = request.checkoutSettlement?.paymentInvoiceIds || [];
    if (paymentInvoiceIds.length) {
        const paymentInvoices = await Invoices.find({ _id: { $in: paymentInvoiceIds } })
            .select('_id totalAmount paidAmount status')
            .lean();
        request.checkoutSettlement.paymentCompleted =
            paymentInvoices.length === paymentInvoiceIds.length
            && paymentInvoices.every(invoice =>
                invoice.status === 'paid' && Number(invoice.paidAmount || 0) >= Number(invoice.totalAmount || 0)
            );
    } else if (request.checkoutSettlement) {
        request.checkoutSettlement.paymentCompleted = false;
    }

    return request;
};


// ================= CHECKOUT ASSET INSPECTION =================

const getManagerCheckoutContext = async (managerId, requestId) => {
    if (!mongoose.isValidObjectId(requestId)) {
        throw { status: 400, message: 'ID checkout request không hợp lệ' };
    }

    const contractIds = await getManagerContractIds(managerId);
    const request = await TerminationRequests.findOne({
        _id: requestId,
        contract: { $in: contractIds },
    }).populate({ path: 'contract', select: 'room representative monthlyRent depositAmount startDate endDate utilityRateSnapshot signing.depositInvoice' });

    if (!request || !request.contract) {
        throw {
            status: 404,
            message: 'Không tìm thấy checkout request trong Property bạn quản lý',
        };
    }

    const room = await Rooms.findById(request.contract.room).select('_id property roomNumber');
    if (!room) throw { status: 404, message: 'Không tìm thấy phòng của hợp đồng' };

    return { request, room };
};

const serializeAssetInspection = (assets, invoice) => {
    const itemByAsset = new Map((invoice?.items || []).filter(item => item.asset).map(item => [String(item.asset), item]));
    const invoiceSummary = invoice ? {
        _id: invoice._id,
        invoiceType: invoice.invoiceType,
        billingMonth: invoice.billingMonth,
        totalAmount: invoice.totalAmount,
        paidAmount: invoice.paidAmount,
        dueDate: invoice.dueDate,
        status: invoice.status,
        sentAt: invoice.sentAt,
    } : null;

    return {
        invoice: invoiceSummary,
        assets: assets.map((asset) => {
            const invoiceItem = itemByAsset.get(String(asset._id));
            return {
                _id: asset._id,
                name: asset.name,
                category: asset.category,
                brand: asset.brand,
                model: asset.model,
                assetCode: asset.assetCode,
                purchasePrice: asset.purchasePrice || 0,
                status: asset.status,
                invoiceId: asset.invoiceId || null,
                inspectionStatus: invoiceItem?.assetStatus || asset.status,
                maintenanceCost: invoiceItem?.assetStatus === 'maintenance' ? invoiceItem.amount : 0,
                images: invoiceItem?.images || [],
            };
        }),
    };
};

const validateBase64Image = (image) => {
    if (typeof image !== 'string') return false;
    // Chỉ nhận data URL ảnh JPEG, PNG hoặc WebP; tối đa khoảng 1.5 MB/ảnh.
    if (image.length > 2_100_000) return false;
    return /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image);
};

export const getCheckoutAssetInspection = async (managerId, requestId) => {
    const { request, room } = await getManagerCheckoutContext(managerId, requestId);
    const [assets, invoice] = await Promise.all([
        Assets.find({ property: room.property, room: room._id }).sort({ name: 1 }).lean(),
        Invoices.findOne({
            contract: request.contract._id,
            terminationRequest: request._id,
            invoiceType: 'checkout_asset',
        }).lean(),
    ]);

    return serializeAssetInspection(assets, invoice);
};

// Tạo invoice một lần cho mỗi checkout request và gắn invoiceId vào Asset của phòng.
export const startCheckoutAssetInspection = async (managerId, requestId) => {
    const { request, room } = await getManagerCheckoutContext(managerId, requestId);
    if (['rejected', 'completed'].includes(request.status)) {
        throw { status: 400, message: 'Không thể kiểm tra tài sản cho yêu cầu đã bị từ chối hoặc hoàn tất' };
    }

    const assets = await Assets.find({ property: room.property, room: room._id }).sort({ name: 1 });
    if (assets.length === 0) {
        throw { status: 400, message: 'Phòng này chưa có tài sản được gán để kiểm tra' };
    }

    let invoice = await Invoices.findOne({
        contract: request.contract._id,
        terminationRequest: request._id,
        invoiceType: 'checkout_asset',
    });

    if (!invoice) {
        await Invoices.init();
        try {
            invoice = await Invoices.create({
                contract: request.contract._id,
                billedTo: request.contract.representative,
                invoiceType: 'checkout_asset',
                terminationRequest: request._id,
                // Dùng mã kỳ riêng để không đụng unique index contract + billingMonth của hóa đơn tháng.
                billingMonth: `CHECKOUT-${request._id}`,
                items: [],
                images: [],
                totalAmount: 0,
                paidAmount: 0,
                dueDate: request.moveOutDate || new Date(),
                status: 'draft',
                createdBy: managerId,
            });
        } catch (error) {
            // Tránh tạo hai invoice nếu Manager bấm bắt đầu gần như đồng thời.
            if (error.code !== 11000) throw error;
            invoice = await Invoices.findOne({
                contract: request.contract._id,
                terminationRequest: request._id,
                invoiceType: 'checkout_asset',
            });
            if (!invoice) throw error;
        }
    }

    await Assets.updateMany(
        { property: room.property, room: room._id },
        { $set: { invoiceId: invoice._id } },
    );

    const refreshedAssets = await Assets.find({ property: room.property, room: room._id }).sort({ name: 1 }).lean();
    return serializeAssetInspection(refreshedAssets, invoice.toObject());
};

// Lưu kết quả kiểm tra. Giá trị retired luôn lấy từ purchasePrice trong DB.
export const saveCheckoutAssetInspection = async (managerId, requestId, data) => {
    const { request, room } = await getManagerCheckoutContext(managerId, requestId);

    if (request.checkoutSettlement?.paymentRequestedAt || request.checkoutSettlement?.refundConfirmedAt) {
        throw { status: 409, message: 'Không thể sửa kiểm tra tài sản sau khi đã bắt đầu thanh toán/hoàn cọc' };
    }
    if (['rejected', 'completed'].includes(request.status)) {
        throw { status: 400, message: 'Không thể cập nhật kiểm tra tài sản cho yêu cầu đã bị từ chối hoặc hoàn tất' };
    }

    const invoice = await Invoices.findOne({
        contract: request.contract._id,
        terminationRequest: request._id,
        invoiceType: 'checkout_asset',
    });
    if (!invoice) {
        throw { status: 400, message: 'Vui lòng bắt đầu kiểm tra tài sản trước' };
    }
    if (!Array.isArray(data.assets)) {
        throw { status: 400, message: 'Danh sách tài sản kiểm tra không hợp lệ' };
    }

    const roomAssets = await Assets.find({
        property: room.property,
        room: room._id,
        invoiceId: invoice._id,
    });

    if (data.assets.length !== roomAssets.length) {
        throw { status: 400, message: 'Vui lòng kiểm tra đầy đủ tất cả tài sản trong phòng' };
    }

    const submittedById = new Map();
    for (const item of data.assets) {
        const id = String(item.assetId || '');
        if (!mongoose.isValidObjectId(id) || submittedById.has(id)) {
            throw { status: 400, message: 'Danh sách Asset chứa ID không hợp lệ hoặc bị trùng' };
        }
        submittedById.set(id, item);
    }

    const invoiceItems = [];
    const invoiceImages = [];
    let totalImageCharacters = 0;
    const updates = [];
    let totalAmount = 0;

    for (const asset of roomAssets) {
        const item = submittedById.get(String(asset._id));
        if (!item) throw { status: 400, message: 'Có tài sản chưa được kiểm tra' };

        const status = item.status;
        if (!['in_use', 'maintenance', 'retired'].includes(status)) {
            throw { status: 400, message: `Trạng thái của tài sản ${asset.name} không hợp lệ` };
        }

        let amount = 0;
        let description = `${asset.name} - Bình thường`;
        let images = [];

        if (status === 'maintenance') {
            amount = item.maintenanceCost === '' || item.maintenanceCost === undefined
                ? NaN
                : Number(item.maintenanceCost);
            if (!Number.isSafeInteger(amount) || amount < 0) {
                throw { status: 400, message: `Chi phí bảo trì của ${asset.name} không hợp lệ` };
            }
            images = Array.isArray(item.images) ? item.images : [];
            if (images.length === 0) {
                throw { status: 400, message: `Vui lòng tải ít nhất một ảnh hóa đơn bảo trì cho ${asset.name}` };
            }
            if (!images.every(validateBase64Image)) {
                throw { status: 400, message: `Ảnh hóa đơn của ${asset.name} không hợp lệ hoặc vượt quá dung lượng cho phép` };
            }
            totalImageCharacters += images.reduce((sum, image) => sum + image.length, 0);
            if (totalImageCharacters > 10_000_000) {
                throw { status: 413, message: 'Tổng dung lượng ảnh vượt quá giới hạn 10 MB cho một lần lưu' };
            }
            description = `${asset.name} - Chi phí bảo trì`;
        } else if (status === 'retired') {
            amount = Number(asset.purchasePrice || 0);
            description = `${asset.name} - Giá trị tài sản thanh lý`;
            if (!Number.isSafeInteger(amount) || amount < 0) {
                throw { status: 400, message: `Giá trị tài sản ${asset.name} không hợp lệ` };
            }
        } else if (Array.isArray(item.images) && item.images.length > 0) {
            throw { status: 400, message: `Tài sản ${asset.name} đang bình thường không cần ảnh hóa đơn` };
        }

        totalAmount += amount;
        if (!Number.isSafeInteger(totalAmount)) {
            throw { status: 400, message: 'Tổng tiền kiểm tra tài sản vượt quá giới hạn hợp lệ' };
        }

        invoiceImages.push(...images);
        invoiceItems.push({
            type: 'other',
            description,
            quantity: 1,
            unitPrice: amount,
            amount,
            asset: asset._id,
            assetStatus: status,
            images,
        });
        updates.push({ asset, status });
    }

    // Chỉ cập nhật DB sau khi toàn bộ dữ liệu đầu vào đã được kiểm tra.
    for (const { asset, status } of updates) {
        asset.status = status;
        asset.invoiceId = invoice._id;
        await asset.save();
    }

    const nonAssetItems = (invoice.items || []).filter(
        existingItem => ['electricity', 'water'].includes(existingItem.type)
          || String(existingItem.description || '').startsWith('Phạt chấm dứt hợp đồng'),
    );
    invoice.items = [...invoiceItems, ...nonAssetItems];
    invoice.images = invoice.items.flatMap(item => item.images || []);
    invoice.totalAmount = invoice.items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    invoice.status = invoice.totalAmount > 0 ? 'unpaid' : 'paid';
    invoice.paidAmount = 0;
    invoice.sentAt = null;
    invoice.adjustedBy = managerId;
    await invoice.save();

    const savedAssets = await Assets.find({ property: room.property, room: room._id, invoiceId: invoice._id })
        .sort({ name: 1 })
        .lean();

    return serializeAssetInspection(savedAssets, invoice.toObject());
};


// ================= CHECKOUT RECONCILIATION =================

const getCheckoutMonth = (dateValue) => {
    const date = new Date(dateValue || new Date());
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const getNextMonth = (dateValue) => {
    const date = new Date(dateValue || new Date());
    const next = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
};

// Chia tháng thành 4 phần: ngày 1-7, 8-14, 15-21, 22-cuối tháng.
// Dùng ngày trong tháng checkout để xác định tuần đang ở, theo quy tắc đã thống nhất.
const calculateEarlyTerminationPenalty = (contract, moveOutDate) => {
    const checkoutDate = new Date(moveOutDate);
    const endDate = new Date(contract.endDate);
    const isEarly = checkoutDate < endDate;
    if (!isEarly) {
        return {
            applies: false, billingMonth: '', weekNumber: 0,
            completedWeeks: 0, weeklyRent: 0, amount: 0,
        };
    }

    const weekNumber = Math.min(4, Math.ceil(checkoutDate.getDate() / 7));
    const completedWeeks = weekNumber - 1;
    const weeklyRent = Math.round(Number(contract.monthlyRent || 0) / 4);
    const amount = weeklyRent * (4 - completedWeeks);

    return {
        applies: true,
        billingMonth: getNextMonth(checkoutDate),
        weekNumber,
        completedWeeks,
        weeklyRent,
        amount,
    };
};

const getCheckoutReconciliationData = async (managerId, requestId) => {
    const { request, room } = await getManagerCheckoutContext(managerId, requestId);
    const contract = request.contract;
    const checkoutDate = request.moveOutDate || new Date();
    const billingMonth = getCheckoutMonth(checkoutDate);

    const [property, currentMonthReading, previousReading, debts, assetInvoice, depositInvoice] = await Promise.all([
        Properties.findById(room.property).select('utilityRate').lean(),
        UtilityReadings.findOne({ room: room._id, billingMonth }).lean(),
        UtilityReadings.findOne({ room: room._id, billingMonth: { $lt: billingMonth } })
            .sort({ billingMonth: -1 }).lean(),
        Invoices.find({
            contract: contract._id,
            status: { $in: ['unpaid', 'partially_paid', 'overdue'] },
            $or: [{ invoiceType: 'monthly' }, { invoiceType: { $exists: false } }],
        }).sort({ billingMonth: 1, createdAt: 1 }).select('_id billingMonth items totalAmount paidAmount status dueDate').lean(),
        Invoices.findOne({
            contract: contract._id,
            terminationRequest: request._id,
            invoiceType: 'checkout_asset',
        }).select('_id items totalAmount status').lean(),
        contract.signing?.depositInvoice
            ? Invoices.findOne({ _id: contract.signing.depositInvoice, contract: contract._id, invoiceType: 'deposit' })
                .select('paidAmount').lean()
            : null,
    ]);

    // Nếu đã có chỉ số trong kỳ checkout, lấy chỉ số cũ của kỳ đó làm mốc.
    const oldElectricity = currentMonthReading?.oldElectricity
        ?? previousReading?.newElectricity ?? 0;
    const oldWater = currentMonthReading?.oldWater
        ?? previousReading?.newWater ?? 0;

    const electricityPrice = Number(
        contract.utilityRateSnapshot?.electricityPrice
        ?? property?.utilityRate?.electricityPrice ?? 0
    );
    const waterPrice = Number(
        contract.utilityRateSnapshot?.waterPrice
        ?? property?.utilityRate?.waterPrice ?? 0
    );

    const debtInvoices = debts.map(invoice => ({
        _id: invoice._id,
        billingMonth: invoice.billingMonth,
        totalAmount: invoice.totalAmount || 0,
        paidAmount: invoice.paidAmount || 0,
        remainingAmount: Math.max(0, Number(invoice.totalAmount || 0) - Number(invoice.paidAmount || 0)),
        status: invoice.status,
        dueDate: invoice.dueDate,
    })).filter(invoice => invoice.remainingAmount > 0);

    const previousDebtAmount = debtInvoices.reduce((sum, invoice) => sum + invoice.remainingAmount, 0);
    const assetAmount = (assetInvoice?.items || []).filter(item => item.asset).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const saved = request.checkoutReconciliation || {};
    const penalty = calculateEarlyTerminationPenalty(contract, checkoutDate);

    return {
        billingMonth,
        checkoutDate,
        oldElectricity,
        oldWater,
        newElectricity: saved.electricity?.newIndex ?? currentMonthReading?.newElectricity ?? '',
        newWater: saved.water?.newIndex ?? currentMonthReading?.newWater ?? '',
        electricityPrice,
        waterPrice,
        debtInvoices,
        previousDebtAmount,
        assetAmount,
        penalty,
        depositAmount: contract.signing?.depositInvoice
            ? Number(depositInvoice?.paidAmount || 0)
            : Number(contract.depositAmount || 0),
        savedReconciliation: saved.calculatedAt ? saved : null,
        utilityInvoice: assetInvoice ? {
            _id: assetInvoice._id,
            totalAmount: assetInvoice.totalAmount,
            status: assetInvoice.status,
        } : null,
    };
};

export const getCheckoutReconciliation = async (managerId, requestId) => {
    return getCheckoutReconciliationData(managerId, requestId);
};

export const saveCheckoutReconciliation = async (managerId, requestId, data) => {
    const { request, room } = await getManagerCheckoutContext(managerId, requestId);
    if (request.checkoutSettlement?.paymentRequestedAt || request.checkoutSettlement?.refundConfirmedAt) {
        throw { status: 409, message: 'Không thể thay đổi quyết toán sau khi đã bắt đầu thanh toán/hoàn cọc' };
    }
    if (['rejected', 'completed'].includes(request.status)) {
        throw { status: 400, message: 'Không thể đối soát yêu cầu đã bị từ chối hoặc hoàn tất' };
    }

    const invoice = await Invoices.findOne({
        contract: request.contract._id,
        terminationRequest: request._id,
        invoiceType: 'checkout_asset',
    });
    if (!invoice) {
        throw { status: 400, message: 'Vui lòng bắt đầu kiểm tra tài sản trước khi đối soát checkout' };
    }

    const dataBeforeSave = await getCheckoutReconciliationData(managerId, requestId);
    const newElectricity = Number(data.newElectricity);
    const newWater = Number(data.newWater);
    if (!Number.isFinite(newElectricity) || newElectricity < dataBeforeSave.oldElectricity) {
        throw { status: 400, message: 'Chỉ số điện cuối phải lớn hơn hoặc bằng chỉ số điện đầu kỳ' };
    }
    if (!Number.isFinite(newWater) || newWater < dataBeforeSave.oldWater) {
        throw { status: 400, message: 'Chỉ số nước cuối phải lớn hơn hoặc bằng chỉ số nước đầu kỳ' };
    }

    const electricityUsed = newElectricity - dataBeforeSave.oldElectricity;
    const waterUsed = newWater - dataBeforeSave.oldWater;
    const electricityAmount = Math.round(electricityUsed * dataBeforeSave.electricityPrice);
    const waterAmount = Math.round(waterUsed * dataBeforeSave.waterPrice);
    const utilityAmount = electricityAmount + waterAmount;
    const penalty = dataBeforeSave.penalty;
    const previousDebtAmount = dataBeforeSave.previousDebtAmount;
    const assetAmount = (invoice.items || []).filter(item => item.asset).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalDeductions = previousDebtAmount + assetAmount + utilityAmount + penalty.amount;
    const depositAmount = dataBeforeSave.depositAmount;
    const depositRefund = Math.max(0, depositAmount - totalDeductions);
    const additionalPayment = Math.max(0, totalDeductions - depositAmount);

    const utilityItems = [
        {
            type: 'electricity',
            description: `Điện checkout ${dataBeforeSave.billingMonth} (${electricityUsed} kWh)`,
            quantity: electricityUsed,
            unitPrice: dataBeforeSave.electricityPrice,
            amount: electricityAmount,
        },
        {
            type: 'water',
            description: `Nước checkout ${dataBeforeSave.billingMonth} (${waterUsed} m³)`,
            quantity: waterUsed,
            unitPrice: dataBeforeSave.waterPrice,
            amount: waterAmount,
        },
    ];
    const penaltyItem = penalty.amount > 0 ? [{
        type: 'other',
        description: `Phạt chấm dứt hợp đồng trước hạn - kỳ ${penalty.billingMonth} (${4 - penalty.completedWeeks} tuần)`,
        quantity: 4 - penalty.completedWeeks,
        unitPrice: penalty.weeklyRent,
        amount: penalty.amount,
    }] : [];

    const existingNonCheckoutItems = (invoice.items || []).filter(
        item => item.asset || (
            !['electricity', 'water'].includes(item.type)
            && !String(item.description || '').startsWith('Phạt chấm dứt hợp đồng')
        ),
    );
    invoice.items = [...existingNonCheckoutItems, ...utilityItems, ...penaltyItem];
    invoice.totalAmount = invoice.items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    invoice.status = invoice.totalAmount > 0 ? 'unpaid' : 'paid';
    invoice.sentAt = null;
    invoice.adjustedBy = managerId;
    await invoice.save();

    request.checkoutReconciliation = {
        billingMonth: dataBeforeSave.billingMonth,
        electricity: {
            oldIndex: dataBeforeSave.oldElectricity,
            newIndex: newElectricity,
            used: electricityUsed,
            unitPrice: dataBeforeSave.electricityPrice,
            amount: electricityAmount,
        },
        water: {
            oldIndex: dataBeforeSave.oldWater,
            newIndex: newWater,
            used: waterUsed,
            unitPrice: dataBeforeSave.waterPrice,
            amount: waterAmount,
        },
        previousDebtAmount,
        previousDebtInvoiceIds: dataBeforeSave.debtInvoices.map(item => item._id),
        assetAmount,
        utilityAmount,
        penalty,
        totalDeductions,
        depositAmount,
        depositRefund,
        additionalPayment,
        calculatedBy: managerId,
        calculatedAt: new Date(),
    };
    await request.save();

    return {
        invoice: {
            _id: invoice._id,
            totalAmount: invoice.totalAmount,
            status: invoice.status,
            items: invoice.items,
        },
        reconciliation: request.checkoutReconciliation,
        summary: {
            depositAmount,
            previousDebtAmount,
            assetAmount,
            utilityAmount,
            penaltyAmount: penalty.amount,
            totalDeductions,
            depositRefund,
            additionalPayment,
        },
    };
};


// ================= CHECKOUT PAYMENT / REFUND / FINAL CONFIRMATION =================

// Manager yêu cầu Tenant thanh toán phần công nợ còn lại sau khi đã cấn trừ tiền cọc.
// Các hóa đơn công nợ cũ và hóa đơn checkout tài sản vẫn được thanh toán qua module Payments hiện có.
export const requestCheckoutPayment = async (managerId, requestId) => {
    const { request, room } = await getManagerCheckoutContext(managerId, requestId);
    const reconciliation = request.checkoutReconciliation;
    if (!reconciliation?.calculatedAt) {
        throw { status: 400, message: 'Vui lòng lưu quyết toán tiền cọc trước khi yêu cầu thanh toán' };
    }
    if (Number(reconciliation.additionalPayment || 0) <= 0) {
        throw { status: 400, message: 'Checkout này không phát sinh khoản cần Tenant thanh toán thêm' };
    }
    if (request.status === 'completed' || request.status === 'rejected') {
        throw { status: 400, message: 'Không thể yêu cầu thanh toán cho checkout đã kết thúc' };
    }
    if (request.checkoutSettlement?.paymentRequestedAt) {
        return {
            paymentRequestedAt: request.checkoutSettlement.paymentRequestedAt,
            paymentInvoiceIds: request.checkoutSettlement.paymentInvoiceIds || [],
            alreadyRequested: true,
        };
    }

    const session = await mongoose.startSession();
    let notificationPayload = null;
    let result = null;
    try {
        await session.withTransaction(async () => {
            const freshRequest = await TerminationRequests.findById(request._id).session(session);
            if (!freshRequest || ['completed', 'rejected'].includes(freshRequest.status)) {
                throw { status: 409, message: 'Checkout request không còn ở trạng thái có thể yêu cầu thanh toán' };
            }
            if (freshRequest.checkoutSettlement?.paymentRequestedAt) {
                result = {
                    paymentRequestedAt: freshRequest.checkoutSettlement.paymentRequestedAt,
                    paymentInvoiceIds: freshRequest.checkoutSettlement.paymentInvoiceIds || [],
                    alreadyRequested: true,
                };
                return;
            }

            const savedReconciliation = freshRequest.checkoutReconciliation;
            const checkoutInvoice = await Invoices.findOne({
                contract: request.contract._id,
                terminationRequest: freshRequest._id,
                invoiceType: 'checkout_asset',
            }).session(session);
            const debtIds = savedReconciliation.previousDebtInvoiceIds || [];
            const invoiceIds = [...new Set([
                ...debtIds.map(String),
                ...(checkoutInvoice ? [String(checkoutInvoice._id)] : []),
            ])];
            if (!invoiceIds.length) {
                throw { status: 400, message: 'Không tìm thấy hóa đơn công nợ để yêu cầu thanh toán' };
            }

            const invoices = await Invoices.find({
                _id: { $in: invoiceIds },
                contract: request.contract._id,
                status: { $ne: 'cancelled' },
            }).sort({ billingMonth: 1, createdAt: 1 }).session(session);

            const expectedDebt = Number(savedReconciliation.additionalPayment || 0);
            const currentDebt = invoices.reduce(
                (sum, invoice) => sum + Math.max(0, Number(invoice.totalAmount || 0) - Number(invoice.paidAmount || 0)),
                0,
            );
            const depositAvailable = Number(savedReconciliation.depositAmount || 0);
            const depositToAllocate = Math.max(
                0,
                depositAvailable - Number(freshRequest.checkoutSettlement?.allocatedDeposit || 0),
            );
            const expectedAfterDeposit = Math.max(0, currentDebt - depositToAllocate);
            if (expectedAfterDeposit !== expectedDebt) {
                throw {
                    status: 409,
                    message: `Công nợ sau khi cấn trừ tiền cọc dự kiến là ${expectedAfterDeposit.toLocaleString('vi-VN')}đ, không khớp quyết toán ${expectedDebt.toLocaleString('vi-VN')}đ. Vui lòng kiểm tra lại các hóa đơn.`,
                };
            }

            // Cấn trừ tiền cọc vào hóa đơn cũ trước, sau đó mới đến hóa đơn checkout.
            let remainingDeposit = depositToAllocate;
            for (const invoice of invoices) {
                const balance = Math.max(0, Number(invoice.totalAmount || 0) - Number(invoice.paidAmount || 0));
                const allocation = Math.min(balance, remainingDeposit);
                if (allocation > 0) {
                    invoice.paidAmount = Number(invoice.paidAmount || 0) + allocation;
                    invoice.status = invoice.paidAmount >= invoice.totalAmount ? 'paid' : 'partially_paid';
                    await Payments.create([{
                        invoice: invoice._id,
                        payer: request.contract.representative,
                        method: 'deposit',
                        amount: allocation,
                        status: 'success',
                        recordedBy: managerId,
                        paidAt: new Date(),
                    }], { session });
                    remainingDeposit -= allocation;
                }
                invoice.billedTo = request.contract.representative;
                if (!invoice.sentAt) invoice.sentAt = new Date();
                if (invoice.status === 'draft') {
                    invoice.status = invoice.paidAmount >= invoice.totalAmount ? 'paid' : 'unpaid';
                }
                await invoice.save({ session });
            }

            freshRequest.checkoutSettlement = {
                ...(freshRequest.checkoutSettlement?.toObject?.() || freshRequest.checkoutSettlement || {}),
                allocatedDeposit: depositAvailable,
                paymentInvoiceIds: invoices.map(invoice => invoice._id),
                paymentRequestedAt: new Date(),
                paymentRequestedBy: managerId,
                refundAmount: Number(savedReconciliation.depositRefund || 0),
            };
            await freshRequest.save({ session });

            result = {
                paymentRequestedAt: freshRequest.checkoutSettlement.paymentRequestedAt,
                paymentInvoiceIds: freshRequest.checkoutSettlement.paymentInvoiceIds,
                remainingAmount: expectedDebt,
                alreadyRequested: false,
            };
            notificationPayload = {
                recipient: request.contract.representative,
                sender: managerId,
                property: room.property,
                type: 'checkout_payment',
                title: 'Yêu cầu thanh toán khi trả phòng',
                content: `Bạn cần thanh toán thêm ${expectedDebt.toLocaleString('vi-VN')}đ để hoàn tất thủ tục trả phòng. Vui lòng vào mục Hóa đơn của tôi để thanh toán các hóa đơn còn nợ.`,
                related: { entityType: 'TerminationRequest', entityId: freshRequest._id },
            };
        });
    } finally {
        await session.endSession();
    }

    if (notificationPayload && !result?.alreadyRequested) {
        try {
            await createNotification(notificationPayload);
        } catch (notificationError) {
            console.error('Không gửi được thông báo yêu cầu thanh toán checkout:', notificationError.message);
        }
    }
    return result;
};

// Manager xác nhận đã hoàn tiền thực tế cho Tenant (không tự động chuyển tiền).
export const confirmCheckoutRefund = async (managerId, requestId) => {
    const { request } = await getManagerCheckoutContext(managerId, requestId);
    const refundAmount = Number(request.checkoutReconciliation?.depositRefund || 0);
    if (!request.checkoutReconciliation?.calculatedAt) {
        throw { status: 400, message: 'Vui lòng lưu quyết toán tiền cọc trước' };
    }
    if (refundAmount < 10000) {
        throw { status: 400, message: 'Số tiền hoàn dưới 10.000đ hoặc không phát sinh hoàn cọc, không cần xác nhận hoàn tiền' };
    }
    if (request.checkoutSettlement?.refundConfirmedAt) {
        return request.checkoutSettlement;
    }
    request.checkoutSettlement = {
        ...(request.checkoutSettlement?.toObject?.() || request.checkoutSettlement || {}),
        refundAmount,
        refundConfirmedAt: new Date(),
        refundConfirmedBy: managerId,
    };
    await request.save();
    return request.checkoutSettlement;
};

// Đây là thao tác DUY NHẤT làm kết thúc hợp đồng và trả phòng về trạng thái available.
export const finalizeCheckout = async (managerId, requestId) => {
    const { request, room } = await getManagerCheckoutContext(managerId, requestId);
    const reconciliation = request.checkoutReconciliation;
    const settlement = request.checkoutSettlement || {};

    if (!reconciliation?.calculatedAt) {
        throw { status: 400, message: 'Chưa có kết quả quyết toán checkout được lưu' };
    }
    if (request.status === 'completed') {
        throw { status: 409, message: 'Checkout request này đã được hoàn tất trước đó' };
    }
    if (request.status === 'rejected') {
        throw { status: 400, message: 'Không thể hoàn tất checkout đã bị từ chối' };
    }

    const refundAmount = Number(reconciliation.depositRefund || 0);
    const additionalPayment = Number(reconciliation.additionalPayment || 0);
    if (refundAmount >= 10000 && !settlement.refundConfirmedAt) {
        throw { status: 400, message: 'Manager cần xác nhận đã hoàn tiền cọc cho Tenant trước khi hoàn tất checkout' };
    }
    if (additionalPayment > 0) {
        if (!settlement.paymentRequestedAt || !settlement.paymentInvoiceIds?.length) {
            throw { status: 400, message: 'Vui lòng gửi yêu cầu thanh toán cho Tenant trước' };
        }
        const settlementInvoices = await Invoices.find({
            _id: { $in: settlement.paymentInvoiceIds },
        }).select('_id totalAmount paidAmount status').lean();
        const allPaid = settlementInvoices.length === settlement.paymentInvoiceIds.length
            && settlementInvoices.every(invoice =>
                invoice.status === 'paid' && Number(invoice.paidAmount || 0) >= Number(invoice.totalAmount || 0)
            );
        if (!allPaid) {
            throw { status: 400, message: 'Tenant chưa thanh toán đầy đủ các hóa đơn checkout và công nợ cũ' };
        }
    }

    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const freshRequest = await TerminationRequests.findOne({
                _id: request._id,
                status: { $ne: 'completed' },
            }).session(session);
            if (!freshRequest) throw { status: 409, message: 'Checkout request đã được hoàn tất bởi thao tác khác' };

            const contractUpdate = await Contracts.updateOne(
                { _id: request.contract._id, status: { $in: ['active', 'expired'] } },
                { $set: { status: 'terminated' } },
                { session },
            );
            if (contractUpdate.modifiedCount !== 1) {
                throw { status: 409, message: 'Hợp đồng không còn ở trạng thái có thể checkout' };
            }

            await Rooms.updateOne(
                { _id: room._id },
                { $set: { status: 'available' } },
                { session },
            );

            freshRequest.status = 'completed';
            freshRequest.processedBy = managerId;
            freshRequest.completedAt = new Date();
            freshRequest.checkoutSettlement = {
                ...(freshRequest.checkoutSettlement?.toObject?.() || freshRequest.checkoutSettlement || {}),
                finalizedAt: new Date(),
                finalizedBy: managerId,
            };
            await freshRequest.save({ session });
        });
    } finally {
        await session.endSession();
    }

    return {
        requestId: request._id,
        contractId: request.contract._id,
        roomId: room._id,
        contractStatus: 'terminated',
        roomStatus: 'available',
        status: 'completed',
    };
};
