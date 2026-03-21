import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, AlertTriangle, Edit2, Trash2, Warehouse } from 'lucide-react';
import { inventoryApi } from '../../api/inventoryApi';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import InventoryForm from './InventoryForm';
import StockCheckPanel from './StockCheckPanel';
import toast from 'react-hot-toast';
import { extractErrorMessage, getStockStatusColor, formatDate } from '../../utils/helpers';

export default function InventoryPage() {
  const { isAdminOrManager } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [lowStockCount, setLowStockCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [checkPanelOpen, setCheckPanelOpen] = useState(false);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const [invRes, lowRes] = await Promise.allSettled([
        inventoryApi.getAll(params),
        inventoryApi.getLowStock(),
      ]);
      if (invRes.status === 'fulfilled') {
        const d = invRes.value.data;
        setItems(d.data ?? []);
        setTotalPages(d.totalPages ?? 1);
        setTotal(d.total ?? d.count ?? 0);
      }
      if (lowRes.status === 'fulfilled') {
        setLowStockCount(lowRes.value.data?.count ?? 0);
      }
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const openCreate = () => { setEditItem(null); setModalOpen(true); };
  const openEdit = (item) => { setEditItem(item); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditItem(null); };
  const handleSaved = () => { closeModal(); fetchInventory(); };

  const handleDelete = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to delete inventory for "${productName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await inventoryApi.delete(productId);
      toast.success('Inventory item deleted successfully');
      fetchInventory();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const columns = [
    {
      key: 'productName',
      label: 'Product',
      render: (val, row) => (
        <div>
          <p className="font-medium text-gray-900 text-sm">{val}</p>
          <p className="text-xs text-gray-400 font-mono">{row.productId}</p>
        </div>
      ),
    },
    {
      key: 'quantity',
      label: 'Total Qty',
      render: (val) => <span className="font-semibold text-gray-900">{val}</span>,
    },
    {
      key: 'reservedQuantity',
      label: 'Reserved',
      render: (val) => <span className="text-orange-600 font-medium">{val}</span>,
    },
    {
      key: 'availableQuantity',
      label: 'Available',
      render: (val) => <span className="text-green-700 font-semibold">{val}</span>,
    },
    {
      key: 'stockStatus',
      label: 'Status',
      render: (val) => (
        <Badge className={getStockStatusColor(val)}>
          {val?.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'lowStockThreshold',
      label: 'Threshold',
      render: (val) => <span className="text-gray-500 text-xs">{val}</span>,
    },
    {
      key: 'location',
      label: 'Location',
      render: (val) => (
        <span className="text-gray-500 text-xs">{val?.warehouse} / {val?.shelf}</span>
      ),
    },
    {
      key: 'lastRestocked',
      label: 'Last Restocked',
      render: (val) => <span className="text-gray-500 text-xs">{formatDate(val)}</span>,
    },
    {
      key: '_id',
      label: 'Actions',
      render: (_, row) =>
        isAdminOrManager() ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => openEdit(row)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Edit inventory"
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={() => handleDelete(row.productId, row.productName)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Delete inventory"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Inventory</h2>
          <p className="text-sm text-gray-500">{total} item{total !== 1 ? 's' : ''} tracked</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchInventory} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
            <RefreshCw size={16} />
          </button>
          <Button variant="secondary" onClick={() => setCheckPanelOpen(true)}>
            Check Stock
          </Button>
          {isAdminOrManager() && (
            <Button onClick={openCreate}>
              <Plus size={16} /> Add Item
            </Button>
          )}
        </div>
      </div>

      {/* Low stock alert */}
      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
          <AlertTriangle size={18} className="text-yellow-500 flex-shrink-0" />
          <p className="text-sm text-yellow-800">
            <span className="font-semibold">{lowStockCount} item{lowStockCount !== 1 ? 's' : ''}</span>{' '}
            {lowStockCount !== 1 ? 'are' : 'is'} low on stock and may need restocking soon.
          </p>
          <button
            onClick={() => { setStatusFilter('LOW_STOCK'); setPage(1); }}
            className="ml-auto text-xs text-yellow-700 underline hover:no-underline"
          >
            View
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
        <span className="text-sm font-medium text-gray-600">Filter by status:</span>
        {['', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${statusFilter === s
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <Table columns={columns} data={items} loading={loading} emptyMessage="No inventory items found." />
        <div className="p-4 border-t border-gray-100">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editItem ? 'Update Inventory' : 'Add Inventory Item'}
        size="md"
      >
        <InventoryForm item={editItem} onSaved={handleSaved} onCancel={closeModal} />
      </Modal>

      {/* Stock Check Panel */}
      <Modal open={checkPanelOpen} onClose={() => setCheckPanelOpen(false)} title="Check Stock Availability" size="sm">
        <StockCheckPanel />
      </Modal>
    </div>
  );
}
