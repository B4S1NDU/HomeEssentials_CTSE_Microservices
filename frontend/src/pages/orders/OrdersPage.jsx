import React, { useMemo, useState } from "react";
import {
  ShoppingCart,
  RefreshCw,
  ClipboardList,
  CheckCircle2,
  Clock3,
  XCircle,
  Search,
  User,
  MapPin,
  CalendarClock,
  Package,
  Receipt,
  Truck,
  Hash,
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

  const statusHeroClass = (status) => {
    if (status === "CONFIRMED")
      return "from-emerald-600 via-teal-600 to-cyan-700 ring-emerald-400/30";
    if (status === "CANCELLED")
      return "from-rose-600 via-red-600 to-red-800 ring-rose-400/30";
    return "from-amber-500 via-orange-500 to-amber-700 ring-amber-400/30";
  };

  const statusIcon = (status) => {
    if (status === "CONFIRMED") return CheckCircle2;
    if (status === "CANCELLED") return XCircle;
    return Clock3;
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
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {isStaff ? "Orders" : "Your orders"}
                  </h2>
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
        size="xl"
      >
        {detailLoading && (
          <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading order details">
            <div className="h-28 rounded-2xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200" />
            <div className="grid sm:grid-cols-3 gap-3">
              {[1, 2, 3].map((k) => (
                <div key={k} className="h-24 rounded-2xl bg-slate-100" />
              ))}
            </div>
            <div className="h-40 rounded-2xl bg-slate-100" />
            <div className="h-14 rounded-xl bg-indigo-100/80" />
          </div>
        )}
        {!detailLoading && detailOrder && (
          <div className="space-y-6 -mx-1">
            {/* Hero */}
            <div
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${statusHeroClass(
                detailOrder.status
              )} p-5 sm:p-6 text-white shadow-lg ring-1 ring-inset`}
            >
              <div className="absolute inset-0 opacity-25 bg-[radial-gradient(ellipse_at_80%_0%,white_0%,transparent_55%)]" />
              <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex gap-4 min-w-0">
                  <div className="shrink-0 p-3 rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/25">
                    {(() => {
                      const Icon = statusIcon(detailOrder.status);
                      return <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white/95" strokeWidth={1.75} />;
                    })()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
                      {isStaff ? "Order reference" : "Placed on"}
                    </p>
                    {isStaff ? (
                      <p className="mt-1 font-mono text-sm sm:text-base font-semibold break-all text-white">
                        {detailOrder.orderId}
                      </p>
                    ) : (
                      <p className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-white">
                        {formatDateTime(detailOrder.createdAt)}
                      </p>
                    )}
                    {isStaff && (
                      <p className="mt-2 text-sm text-white/85 flex items-center gap-2">
                        <CalendarClock className="w-4 h-4 shrink-0 opacity-90" />
                        {formatDateTime(detailOrder.createdAt)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex sm:flex-col items-start sm:items-end gap-2 shrink-0">
                  <Badge
                    className={`${statusBadgeClass(detailOrder.status)} !border-white/40 !bg-white/95 !text-gray-900 shadow-sm`}
                  >
                    {detailOrder.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Customer & delivery cards */}
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-sm hover:shadow-md transition-shadow ring-1 ring-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <User size={18} />
                  </span>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 leading-snug">
                  {detailOrder.customerName || "—"}
                </p>
              </div>
              <div className="sm:col-span-2 rounded-2xl border border-gray-200/90 bg-gradient-to-br from-slate-50/80 to-white p-4 shadow-sm ring-1 ring-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <MapPin size={18} />
                  </span>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Delivery address</span>
                </div>
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                  {formatOrderAddress(detailOrder.deliveryAddress)}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/40 p-4 sm:p-5 shadow-sm ring-1 ring-indigo-100/80">
              <div className="flex items-start gap-3">
                <span className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/25">
                  <Truck size={18} />
                </span>
                <div>
                  <p className="text-xs font-semibold text-indigo-800 uppercase tracking-wide">Estimated delivery window</p>
                  <p className="mt-1 text-base font-semibold text-gray-900">
                    {formatDeliveryRange(detailOrder.deliveryWindowStart, detailOrder.deliveryWindowEnd)}
                  </p>
                </div>
              </div>
            </div>

            {isStaff && (
              <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-4 sm:p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-violet-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Set delivery window</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Earliest and latest dates the order can be delivered.
                    </p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Earliest date</label>
                    <input
                      type="date"
                      value={deliveryForm.start}
                      onChange={(e) =>
                        setDeliveryForm((f) => ({ ...f, start: e.target.value }))
                      }
                      className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Latest date</label>
                    <input
                      type="date"
                      value={deliveryForm.end}
                      onChange={(e) =>
                        setDeliveryForm((f) => ({ ...f, end: e.target.value }))
                      }
                      className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
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
              <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 grid sm:grid-cols-3 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Hash size={12} className="text-gray-400" />
                    User ID
                  </p>
                  <p className="font-mono text-xs text-gray-900 break-all leading-relaxed">{detailOrder.userId ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Payment ID</p>
                  <p className="font-mono text-xs text-gray-900 break-all leading-relaxed">{detailOrder.paymentId ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Last updated</p>
                  <p className="text-gray-900 text-sm">{formatDateTime(detailOrder.updatedAt)}</p>
                </div>
              </div>
            )}

            {/* Line items */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden ring-1 ring-gray-100">
              <div className="flex items-center justify-between gap-3 px-4 py-3.5 bg-gradient-to-r from-slate-50 to-gray-50/80 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-lg bg-white border border-gray-200 text-gray-700 shadow-sm">
                    <Package size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Line items</p>
                    <p className="text-xs text-gray-500">
                      {Array.isArray(detailOrder.items) ? detailOrder.items.length : 0} product
                      {Array.isArray(detailOrder.items) && detailOrder.items.length !== 1 ? "s" : ""} in this order
                    </p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[520px]">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500 bg-white">
                      <th className="px-4 py-3 font-semibold">Product</th>
                      <th className="px-4 py-3 font-semibold text-right w-16">Qty</th>
                      <th className="px-4 py-3 font-semibold text-right">Unit</th>
                      <th className="px-4 py-3 font-semibold text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Array.isArray(detailOrder.items) && detailOrder.items.length > 0 ? (
                      detailOrder.items.map((it, idx) => (
                        <tr
                          key={`${it.productId ?? "line"}-${idx}`}
                          className="bg-white hover:bg-indigo-50/40 transition-colors"
                        >
                          <td className="px-4 py-3.5 align-top">
                            <div className="font-medium text-gray-900">{it.productName ?? "—"}</div>
                            {isStaff && it.productId && (
                              <div className="text-[11px] text-gray-400 font-mono truncate max-w-[260px] mt-0.5">
                                {it.productId}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right tabular-nums text-gray-800 font-medium">
                            {it.quantity}
                          </td>
                          <td className="px-4 py-3.5 text-right tabular-nums text-gray-600">{formatCurrency(it.price ?? 0)}</td>
                          <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-gray-900">
                            {formatCurrency((it.price ?? 0) * (it.quantity ?? 0))}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center">
                          <div className="inline-flex flex-col items-center gap-2 text-gray-400">
                            <Package className="w-8 h-8 opacity-50" />
                            <span className="text-sm">No line items</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white shadow-lg shadow-indigo-900/20 ring-1 ring-white/10">
              <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_100%_0%,white_0%,transparent_50%)]" />
              <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 sm:px-6 sm:py-5">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-xl bg-white/15 ring-1 ring-white/20">
                    <Receipt className="w-6 h-6" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-indigo-200">Order total</p>
                    <p className="text-lg font-bold tracking-tight">Amount due</p>
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight">
                  {formatCurrency(detailOrder.totalAmount ?? 0)}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-1 gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setDetailModalOpen(false);
                  setDetailOrder(null);
                }}
              >
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
