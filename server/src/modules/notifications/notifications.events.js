import { EventEmitter } from 'node:events';

export const notificationEvents = new EventEmitter();
export function notifyRecipient(recipient) {
  notificationEvents.emit('changed', String(recipient));
}
