import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Users,
  ShoppingCart,
  CreditCard,
  Bell,
  ChevronLeft,
  ChevronRight,
  Home,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, always: true },
  { to: '/products', label: 'Products', icon: Package, always: true },
  { to: '/inventory', label: 'Inventory', icon: Warehouse, roles: ['Admin', 'StoreManager'] },
  { to: '/users', label: 'Users', icon: Users, roles: ['Admin'] },
  { to: '/orders', label: 'Orders', icon: ShoppingCart, always: true },
  { to: '/payments', label: 'Payments', icon: CreditCard, always: true, soon: true },
  { to: '/notifications', label: 'Notifications', icon: Bell, always: true, soon: true },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();

  const isVisible = (item) => {
    if (item.always) return true;
    if (!item.roles) return true;
    return item.roles.includes(user?.role);
  };

  // Dynamic portal branding
  const portalName = user?.role === 'admin' ? 'Admin Portal' : 'HomeEssentials+';
  const portalSubtext = user?.role === 'admin' ? 'Admin System' : 'Customer Portal';

  return (
    <aside
      className={`relative flex flex-col h-full bg-gray-900 text-white transition-all duration-300
        ${collapsed ? 'w-16' : 'w-64'}`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-gray-700/50 ${collapsed ? 'justify-center' : ''}`}>
        <div className="flex-shrink-0 w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
          <Home size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-sm leading-tight">{portalName}</p>
            <p className="text-[10px] text-gray-400">{portalSubtext}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navItems.filter(isVisible).map(({ to, label, icon: Icon, soon }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group
              ${isActive
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && (
              <span className="flex-1">{label}</span>
            )}
            {!collapsed && soon && (
              <span className="text-[9px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded-full">Soon</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 bg-gray-800 border border-gray-700 rounded-full p-1
          text-gray-400 hover:text-white hover:bg-gray-700 transition-colors z-10"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* User info */}
      <div className={`border-t border-gray-700/50 px-3 py-4 ${collapsed ? 'flex justify-center' : ''}`}>
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[11px] text-gray-400 truncate">{user?.role}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
