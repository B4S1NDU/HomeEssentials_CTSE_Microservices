import { NavLink } from 'react-router-dom';

const LIVE_ITEMS = [
  { to: '/dashboard', icon: 'ðŸ ', label: 'Dashboard' },
  { to: '/products',  icon: 'ðŸ“¦', label: 'Products' },
  { to: '/inventory', icon: 'ðŸ“Š', label: 'Inventory' },
];

const COMING_ITEMS = [
  { to: '/orders',        icon: 'ðŸ›’', label: 'Orders' },
  { to: '/payments',      icon: 'ðŸ’³', label: 'Payments' },
  { to: '/notifications', icon: 'ðŸ””', label: 'Notifications' },
];

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-gradient-to-b from-green-900 via-green-800 to-green-900 flex flex-col z-50 shadow-2xl">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <span className="text-3xl">ðŸª</span>
        <div>
          <p className="text-white font-bold text-sm leading-tight">HomeEssentials+</p>
          <p className="text-green-300 text-[10px] tracking-widest uppercase">Microservices Portal</p>
        </div>
      </div>

      {/* Active Services */}
      <div className="mt-4 px-3">
        <p className="text-[10px] uppercase tracking-widest text-green-400 font-semibold px-2 mb-2">Active Services</p>
        <ul className="space-y-0.5">
          {LIVE_ITEMS.map(item => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-white/15 text-white font-semibold border-l-2 border-green-300'
                      : 'text-green-100/80 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {/* Coming Soon */}
      <div className="mt-5 px-3">
        <p className="text-[10px] uppercase tracking-widest text-green-400 font-semibold px-2 mb-2">Coming Soon</p>
        <ul className="space-y-0.5">
          {COMING_ITEMS.map(item => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-white/15 text-white font-semibold border-l-2 border-yellow-300'
                      : 'text-green-100/60 hover:bg-white/8 hover:text-white/80'
                  }`
                }
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                {item.label}
                <span className="ml-auto text-[9px] bg-yellow-400/15 text-yellow-300 border border-yellow-400/25 rounded-full px-2 py-0.5 font-semibold">Soon</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="mt-auto px-5 py-4 border-t border-white/10">
        <p className="text-[9px] uppercase tracking-widest text-green-400 font-semibold mb-2">Running Services</p>
        {[
          { label: 'User Service',      port: 5000 },
          { label: 'Product Service',   port: 3002 },
          { label: 'Inventory Service', port: 3003 },
        ].map(s => (
          <div key={s.port} className="flex items-center justify-between text-[10px] text-green-300/70 py-0.5">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>{s.label}</span>
            <span className="font-mono text-green-400/80">:{s.port}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
