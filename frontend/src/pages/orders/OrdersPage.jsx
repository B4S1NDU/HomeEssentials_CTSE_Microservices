import React, { useMemo, useState } from "react";
import { ShoppingCart, RefreshCw, Package, ReceiptText } from "lucide-react";
import { ordersApi } from "../../api/orderApi";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import Table from "../../components/common/Table";

export default function OrdersPage() {
  const { user, isAdminOrManager } = useAuth();
  const resolvedUserId = user?.id ?? user?._id ?? "";
  const [form, setForm] = useState({
    userId: resolvedUserId,
    productId: "",
    quantity: 1,
  });
  const [loading, setLoading] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orders, setOrders] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const loadOrders = async (userId) => {
    if (isAdminOrManager()) {
      try {
        setOrdersLoading(true);
        const res = await ordersApi.getAll();
        setOrders(res.data?.data ?? []);
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || "Failed to load all orders");
      } finally {
        setOrdersLoading(false);
      }
      return;
    }

    if (!userId) return;
    try {
      setOrdersLoading(true);
      const res = await ordersApi.getByUser(userId);
      setOrders(res.data?.data ?? []);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load orders");
    } finally {
      setOrdersLoading(false);
    }
  };

  React.useEffect(() => {
    setForm((prev) => ({ ...prev, userId: resolvedUserId }));
    if (resolvedUserId || isAdminOrManager()) loadOrders(resolvedUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedUserId]);

  const statusBadgeClass = (status) => {
    if (status === "CONFIRMED") return "bg-green-50 text-green-700 border-green-200";
    if (status === "CANCELLED") return "bg-red-50 text-red-700 border-red-200";
    return "bg-yellow-50 text-yellow-800 border-yellow-200";
  };

  const columns = useMemo(
    () => [
      {
        key: "orderId",
        label: "Order",
        render: (_v, row) => (
          <div className="space-y-0.5">
            <div className="font-semibold text-gray-900">{row.orderId}</div>
            <div className="text-xs text-gray-500">
              {row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}
            </div>
          </div>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (v) => <Badge className={statusBadgeClass(v)}>{v}</Badge>,
      },
      {
        key: "items",
        label: "Items",
        render: (_v, row) => {
          const count = Array.isArray(row.items) ? row.items.length : 0;
          const preview = Array.isArray(row.items)
            ? row.items.slice(0, 2).map((it) => `${it.productName}×${it.quantity}`).join(", ")
            : "";
          return (
            <div className="space-y-0.5">
              <div className="text-gray-900 font-medium">{count}</div>
              <div className="text-xs text-gray-500 truncate max-w-[320px]">{preview || "—"}</div>
            </div>
          );
        },
      },
      {
        key: "totalAmount",
        label: "Total",
        render: (v) => <span className="font-semibold text-gray-900">Rs. {v ?? 0}</span>,
      },
    ],
    []
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.userId || !form.productId || !form.quantity) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        userId: form.userId,
        items: [
          {
            productId: form.productId,
            quantity: Number(form.quantity),
          },
        ],
      };

      const { data } = await ordersApi.create(payload);
      setCreatedOrder(data.data);
      await loadOrders(form.userId);
      toast.success("Order created successfully");
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Failed to create order. Check console."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await ordersApi.updateStatus(orderId, status);
      toast.success("Order status updated");
      await loadOrders(form.userId);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm("Delete this order?")) return;
    try {
      await ordersApi.remove(orderId);
      toast.success("Order deleted");
      await loadOrders(form.userId);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to delete order");
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-50 to-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
                <ShoppingCart size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
                <p className="text-sm text-gray-600">
                  Create orders and review order history (Order Service on port 3004).
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => loadOrders(form.userId)}
              loading={ordersLoading}
              disabled={!form.userId}
            >
              <RefreshCw size={16} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="p-6 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Package size={16} className="text-gray-500" />
                <h3 className="font-semibold text-gray-900">Create Test Order</h3>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Provide a valid User ID + Product ID. (Make sure User/Product/Inventory/Payment services are running.)
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  label="User ID"
                  name="userId"
                  value={form.userId}
                  onChange={handleChange}
                  placeholder="e.g. 69b919c65dfc18d5778708eb"
                  required
                />
                <Input
                  label="Product ID"
                  name="productId"
                  value={form.productId}
                  onChange={handleChange}
                  placeholder="e.g. 65a1b2c3d4e5f6g7h8i9j0k1"
                  required
                />
                <Input
                  label="Quantity"
                  type="number"
                  min={1}
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                />

                <Button type="submit" loading={loading} className="w-full">
                  Create Order
                </Button>

                <div className="text-xs text-gray-500">
                  Tip: if you see <span className="font-mono">401</span>, your User Service likely requires auth (JWT).
                </div>
              </form>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <ReceiptText size={16} className="text-gray-500" />
                <h3 className="font-semibold text-gray-900">Latest Result</h3>
              </div>

              {!createdOrder ? (
                <p className="text-sm text-gray-500">
                  Create an order to see its details here.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500">Order ID</div>
                      <div className="font-mono text-sm text-gray-900">{createdOrder.orderId}</div>
                    </div>
                    <Badge className={statusBadgeClass(createdOrder.status)}>
                      {createdOrder.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total</span>
                    <span className="font-semibold text-gray-900">Rs. {createdOrder.totalAmount}</span>
                  </div>

                  <div className="border-t border-gray-100 pt-3">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Items</div>
                    <div className="space-y-1 text-sm">
                      {createdOrder.items?.map((it) => (
                        <div key={it.productId} className="flex justify-between gap-3">
                          <div className="truncate text-gray-700">
                            {it.productName} <span className="text-gray-400">×</span> {it.quantity}
                          </div>
                          <div className="shrink-0 font-medium text-gray-900">Rs. {it.price}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Order History</h3>
                <p className="text-sm text-gray-500">
                  {isAdminOrManager()
                    ? "Showing all orders (Admin/Manager view)"
                    : (
                      <>
                        Showing orders for{" "}
                        <span className="font-mono">{form.userId || "—"}</span>
                      </>
                    )}
                </p>
              </div>
            </div>

            <Table
              columns={
                isAdminOrManager()
                  ? [
                      ...columns,
                      {
                        key: "actions",
                        label: "Actions",
                        render: (_v, row) => (
                          <div className="flex items-center gap-2">
                            <select
                              className="text-xs rounded-md border-gray-300"
                              value={row.status}
                              onChange={(e) =>
                                handleUpdateStatus(row.orderId, e.target.value)
                              }
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="CONFIRMED">CONFIRMED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="!px-2 !py-1 text-xs"
                              onClick={() => handleDelete(row.orderId)}
                            >
                              Delete
                            </Button>
                          </div>
                        ),
                      },
                    ]
                  : columns
              }
              data={orders}
              loading={ordersLoading}
              emptyMessage={
                !form.userId && !isAdminOrManager()
                  ? "Add a User ID to load orders."
                  : "No orders found."
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

