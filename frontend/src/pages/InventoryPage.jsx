import { useState, useEffect, useCallback } from 'react';
import { inventoryApi } from '../config/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const STATUS_STYLE = {
  IN_STOCK:     'bg-green-50 text-green-700 border border-green-200',
  LOW_STOCK:    'bg-amber-50 text-amber-700 border border-amber-200',
  OUT_OF_STOCK: 'bg-red-50 text-red-600 border border-red-200',
};
const canManage = role => ['Admin', 'StoreManager'].includes(role);

function stockStatus(item) {
  if (item.stockStatus) return item.stockStatus;
  if (item.availableQuantity === 0) return 'OUT_OF_STOCK';
  if (item.availableQuantity <= item.lowStockThreshold) return 'LOW_STOCK';
  return 'IN_STOCK';
}

const INIT_ADD = { productId: '', productName: '', quantity: 0, lowStockThreshold: 10, reorderPoint: 20, location: { warehouse: 'Main Warehouse', shelf: 'A1' } };
const INIT_UPD = { quantity: '', lowStockThreshold: '' };

function Modal({ title, onClose, onSubmit, submitLabel, submitLoading, children, error }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-base">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none transition-colors">Ã—</button>
        </div>
        <div className="px-5 py-4 space-y-4 max-h-[65vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-lg px-3 py-2 text-sm">
              <span>âš ï¸</span><span>{error}</span>
            </div>
          )}
          {children}
        </div>
        <div className="flex gap-2 px-5 pb-5 pt-3 border-t border-gray-50">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button
            onClick={onSubmit}
            disabled={submitLoading}
            className="flex-1 px-4 py-2 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {submitLoading ? (
              <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Savingâ€¦</>
            ) : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const { user } = useAuth();
  const [items,        setItems]        = useState([]);
  const [total,        setTotal]        = useState(0);
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  const [showAdd,    setShowAdd]    = useState(false);
  const [addForm,    setAddForm]    = useState(INIT_ADD);
  const [addLoad,    setAddLoad]    = useState(false);
  const [addError,   setAddError]   = useState('');

  const [updateItem,  setUpdateItem]  = useState(null);
  const [updateForm,  setUpdateForm]  = useState(INIT_UPD);
  const [updateLoad,  setUpdateLoad]  = useState(false);
  const [updateError, setUpdateError] = useState('');

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      const res = await inventoryApi.get('/api/inventory', { params });
      setItems(res.data.data      || []);
      setTotal(res.data.total     || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      setError('Failed to load inventory. Make sure the Inventory Service is running on port 3003.');
    } finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const handleAdd = async () => {
    setAddLoad(true);
    setAddError('');
    try {
      await inventoryApi.post('/api/inventory', addForm);
      setShowAdd(false); setAddForm(INIT_ADD); fetchInventory();
    } catch (err) {
      setAddError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to create item.');
    } finally { setAddLoad(false); }
  };

  const openUpdate = item => { setUpdateItem(item); setUpdateForm({ quantity: item.quantity, lowStockThreshold: item.lowStockThreshold }); setUpdateError(''); };

  const handleUpdate = async () => {
    setUpdateLoad(true);
    setUpdateError('');
    try {
      const body = {};
      if (updateForm.quantity          !== '') body.quantity          = parseInt(updateForm.quantity);
      if (updateForm.lowStockThreshold !== '') body.lowStockThreshold = parseInt(updateForm.lowStockThreshold);
      await inventoryApi.put(`/api/inventory/${updateItem.productId}`, body);
      setUpdateItem(null); fetchInventory();
    } catch (err) {
      setUpdateError(err.response?.data?.message || 'Update failed.');
    } finally { setUpdateLoad(false); }
  };

  const inputCls = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 focus:bg-white transition';
  const labelCls = 'block text-sm font-semibold text-gray-700 mb-1.5';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Inventory Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} inventory record{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Status</option>
            <option value="IN_STOCK">ðŸŸ¢ In Stock</option>
            <option value="LOW_STOCK">ðŸŸ¡ Low Stock</option>
            <option value="OUT_OF_STOCK">ðŸ”´ Out of Stock</option>
          </select>
          {canManage(user?.role) && (
            <button
              onClick={() => { setShowAdd(true); setAddError(''); }}
              className="inline-flex items-center gap-1.5 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              + Add Inventory
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
          <span>âš ï¸</span><span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <svg className="animate-spin h-6 w-6 mr-2" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
            Loading inventoryâ€¦
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <span className="text-5xl mb-3">ðŸ“Š</span>
            <p className="text-sm font-medium">No inventory items found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  {['Product Name', 'Product ID', 'Total', 'Reserved', 'Available', 'Threshold', 'Location', 'Status', ...(canManage(user?.role) ? ['Action'] : [])]
                    .map(h => (
                      <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map(item => {
                  const status = stockStatus(item);
                  return (
                    <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-800">{item.productName}</td>
                      <td className="px-4 py-3">
                        <code className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {item.productId.substring(0, 10)}â€¦
                        </code>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{item.quantity}</td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${
                          item.reservedQuantity > 0 ? 'text-amber-600' : 'text-gray-500'
                        }`}>
                          {item.reservedQuantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-800">{item.availableQuantity}</td>
                      <td className="px-4 py-3 text-gray-500">{item.lowStockThreshold}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {item.location?.warehouse} / {item.location?.shelf}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${STATUS_STYLE[status]}`}>
                          {status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      {canManage(user?.role) && (
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openUpdate(item)}
                            className="text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg px-2.5 py-1.5 font-medium transition-colors"
                          >
                            âœï¸ Update
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 py-4 border-t border-gray-50">
            <button
              className="px-4 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              â† Prev
            </button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button
              className="px-4 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next â†’
            </button>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <Modal title="Add Inventory Item" onClose={() => setShowAdd(false)} onSubmit={handleAdd} submitLabel="Create Inventory" submitLoading={addLoad} error={addError}>
          <div>
            <label className={labelCls}>Product ID *</label>
            <input className={inputCls} value={addForm.productId} onChange={e => setAddForm(f => ({ ...f, productId: e.target.value }))} required placeholder="MongoDB _id from Product Service" />
            <p className="text-xs text-gray-400 mt-1">Copy the _id from Product Catalog or Swagger docs</p>
          </div>
          <div>
            <label className={labelCls}>Product Name *</label>
            <input className={inputCls} value={addForm.productName} onChange={e => setAddForm(f => ({ ...f, productName: e.target.value }))} required placeholder="Must match the product name exactly" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Initial Quantity *</label>
              <input className={inputCls} type="number" min="0" value={addForm.quantity} onChange={e => setAddForm(f => ({ ...f, quantity: parseInt(e.target.value) || 0 }))} required />
            </div>
            <div>
              <label className={labelCls}>Low Stock Threshold</label>
              <input className={inputCls} type="number" min="0" value={addForm.lowStockThreshold} onChange={e => setAddForm(f => ({ ...f, lowStockThreshold: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Warehouse</label>
              <input className={inputCls} value={addForm.location.warehouse} onChange={e => setAddForm(f => ({ ...f, location: { ...f.location, warehouse: e.target.value } }))} />
            </div>
            <div>
              <label className={labelCls}>Shelf</label>
              <input className={inputCls} value={addForm.location.shelf} onChange={e => setAddForm(f => ({ ...f, location: { ...f.location, shelf: e.target.value } }))} />
            </div>
          </div>
        </Modal>
      )}

      {/* Update Modal */}
      {updateItem && (
        <Modal title={`Update Stock â€” ${updateItem.productName}`} onClose={() => setUpdateItem(null)} onSubmit={handleUpdate} submitLabel="Update Stock" submitLoading={updateLoad} error={updateError}>
          <div className="flex items-center gap-4 bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
            <span>ðŸ“Š <strong>{updateItem.quantity}</strong> total</span>
            <span>â—¦ <strong>{updateItem.availableQuantity}</strong> available</span>
            <span>â—¦ <strong>{updateItem.reservedQuantity}</strong> reserved</span>
          </div>
          <div>
            <label className={labelCls}>Set Total Quantity</label>
            <input className={inputCls} type="number" min="0" value={updateForm.quantity} onChange={e => setUpdateForm(f => ({ ...f, quantity: e.target.value }))} placeholder="Leave blank to keep current" />
            <p className="text-xs text-gray-400 mt-1">Sets the absolute total (not an addition)</p>
          </div>
          <div>
            <label className={labelCls}>Low Stock Threshold</label>
            <input className={inputCls} type="number" min="0" value={updateForm.lowStockThreshold} onChange={e => setUpdateForm(f => ({ ...f, lowStockThreshold: e.target.value }))} placeholder="Leave blank to keep current" />
          </div>
        </Modal>
      )}
    </div>
  );
}
