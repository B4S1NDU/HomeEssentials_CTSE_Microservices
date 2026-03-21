import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, User, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const routeTitles = {
  '/dashboard': 'Dashboard',
  '/products': 'Products',
  '/inventory': 'Inventory',
  '/users': 'Users',
  '/orders': 'Orders',
  '/payments': 'Payments',
  '/notifications': 'Notifications',
  '/profile': 'My Profile',
};

export default function Header({ onMobileMenuToggle }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const title = Object.entries(routeTitles).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] ?? 'Dashboard';

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // Portal branding based on user role
  const portalName = user?.role === 'Admin' ? 'Admin Portal' : 'HomeEssentials+ Customer Portal';
  const portalSubtitle = user?.role === 'Admin' ? 'Admin Management System' : 'Your household essentials marketplace';

  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 flex items-center justify-between gap-4">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="font-semibold text-gray-900 text-lg leading-tight">{title}</h1>
          <p className="text-xs text-gray-400 hidden sm:block">{portalName}</p>
          <p className="text-xs text-gray-500 hidden sm:block">{portalSubtitle}</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <span className="hidden sm:block font-medium">{user?.firstName}</span>
        </button>
        <button
          onClick={handleLogout}
          title="Logout"
          className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
