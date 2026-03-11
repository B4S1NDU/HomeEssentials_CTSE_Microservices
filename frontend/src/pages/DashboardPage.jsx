import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productApi, inventoryApi } from '../config/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const SERVICES = [
  { name: 'User Service',         port: 5000, live: true,  icon: '👤' },
  { name: 'Product Service',      port: 3002, live: true,  icon: '📦' },
  { name: 'Inventory Service',    port: 3003, live: true,  icon: '📊' },
  { name: 'Order Service',        port: 3004, live: false, icon: '🛒' },
  { name: 'Payment Service',      port: 3005, live: false, icon: '💳' },
  { name: 'Notification Service', port: 3006, live: false, icon: '🔔' },
];

const STOCK_BADGE = { IN_STOCK: 'badge-success', LOW_STOCK: 'badge-warning', OUT_OF_STOCK: 'badge-danger' };

function stockStatus(item) {
  if (item.stockStatus) return item.stockStatus;
  if (item.availableQuantity === 0) return 'OUT_OF_STOCK';
  if (item.availableQuantity <= item.lowStockThreshold) return 'LOW_STOCK';
  return 'IN_STOCK';
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
          productApi.get('/api/products',      { params: { limit: 1 } }),
          inventoryApi.get('/api/inventory',   { params: { limit: 1 } }),
          inventoryApi.get('/api/inventory/low-stock'),
        ]);
        setStats({
          products:   prodRes.data.total  || 0,
          categories: 8,
          inventory:  invRes.data.total   || 0,
          lowStock:   lowRes.data.count   || 0,
        });
        setLowStockItems(lowRes.data.data?.slice(0, 6) || []);
      } catch {
        /* services may not be running — silently degrade */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const username = user?.email?.split('@')[0] || 'there';

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Welcome back, {username}! 👋</div>
          <div className="page-subtitle">Here&apos;s a snapshot of your store right now.</div>
        </div>
        <Link to="/products" className="btn btn-primary">Browse Products →</Link>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green">📦</div>
          <div>
            <div className="stat-value">{loading ? '–' : stats.products}</div>
            <div className="stat-label">Total Products</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">🏷️</div>
          <div>
            <div className="stat-value">{loading ? '–' : stats.categories}</div>
            <div className="stat-label">Product Categories</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon teal">📊</div>
          <div>
            <div className="stat-value">{loading ? '–' : stats.inventory}</div>
            <div className="stat-label">Inventory Items</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">⚠️</div>
          <div>
            <div className="stat-value">{loading ? '–' : stats.lowStock}</div>
            <div className="stat-label">Low Stock Alerts</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Service Status */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">⚙️ Microservice Status</div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Service</th><th>Port</th><th>Status</th></tr>
              </thead>
              <tbody>
                {SERVICES.map(s => (
                  <tr key={s.name}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{s.icon}</span> {s.name}
                    </td>
                    <td>
                      <code style={{ fontSize: '0.76rem', background: '#f5f5f5', padding: '1px 6px', borderRadius: 3 }}>
                        :{s.port}
                      </code>
                    </td>
                    <td>
                      <span className={`badge ${s.live ? 'badge-success' : 'badge-warning'}`}>
                        {s.live ? '● Live' : '◌ Coming Soon'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">⚠️ Low Stock Alerts</div>
            <Link to="/inventory" className="btn btn-sm btn-secondary">View All</Link>
          </div>
          {loading ? (
            <div className="loading">Loading…</div>
          ) : lowStockItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <p>All stock levels are healthy!</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Product</th><th>Available</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {lowStockItems.map(item => {
                    const status = stockStatus(item);
                    return (
                      <tr key={item._id}>
                        <td style={{ fontWeight: 600 }}>{item.productName}</td>
                        <td>{item.availableQuantity}</td>
                        <td>
                          <span className={`badge ${STOCK_BADGE[status] || 'badge-secondary'}`}>
                            {status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
