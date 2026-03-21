import React, { useMemo, useState } from "react";
import {
  ShoppingCart,
  RefreshCw,
  ClipboardList,
  CheckCircle2,
  Clock3,
  XCircle,
  Search,
} from "lucide-react";
import { ordersApi } from "../../api/orderApi";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import {
  extractErrorMessage,
  formatCurrency,
  formatDateTime,
  formatOrderAddress,
  formatDeliveryRange,
  toDateInputValue,
} from "../../utils/helpers";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import Table from "../../components/common/Table";
import Modal from "../../components/common/Modal";

export default function OrdersPage() {
  const { user, isAdminOrManager } = useAuth();
  const isStaff = isAdminOrManager();
  const resolvedUserId = user?.id ?? user?._id ?? "";

  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({ start: "", end: "" });
  const [deliverySaving, setDeliverySaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const loadOrders = async () => {
    if (isStaff) {
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

    if (!resolvedUserId) return;
    try {
      setOrdersLoading(true);
      const res = await ordersApi.getByUser(resolvedUserId);
      setOrders(res.data?.data ?? []);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load orders");
    } finally {
      setOrdersLoading(false);
    }
  };

  React.useEffect(() => {
    if (resolvedUserId || isStaff) loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load on user id / role context
  }, [resolvedUserId, user?.role]);

  const statusBadgeClass = (status) => {
    if (status === "CONFIRMED") return "bg-green-50 text-green-700 border-green-200";
    if (status === "CANCELLED") return "bg-red-50 text-red-700 border-red-200";
    return "bg-yellow-50 text-yellow-800 border-yellow-200";
  };

  const columns = useMemo(
    () => [
      {
        key: "orderId",
        label: isStaff ? "Order" : "Placed",
        render: (_v, row) =>
          isStaff ? (
            <div className="space-y-0.5">
              <div className="font-semibold text-gray-900">{row.orderId}</div>
              <div className="text-xs text-gray-500">
                {row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}
              </div>
              {row.customerName && (
                <div className="text-xs text-indigo-700 font-medium truncate max-w-[220px]">
                  {row.customerName}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-0.5">
              <div className="font-semibold text-gray-900 truncate max-w-[200px]">
                {row.customerName || "—"}
              </div>
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
        key: "delivery",
        label: "Est. delivery",
        render: (_v, row) => (
          <span className="text-xs text-gray-700 max-w-[150px] inline-block leading-snug">
            {formatDeliveryRange(row.deliveryWindowStart, row.deliveryWindowEnd)}
          </span>
        ),
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
    [isStaff]
  );

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return orders.filter((o) => {
      const matchStatus =
        statusFilter === "ALL" ? true : o.status === statusFilter;
      if (!term) return matchStatus;
      if (isStaff) {
        const matchSearch = o.orderId?.toLowerCase().includes(term);
        return matchStatus && matchSearch;
      }
      const dateStr = o.createdAt
        ? new Date(o.createdAt).toLocaleString().toLowerCase()
        : "";
      const productMatch = Array.isArray(o.items)
        ? o.items.some((it) =>
            (it.productName || "").toLowerCase().includes(term)
          )
        : false;
      const nameMatch = (o.customerName || "").toLowerCase().includes(term);
      const matchSearch = dateStr.includes(term) || productMatch || nameMatch;
      return matchStatus && matchSearch;
    });
  }, [orders, statusFilter, searchTerm, isStaff]);

  const summary = useMemo(() => {
    const total = orders.length;
    const confirmed = orders.filter((o) => o.status === "CONFIRMED").length;
    const pending = orders.filter((o) => o.status === "PENDING").length;
    const cancelled = orders.filter((o) => o.status === "CANCELLED").length;
    return { total, confirmed, pending, cancelled };
  }, [orders]);

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await ordersApi.updateStatus(orderId, status);
      toast.success("Order status updated");
      await loadOrders();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleRowClick = async (row) => {
    setDetailModalOpen(true);
    setDetailOrder(null);
    setDetailLoading(true);
    try {
      const res = await ordersApi.getById(row.orderId);
      const data = res.data?.data ?? res.data;
      setDetailOrder(data);
    } catch (err) {
      toast.error(extractErrorMessage(err));
      setDetailOrder(row);
    } finally {
      setDetailLoading(false);
    }
  };

  React.useEffect(() => {
    if (detailOrder) {
      setDeliveryForm({
        start: toDateInputValue(detailOrder.deliveryWindowStart),
        end: toDateInputValue(detailOrder.deliveryWindowEnd),
      });
    }
  }, [detailOrder]);

  const handleSaveDelivery = async () => {
    if (!detailOrder?.orderId) return;
    setDeliverySaving(true);
    try {
      await ordersApi.updateDelivery(detailOrder.orderId, {
        deliveryWindowStart: deliveryForm.start || null,
        deliveryWindowEnd: deliveryForm.end || null,
      });
      toast.success("Delivery window saved");
      const res = await ordersApi.getById(detailOrder.orderId);
      setDetailOrder(res.data?.data ?? res.data);
      await loadOrders();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setDeliverySaving(false);
    }
  };

  const handleClearDeliveryWindow = async () => {
    if (!detailOrder?.orderId) return;
    setDeliverySaving(true);
    try {
      await ordersApi.updateDelivery(detailOrder.orderId, {
        deliveryWindowStart: null,
        deliveryWindowEnd: null,
      });
      setDeliveryForm({ start: "", end: "" });
      toast.success("Delivery window cleared");
      const res = await ordersApi.getById(detailOrder.orderId);
      setDetailOrder(res.data?.data ?? res.data);
      await loadOrders();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setDeliverySaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await ordersApi.remove(deleteTarget.orderId);
      toast.success("Order deleted");
      await loadOrders();
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to delete order");
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="rounded-3xl bg-gradient-to-br from-slate-100/90 via-white to-indigo-50/40 p-1 sm:p-1.5 shadow-inner">
        <div className="rounded-[1.35rem] border border-gray-200/80 bg-white shadow-xl shadow-gray-200/40 overflow-hidden">
          <div className="relative p-6 sm:p-8 bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 text-white overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_80%_20%,white_0%,transparent_45%)]" />
            <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/30 shadow-lg">
                  <ShoppingCart size={26} />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Your orders</h2>
                  <p className="text-sm text-indigo-100 mt-1 max-w-xl">
                    Track status and totals. New orders: open a product and use <span className="font-semibold text-white">Proceed to order</span>.
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="!bg-white/15 !text-white !border-white/30 hover:!bg-white/25 backdrop-blur"
                onClick={() => loadOrders()}
                loading={ordersLoading}
                disabled={!resolvedUserId && !isStaff}
              >
                <RefreshCw size={16} />
                Refresh
              </Button>
            </div>

            <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
              <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/20 px-4 py-3 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/15">
                  <ClipboardList size={18} />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-indigo-200">Total</div>
                  <div className="text-xl font-bold tabular-nums">{summary.total}</div>
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/20 px-4 py-3 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-400/20">
                  <CheckCircle2 size={18} className="text-emerald-200" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-indigo-200">Confirmed</div>
                  <div className="text-xl font-bold tabular-nums text-emerald-100">{summary.confirmed}</div>
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/20 px-4 py-3 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-400/20">
                  <Clock3 size={18} className="text-amber-200" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-indigo-200">Pending</div>
                  <div className="text-xl font-bold tabular-nums text-amber-100">{summary.pending}</div>
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/20 px-4 py-3 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-400/20">
                  <XCircle size={18} className="text-red-200" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-indigo-200">Cancelled</div>
                  <div className="text-xl font-bold tabular-nums text-red-100">{summary.cancelled}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-5 bg-slate-50/50">
            <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Order history</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {isStaff
                    ? "All orders — admin / manager view"
                    : "Your recent orders"}
                  {" "}
                  <span className="text-indigo-600 font-medium">· Click a row for details</span>
                </p>
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
                  <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Status</span>
                  <select
                    className="text-sm rounded-lg border-0 bg-transparent text-gray-900 font-medium focus:ring-0 cursor-pointer"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="search"
                    placeholder={isStaff ? "Search by order ID…" : "Search by name, date, or product…"}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <Table
            columns={
              isStaff
                ? [
                    ...columns,
                    {
                      key: "actions",
                      label: "Actions",
                      render: (_v, row) => (
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
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
                            onClick={() => setDeleteTarget(row)}
                          >
                            Delete
                          </Button>
                        </div>
                      ),
                    },
                  ]
                : columns
            }
            data={filteredOrders}
            loading={ordersLoading}
            emptyMessage={
              !resolvedUserId && !isStaff
                ? "Sign in to see your orders."
                : "No orders found."
            }
            onRowClick={handleRowClick}
              />
            </div>
          </div>
        </div>
      </div>
      <Modal
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setDetailOrder(null);
        }}
        title="Order details"
        size="lg"
      >
        {detailLoading && (
          <div className="flex justify-center py-12 text-gray-500 text-sm">Loading…</div>
        )}
        {!detailLoading && detailOrder && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-gray-100">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {isStaff ? "Order ID" : "Order date & time"}
                </p>
                {isStaff ? (
                  <p className="font-mono text-sm font-semibold text-gray-900 mt-0.5 break-all">
                    {detailOrder.orderId}
                  </p>
                ) : (
                  <p className="text-lg font-semibold text-gray-900 mt-0.5">
                    {formatDateTime(detailOrder.createdAt)}
                  </p>
                )}
              </div>
              <Badge className={statusBadgeClass(detailOrder.status)}>{detailOrder.status}</Badge>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer & delivery</p>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="font-medium text-gray-900 mt-0.5">{detailOrder.customerName || "—"}</p>
                </div>
                {isStaff && (
                  <div>
                    <p className="text-xs text-gray-500">Order date & time</p>
                    <p className="text-gray-900 mt-0.5">{formatDateTime(detailOrder.createdAt)}</p>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-500">Delivery address</p>
                  <p className="text-gray-800 mt-0.5 leading-relaxed whitespace-pre-line">
                    {formatOrderAddress(detailOrder.deliveryAddress)}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-500">Estimated delivery window</p>
                  <p className="font-medium text-indigo-900 mt-0.5">
                    {formatDeliveryRange(detailOrder.deliveryWindowStart, detailOrder.deliveryWindowEnd)}
                  </p>
                </div>
              </div>
            </div>

            {isStaff && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-3">
                <p className="text-sm font-semibold text-gray-900">Set delivery window (admin)</p>
                <p className="text-xs text-gray-600">
                  Choose the earliest and latest calendar dates the order can be delivered.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Earliest date</label>
                    <input
                      type="date"
                      value={deliveryForm.start}
                      onChange={(e) =>
                        setDeliveryForm((f) => ({ ...f, start: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Latest date</label>
                    <input
                      type="date"
                      value={deliveryForm.end}
                      onChange={(e) =>
                        setDeliveryForm((f) => ({ ...f, end: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" loading={deliverySaving} onClick={handleSaveDelivery}>
                    Save delivery window
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={deliverySaving}
                    onClick={handleClearDeliveryWindow}
                  >
                    Clear window
                  </Button>
                </div>
              </div>
            )}

            {isStaff && (
              <div className="grid sm:grid-cols-2 gap-4 text-sm border-t border-gray-100 pt-4">
                <div>
                  <p className="text-xs text-gray-500">Customer (user ID)</p>
                  <p className="font-mono text-gray-900 mt-0.5 break-all">{detailOrder.userId ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Payment ID</p>
                  <p className="font-mono text-gray-900 mt-0.5 break-all">{detailOrder.paymentId ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Last updated</p>
                  <p className="text-gray-900 mt-0.5">{formatDateTime(detailOrder.updatedAt)}</p>
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Line items</p>
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold">Product</th>
                      <th className="text-right px-3 py-2 font-semibold">Qty</th>
                      <th className="text-right px-3 py-2 font-semibold">Unit</th>
                      <th className="text-right px-3 py-2 font-semibold">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(detailOrder.items) && detailOrder.items.length > 0 ? (
                      detailOrder.items.map((it, idx) => (
                        <tr key={`${it.productId ?? "line"}-${idx}`} className="border-t border-gray-100">
                          <td className="px-3 py-2.5">
                            <div className="font-medium text-gray-900">{it.productName ?? "—"}</div>
                            {isStaff && (
                              <div className="text-xs text-gray-400 font-mono truncate max-w-[220px]">
                                {it.productId}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums">{it.quantity}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums">{formatCurrency(it.price ?? 0)}</td>
                          <td className="px-3 py-2.5 text-right font-medium tabular-nums">
                            {formatCurrency((it.price ?? 0) * (it.quantity ?? 0))}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-gray-400">
                          No line items
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="text-lg font-bold text-indigo-900 tabular-nums">
                {formatCurrency(detailOrder.totalAmount ?? 0)}
              </span>
            </div>

            <div className="flex justify-end pt-1">
              <Button variant="secondary" size="sm" onClick={() => { setDetailModalOpen(false); setDetailOrder(null); }}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete order"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to permanently delete this order?
          </p>
          {deleteTarget && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-800 space-y-1">
              <div className="flex justify-between gap-3">
                <span className="font-semibold">Order ID</span>
                <span className="font-mono truncate max-w-[200px]">
                  {deleteTarget.orderId}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="font-semibold">Total</span>
                <span>Rs. {deleteTarget.totalAmount}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="font-semibold">Status</span>
                <span>{deleteTarget.status}</span>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
