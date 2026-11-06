import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';

export default function NotificationBell() {
  const { unreadCount } = useNotifications();
  return (
    <Link to="/notifications" aria-label={`Thông báo${unreadCount == null ? '' : `, ${unreadCount} chưa đọc`}`}
      className="relative inline-flex rounded-xl p-3 text-primary hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
      <Bell size={22} aria-hidden="true" />
      {unreadCount > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 text-xs font-bold text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
    </Link>
  );
}
