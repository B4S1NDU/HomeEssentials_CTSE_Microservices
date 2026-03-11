import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productApi, inventoryApi } from '../config/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const SERVICES = [
  { name: 'User Service',         port: 5000, live: true,  icon: 'ðŸ‘¤' },
  { name: 'Product Service',      port: 3002, live: true,  icon: 'ðŸ“¦' },
  { name: 'Inventory Service',    port: 3003, live: true,  icon: 'ðŸ“Š' },
  { name: 'Order Service',        port: 3004, live: false, icon: 'ðŸ›’' },
  { name: 'Payment Service',      port: 3005, live: false, icon: 'ðŸ’³' },
  { name: 'Notification Service', port: 3006, live: false, icon: 'ðŸ””' },
];

function stockStatus(item) {
  if (item.availableQuantity === 0) return 'OUT_OF_STOCK';
  if (item.availableQuantity <= item.lowStockThreshold) return 'LOW_STOCK';
  return 'IN_STOCK';
}

const STATUS_STYLE = {
  IN_STOCK:     'bg-green-50 text-green-700 border border-green-200',
  LOW_STOCK:    'bg-amber-50 text-amber-700 border border-amber-200',
  OUT_OF_STOCK: 'bg-red-50 text-red-600 border border-red-200',
};

function StatCard({ icon, value, label, iconBg, loading }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{loading ? 'â€”' : value}</p>
        <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats,         setStats]         = useState({ products: 0, categories: 8, inventory: 0, lowStock: 0 });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [prodRes, invRes, lowRes] = await Promise.all([
          productApi.get('/api/products',       { params: { limit: 1 } }),
          inventoryApi.get('/api/inventory',    { params: { limit: 1 } }),
          inventoryApi.get('/api/inventory/low-stock'),
        ]);
        setStats({
          products:  prodRes.data.total || 0,
          categories: 8,
          inventory:  invRes.data.total || 0,
          lowStock:   lowRes.data.count || 0,
        });
        setLowStockItems(lowRes.data.data?.slice(0, 6) || []);
      } catch { /* services may not be running */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const username = user?.email?.split('@')[0] || 'there';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Welcome back, {username}! ðŸ‘‹</h1>
          <p className="text-sm text-gray-500 mt-0.5">Here&apos;s a snapshot of your store right now.</p>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Browse Products â†’
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon="ðŸ“¦" value={stats.products}   label="Total Products"    iconBg="bg-green-50"  loading={loading} />
        <StatCard icon="ðŸ·ï¸"  value={stats.categories} label="Categories"        iconBg="bg-blue-50"   loading={loading} />
        <StatCard icon="ðŸ“Š" value={stats.inventory}  label="Inventory Items"  iconBg="bg-teal-50"   loading={loading} />
        <StatCard icon="âš ï¸"  value={stats.lowStock}   label="Low Stock Alerts" iconBg="bg-amber-50"  loading={loading} />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Service status */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-gray-800 text-sm">âš™ï¸ Microservice Status</h2>
            <span className="text-xs text-gray-400">6 Services</span>
          </div>
          <div className="divide-y divide-gray-50">
            {SERVICES.map(s => (
              <div key={s.name} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-base">{s.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{s.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <code className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">:{s.port}</code>
                  {s.live ? (
                    <span className="flex items-center gap-1 text-[10px] bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>Live
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] bg-amber-50 text-amber-600 border border-amber-200 rounded-full px-2 py-0.5 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>Coming Soon
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-gray-800 text-sm">âš ï¸ Low Stock Alerts</h2>
            <Link to="/inventory" className="text-xs text-green-700 hover:text-green-800 font-semibold">View All â†’</Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
              Loadingâ€¦
            </div>
          ) : lowStockItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <span className="text-4xl mb-2">âœ…</span>
              <p className="text-sm font-medium">All stock levels are healthy!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {lowStockItems.map(item => {
                const status = stockStatus(item);
                return (
                  <div key={item._id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{item.productName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.availableQuantity} units available</p>
                    </div>
                    <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${STATUS_STYLE[status]}`}>
                      {status.replace(/_/g, ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
