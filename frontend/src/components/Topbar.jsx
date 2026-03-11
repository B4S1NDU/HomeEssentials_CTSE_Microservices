import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function getPageTitle(pathname) {
  if (/\/products\/[^/]+\/edit/.test(pathname)) return 'Edit Product';
  if (pathname === '/products/new')  return 'Add New Product';
  const map = {
    '/dashboard':     'Dashboard',
    '/products':      'Product Catalog',
    '/inventory':     'Inventory Management',
    '/orders':        'Order Management',
    '/payments':      'Payment Processing',
    '/notifications': 'Notifications',
  };
  return map[pathname] || 'HomeEssentials+';
}

export default function Topbar() {
  const { user, logout } = useAuth();
  const { pathname }     = useLocation();

  return (
    <div className="topbar">
      <div className="topbar-left">
        <span className="topbar-title">{getPageTitle(pathname)}</span>
      </div>
      <div className="topbar-right">
        {user?.email && <span className="topbar-user">{user.email}</span>}
        {user?.role  && <span className="topbar-role">{user.role}</span>}
        <button className="btn-logout" onClick={logout}>Logout</button>
      </div>
    </div>
  );
}
