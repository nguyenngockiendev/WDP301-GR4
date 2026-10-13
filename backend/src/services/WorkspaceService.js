import mongoose from 'mongoose';
import { modules } from '../config/modules.js';
import { AppError } from '../utils/errors.js';
export class WorkspaceService {
  constructor(dao) {
    this.dao = dao;
  }
  async scope(user) {
    const uid = new mongoose.Types.ObjectId(user.id);
    const buildingIds =
      user.role === 'LANDLORD' ? await this.dao.ids('Building', { owner: uid }) : [];
    let roomFilter = {};
    if (user.role === 'LANDLORD') {
      roomFilter = { $or: [{ owner: uid }, { building: { $in: buildingIds } }] };
    } else if (user.role === 'MANAGER') {
      roomFilter = { manager: uid };
    }
    const roomIds = user.role === 'TENANT' ? [] : await this.dao.ids('Room', roomFilter);
    const contractFilter = user.role === 'TENANT' ? { tenant: uid } : { room: { $in: roomIds } };
    const contractIds = await this.dao.ids('Contract', contractFilter);
    const invoiceFilter = user.role === 'TENANT' ? { tenant: uid } : { room: { $in: roomIds } };
    const invoiceIds = await this.dao.ids('Invoice', invoiceFilter);
    return { uid, buildingIds, roomIds, contractIds, invoiceIds };
  }
  filter(model, user, s) {
    if (model === 'Notification') return { recipient: s.uid };
    if (model === 'Building')
      return user.role === 'LANDLORD' ? { owner: s.uid } : { manager: s.uid };
    if (model === 'Room') return { _id: { $in: s.roomIds } };
    if (['DepositTransaction', 'CheckoutRequest', 'CheckoutSettlement'].includes(model))
      return { contract: { $in: s.contractIds } };
    if (model === 'Payment') return { invoice: { $in: s.invoiceIds } };
    if (['UtilityRate', 'ServiceFee', 'ContractPolicy'].includes(model))
      return { building: { $in: s.buildingIds } };
    if (model === 'Contract') return { _id: { $in: s.contractIds } };
    if (model === 'RentalRequest' && user.role === 'TENANT') return { tenant: s.uid };
    if (model === 'RentalRequest' || model === 'UtilityReading')
      return { room: { $in: s.roomIds } };
    if (model === 'Invoice')
      return user.role === 'TENANT' ? { tenant: s.uid } : { room: { $in: s.roomIds } };
    return {};
  }
  async list(key, user, page) {
    const config = modules[key];
    if (!config || !config.roles.includes(user.role))
      throw new AppError('You do not have access to this page.', 403);
    const scope = await this.scope(user);
    const filter = this.filter(config.model, user, scope);
    return {
      config,
      items: await this.dao.find(config.model, filter, page),
      total: await this.dao.count(config.model, filter),
    };
  }
  async dashboard(user) {
    const s = await this.scope(user);
    const invoiceFilter = this.filter('Invoice', user, s);
    const recent = await this.dao.find('Invoice', invoiceFilter);
    const billed = await this.dao.sum(
      'Invoice',
      { ...invoiceFilter, status: { $in: ['ISSUED', 'PARTIAL', 'PAID'] } },
      'total',
    );
    const paid = await this.dao.sum(
      'Invoice',
      { ...invoiceFilter, status: { $in: ['ISSUED', 'PARTIAL', 'PAID'] } },
      'paidAmount',
    );
    return {
      stats: [
        {
          label: user.role === 'TENANT' ? 'Your contracts' : 'Managed rooms',
          value: await this.dao.count(
            user.role === 'TENANT' ? 'Contract' : 'Room',
            this.filter(user.role === 'TENANT' ? 'Contract' : 'Room', user, s),
          ),
          hint: 'In your portfolio',
        },
        {
          label: 'Active contracts',
          value: await this.dao.count('Contract', {
            ...this.filter('Contract', user, s),
            status: 'ACTIVE',
          }),
          hint: 'Currently active leases',
        },
        {
          label: 'Outstanding balance',
          value: Math.max(0, billed - paid),
          money: true,
          hint: 'Issued invoices less payments',
        },
        {
          label: 'Unread notifications',
          value: await this.dao.count('Notification', { recipient: s.uid, readAt: null }),
          hint: 'Updates waiting for you',
        },
      ],
      recent: recent.slice(0, 5),
    };
  }
}
