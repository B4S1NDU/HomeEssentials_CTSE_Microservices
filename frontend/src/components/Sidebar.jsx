import { NavLink } from 'react-router-dom';

const LIVE_ITEMS = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/products',  icon: '📦', label: 'Products' },
  { to: '/inventory', icon: '📊', label: 'Inventory' },
];

const COMING_ITEMS = [
  { to: '/orders',        icon: '🛒', label: 'Orders' },
  { to: '/payments',      icon: '💳', label: 'Payments' },
  { to: '/notifications', icon: '🔔', label: 'Notifications' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">🏪</span>
        <div>
          <div className="logo-text">HomeEssentials+</div>
          <div className="logo-sub">Microservices Portal</div>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Active Services</div>
        <ul className="sidebar-nav">
          {LIVE_ITEMS.map(item => (
            <li key={item.to}>
              <NavLink to={item.to} className={({ isActive }) => isActive ? 'active' : undefined}>
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Coming Soon</div>
        <ul className="sidebar-nav">
          {COMING_ITEMS.map(item => (
            <li key={item.to}>
              <NavLink to={item.to} className={({ isActive }) => isActive ? 'active' : undefined}>
                <span className="nav-icon">{item.icon}</span>
                {item.label}
                <span className="badge-soon">Soon</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-footer">
        <div className="sf-title">Running Services</div>
        <div className="sf-item">• User Service :5000</div>
        <div className="sf-item">• Product Service :3002</div>
        <div className="sf-item">• Inventory Service :3003</div>
      </div>
    </aside>
  );
}
