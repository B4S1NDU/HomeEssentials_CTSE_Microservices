import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Warehouse,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { productsApi } from "../../api/productApi";
import { inventoryApi } from "../../api/inventoryApi";
import { usersApi } from "../../api/userApi";
import {
  userClient,
  productClient,
  inventoryClient,
  paymentClient,
  orderClient,
  notificationClient,
} from "../../api/axiosConfig";
import { useAuth } from "../../context/AuthContext";
import StatCard from "../../components/common/StatCard";
import Spinner from "../../components/common/Spinner";
import Badge from "../../components/common/Badge";
import { API_URLS } from "../../utils/constants";
import { formatDateTime, getStockStatusColor } from "../../utils/helpers";

const SERVICE_DEFS = [
  {
    name: "User Service",
    port: 3001,
    color: "text-indigo-500",
    client: userClient,
  },
  {
    name: "Product Service",
    port: 3002,
    color: "text-blue-500",
    client: productClient,
  },
  {
    name: "Inventory Service",
    port: 3003,
    color: "text-green-500",
    client: inventoryClient,
  },
  {
    name: "Order Service",
    port: 3004,
    color: "text-orange-400",
    client: orderClient,
  },
  {
    name: "Payment Service",
    port: 3005,
    color: "text-emerald-500",
    client: paymentClient,
  },
  {
    name: "Notification Service",
    port: 3006,
    color: "text-purple-500",
    client: notificationClient,
  },
];

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [serviceHealth, setServiceHealth] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      // Run all fetches concurrently, fail gracefully
      const [prodRes, invRes, lowRes, usersRes] = await Promise.allSettled([
        productsApi.getAll({ limit: 5, page: 1, isActive: true }),
        inventoryApi.getAll({ limit: 100 }),
        inventoryApi.getLowStock(),
        isAdmin() ? usersApi.getAll({ limit: 1 }) : Promise.resolve(null),
      ]);

      const products =
        prodRes.status === "fulfilled" ? prodRes.value.data : null;
      const inv = invRes.status === "fulfilled" ? invRes.value.data : null;
      const low = lowRes.status === "fulfilled" ? lowRes.value.data : null;
      const users =
        usersRes.status === "fulfilled" ? usersRes.value?.data : null;

      setStats({
        totalProducts: products?.total ?? products?.count ?? "—",
        totalInventoryItems: inv?.total ?? inv?.count ?? "—",
        lowStockCount: low?.count ?? "—",
        outOfStock:
          inv?.data?.filter((i) => i.stockStatus === "OUT_OF_STOCK").length ??
          "—",
        totalUsers: users?.data?.pagination?.total ?? (isAdmin() ? "—" : null),
      });

      setLowStock(low?.data?.slice(0, 5) ?? []);
      setRecentProducts(products?.data?.slice(0, 5) ?? []);
      setLoading(false);
    };

    fetchAll();
  }, []);

  // Health check for each active service
  useEffect(() => {
    const checkHealth = async () => {
      const results = {};
      await Promise.allSettled(
        SERVICE_DEFS.filter((s) => s.client).map(async (s) => {
          try {
            await s.client.get("/health", { timeout: 4000 });
            results[s.name] = "up";
          } catch {
            results[s.name] = "down";
          }
        }),
      );
      // Unimplemented services are "pending"
      SERVICE_DEFS.filter((s) => !s.client).forEach((s) => {
        results[s.name] = "pending";
      });
      setServiceHealth(results);
    };
    checkHealth();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-indigo-100 text-sm font-medium">Good day,</p>
            <h2 className="text-2xl font-bold mt-0.5">
              {user?.firstName} {user?.lastName} 👋
            </h2>
            <p className="text-indigo-100 text-sm mt-1">
              {user?.role === 'admin' ? '⚙️ Admin Portal' : '🛒 HomeEssentials+ Customer Portal'}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs bg-white/20 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
            System operational
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value={stats?.totalProducts}
          icon={Package}
          color="indigo"
        />
        <StatCard
          title="Inventory Items"
          value={stats?.totalInventoryItems}
          icon={Warehouse}
          color="blue"
        />
        <StatCard
          title="Low Stock Items"
          value={stats?.lowStockCount}
          icon={AlertTriangle}
          color="yellow"
        />
        <StatCard
          title="Out of Stock"
          value={stats?.outOfStock}
          icon={XCircle}
          color="red"
        />
        {isAdmin() && stats?.totalUsers !== null && (
          <StatCard
            title="Registered Users"
            value={stats?.totalUsers}
            icon={Users}
            color="green"
          />
        )}
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Low stock list */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-yellow-500" />
              <h3 className="font-semibold text-gray-900 text-sm">
                Low Stock Alerts
              </h3>
            </div>
            <Link
              to="/inventory?status=LOW_STOCK"
              className="text-xs text-indigo-600 flex items-center gap-1 hover:underline"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-gray-400">
              <CheckCircle size={32} className="text-green-400 mb-2" />
              <p className="text-sm">All items are well-stocked!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {lowStock.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.productName}
                    </p>
                    <p className="text-xs text-gray-400">
                      Available: {item.availableQuantity} · Threshold:{" "}
                      {item.lowStockThreshold}
                    </p>
                  </div>
                  <Badge className={getStockStatusColor(item.stockStatus)}>
                    {item.stockStatus?.replace(/_/g, " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent products */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-indigo-500" />
              <h3 className="font-semibold text-gray-900 text-sm">
                Recent Products
              </h3>
            </div>
            <Link
              to="/products"
              className="text-xs text-indigo-600 flex items-center gap-1 hover:underline"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {recentProducts.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-gray-400">
              <Package size={32} className="mb-2" />
              <p className="text-sm">No products yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentProducts.map((product) => (
                <div
                  key={product._id}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-9 h-9 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <Package size={14} className="text-indigo-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">
                      {product.category}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                    LKR {Number(product.price).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Service health */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Activity size={16} className="text-gray-500" />
          <h3 className="font-semibold text-gray-900 text-sm">
            Microservice Health
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-gray-100">
          {SERVICE_DEFS.map((svc) => {
            const status = serviceHealth[svc.name];
            return (
              <div
                key={svc.name}
                className="flex flex-col items-center gap-2 px-4 py-4"
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    status === "up"
                      ? "bg-green-400 animate-pulse"
                      : status === "down"
                        ? "bg-red-400"
                        : "bg-gray-300"
                  }`}
                />
                <p className="text-xs font-medium text-gray-700 text-center leading-tight">
                  {svc.name}
                </p>
                <p
                  className={`text-[10px] font-medium ${
                    status === "up"
                      ? "text-green-600"
                      : status === "down"
                        ? "text-red-500"
                        : "text-gray-400"
                  }`}
                >
                  {status === "up"
                    ? "Online"
                    : status === "down"
                      ? "Offline"
                      : "Not deployed"}
                </p>
                <p className="text-[10px] text-gray-400">:{svc.port}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
