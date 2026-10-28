import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

export function HeaderNotifications() {
  return (
    <Link className="icon-button header-bell" to="/avisos" aria-label="Notificações">
      <Bell size={20} />
      <span className="notification-dot" />
    </Link>
  );
}
