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
    <header className="h-[60px] bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-2">
        <h1 className="text-[15px] font-bold text-gray-800">{getPageTitle(pathname)}</h1>
      </div>
      <div className="flex items-center gap-3">
        {user?.email && (
          <span className="hidden sm:block text-xs text-gray-500 font-medium">{user.email}</span>
        )}
        {user?.role && (
          <span className="text-[11px] bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-0.5 font-semibold">
            {user.role}
          </span>
        )}
        <button
          onClick={logout}
          className="text-xs border border-gray-200 text-gray-500 rounded-md px-3 py-1.5 hover:border-red-300 hover:text-red-500 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
