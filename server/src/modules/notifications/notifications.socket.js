import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { notificationEvents } from './notifications.events.js';

export function attachNotificationsSocket(server, { allowedOrigins }) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 4096 });
  const rooms = new Map();
  const upgrade = (req, socket, head) => {
    if (req.url?.split('?')[0] !== '/ws/notifications') return socket.destroy();
    if (req.headers.origin && !allowedOrigins.has(req.headers.origin)) {
      socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
      return;
    }
    wss.handleUpgrade(req, socket, head, client => wss.emit('connection', client));
  };
  server.on('upgrade', upgrade);
  const send = (socket, type) => {
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type }));
  };
  const onChanged = recipient => {
    for (const socket of rooms.get(recipient) || []) {
      if (Date.now() >= socket.expiresAt) socket.close(4001, 'Token expired');
      else send(socket, 'notifications.changed');
    }
  };
  notificationEvents.on('changed', onChanged);
  wss.on('connection', socket => {
    socket.alive = true;
    let expiry;
    const timeout = setTimeout(() => socket.close(4001, 'Authentication required'), 5000);
    socket.on('pong', () => {
      socket.alive = true;
    });
    socket.on('error', () => socket.terminate());
    socket.on('message', raw => {
      if (socket.recipient) return socket.close(1008, 'Unexpected message');
      try {
        const message = JSON.parse(raw.toString());
        if (message.type !== 'authenticate' || typeof message.token !== 'string') throw new Error();
        const user = jwt.verify(message.token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        if (!/^[a-f\d]{24}$/i.test(user.userId || '') || !Number.isFinite(user.exp))
          throw new Error();
        socket.recipient = user.userId;
        socket.expiresAt = user.exp * 1000;
        if (!rooms.has(user.userId)) rooms.set(user.userId, new Set());
        rooms.get(user.userId).add(socket);
        clearTimeout(timeout);
        expiry = setTimeout(
          () => socket.close(4001, 'Token expired'),
          Math.min(socket.expiresAt - Date.now(), 2147483647),
        );
        send(socket, 'ready');
      } catch {
        socket.close(4001, 'Invalid token');
      }
    });
    socket.on('close', () => {
      clearTimeout(timeout);
      clearTimeout(expiry);
      const room = rooms.get(socket.recipient);
      room?.delete(socket);
      if (room?.size === 0) rooms.delete(socket.recipient);
    });
  });
  const heartbeat = setInterval(() => {
    for (const socket of wss.clients) {
      if (!socket.alive) {
        socket.terminate();
        continue;
      }
      socket.alive = false;
      socket.ping();
    }
  }, 30000);
  wss.on('close', () => {
    clearInterval(heartbeat);
    server.off('upgrade', upgrade);
    notificationEvents.off('changed', onChanged);
  });
  return wss;
}
