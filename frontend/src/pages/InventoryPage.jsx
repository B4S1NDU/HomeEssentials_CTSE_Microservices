import { useState, useEffect, useCallback } from 'react';
import { inventoryApi } from '../config/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const STOCK_BADGE = { IN_STOCK: 'badge-success', LOW_STOCK: 'badge-warning', OUT_OF_STOCK: 'badge-danger' };
const canManage   = role => ['Admin', 'StoreManager'].includes(role);

function stockStatus(item) {
  if (item.stockStatus) return item.stockStatus;
  if (item.availableQuantity === 0) return 'OUT_OF_STOCK';
  if (item.availableQuantity <= item.lowStockThreshold) return 'LOW_STOCK';
  return 'IN_STOCK';
}

const INIT_ADD    = { productId: '', productName: '', quantity: 0, lowStockThreshold: 10, reorderPoint: 20, location: { warehouse: 'Main Warehouse', shelf: 'A1' } };
const INIT_UPDATE = { quantity: '', lowStockThreshold: '' };

export default function InventoryPage() {
  const { user } = useAuth();
  const [items,      setItems]      = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  // Add modal state
  const [showAdd,   setShowAdd]   = useState(false);
  const [addForm,   setAddForm]   = useState(INIT_ADD);
  const [addLoad,   setAddLoad]   = useState(false);
  const [addError,  setAddError]  = useState('');

  // Update modal state
  const [updateItem, setUpdateItem] = useState(null);
  const [updateForm, setUpdateForm] = useState(INIT_UPDATE);
  const [updateLoad, setUpdateLoad] = useState(false);
  const [updateError, setUpdateError] = useState('');

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      const res = await inventoryApi.get('/api/inventory', { params });
      setItems(res.data.data    || []);
      setTotal(res.data.total   || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      setError('Failed to load inventory. Make sure the Inventory Service is running on port 3003.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  /* ---- Add inventory ---- */
  const handleAdd = async e => {
    e.preventDefault();
    setAddLoad(true);
    setAddError('');
    try {
      await inventoryApi.post('/api/inventory', addForm);
      setShowAdd(false);
      setAddForm(INIT_ADD);
      fetchInventory();
    } catch (err) {
      setAddError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Failed to create inventory item.'
      );
    } finally {
      setAddLoad(false);
    }
  };

  /* ---- Update inventory ---- */
  const openUpdate = item => {
    setUpdateItem(item);
    setUpdateForm({ quantity: item.quantity, lowStockThreshold: item.lowStockThreshold });
    setUpdateError('');
  };

  const handleUpdate = async e => {
    e.preventDefault();
    setUpdateLoad(true);
    setUpdateError('');
    try {
      const body = {};
      if (updateForm.quantity         !== '') body.quantity         = parseInt(updateForm.quantity);
      if (updateForm.lowStockThreshold !== '') body.lowStockThreshold = parseInt(updateForm.lowStockThreshold);
      await inventoryApi.put(`/api/inventory/${updateItem.productId}`, body);
      setUpdateItem(null);
      fetchInventory();
    } catch (err) {
      setUpdateError(err.response?.data?.message || 'Update failed.');
    } finally {
      setUpdateLoad(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Inventory Management</div>
          <div className="page-subtitle">{total} inventory record{total !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Status</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
          {canManage(user?.role) && (
            <button className="btn btn-primary" onClick={() => { setShowAdd(true); setAddError(''); }}>
              + Add Inventory
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="loading">Loading inventory…</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <p>No inventory items found.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Product ID</th>
                  <th>Total Qty</th>
                  <th>Reserved</th>
                  <th>Available</th>
                  <th>Threshold</th>
                  <th>Location</th>
                  <th>Status</th>
                  {canManage(user?.role) && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const status = stockStatus(item);
                  return (
                    <tr key={item._id}>
                      <td style={{ fontWeight: 600 }}>{item.productName}</td>
                      <td>
                        <code style={{ fontSize: '0.72rem', background: '#f5f5f5', padding: '1px 5px', borderRadius: 3 }}>
                          {item.productId.substring(0, 12)}…
                        </code>
                      </td>
                      <td>{item.quantity}</td>
                      <td style={{ color: item.reservedQuantity > 0 ? 'var(--warning)' : 'inherit' }}>
                        {item.reservedQuantity}
                      </td>
                      <td style={{ fontWeight: 600 }}>{item.availableQuantity}</td>
                      <td>{item.lowStockThreshold}</td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {item.location?.warehouse} / {item.location?.shelf}
                      </td>
                      <td>
                        <span className={`badge ${STOCK_BADGE[status] || 'badge-secondary'}`}>
                          {status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      {canManage(user?.role) && (
                        <td>
                          <button className="btn btn-sm btn-secondary" onClick={() => openUpdate(item)}>
                            ✏️ Update
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
          <div className="pagination">
            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              ← Prev
            </button>
            <span>Page {page} of {totalPages}</span>
            <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              Next →
            </button>
          </div>
        )}
      </div>

      {/* ===== Add Inventory Modal ===== */}
      {showAdd && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Add Inventory Item</div>
              <button className="modal-close" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <div className="modal-body">
              {addError && <div className="alert alert-danger">{addError}</div>}
              <form id="addForm" onSubmit={handleAdd}>
                <div className="form-group">
                  <label className="form-label">Product ID *</label>
                  <input
                    className="form-control"
                    value={addForm.productId}
                    onChange={e => setAddForm(f => ({ ...f, productId: e.target.value }))}
                    required
                    placeholder="MongoDB _id from Product Service"
                  />
                  <div className="form-hint">Copy the _id from the Product Catalog page or Swagger docs</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    className="form-control"
                    value={addForm.productName}
                    onChange={e => setAddForm(f => ({ ...f, productName: e.target.value }))}
                    required
                    placeholder="Must match the product name exactly"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Initial Quantity *</label>
                    <input
                      className="form-control"
                      type="number"
                      min="0"
                      value={addForm.quantity}
                      onChange={e => setAddForm(f => ({ ...f, quantity: parseInt(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Low Stock Threshold</label>
                    <input
                      className="form-control"
                      type="number"
                      min="0"
                      value={addForm.lowStockThreshold}
                      onChange={e => setAddForm(f => ({ ...f, lowStockThreshold: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Warehouse</label>
                    <input
                      className="form-control"
                      value={addForm.location.warehouse}
                      onChange={e => setAddForm(f => ({ ...f, location: { ...f.location, warehouse: e.target.value } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Shelf</label>
                    <input
                      className="form-control"
                      value={addForm.location.shelf}
                      onChange={e => setAddForm(f => ({ ...f, location: { ...f.location, shelf: e.target.value } }))}
                    />
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button form="addForm" type="submit" className="btn btn-primary" disabled={addLoad}>
                {addLoad ? 'Creating…' : 'Create Inventory'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Update Stock Modal ===== */}
      {updateItem && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Update Stock — {updateItem.productName}</div>
              <button className="modal-close" onClick={() => setUpdateItem(null)}>✕</button>
            </div>
            <div className="modal-body">
              {updateError && <div className="alert alert-danger">{updateError}</div>}
              <div className="alert alert-info">
                Current: <strong>{updateItem.quantity}</strong> total &nbsp;|&nbsp;
                <strong>{updateItem.availableQuantity}</strong> available &nbsp;|&nbsp;
                <strong>{updateItem.reservedQuantity}</strong> reserved
              </div>
              <form id="updateForm" onSubmit={handleUpdate}>
                <div className="form-group">
                  <label className="form-label">Set Total Quantity</label>
                  <input
                    className="form-control"
                    type="number"
                    min="0"
                    value={updateForm.quantity}
                    onChange={e => setUpdateForm(f => ({ ...f, quantity: e.target.value }))}
                    placeholder="Leave blank to keep unchanged"
                  />
                  <div className="form-hint">Sets the absolute total quantity (not an addition)</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Low Stock Threshold</label>
                  <input
                    className="form-control"
                    type="number"
                    min="0"
                    value={updateForm.lowStockThreshold}
                    onChange={e => setUpdateForm(f => ({ ...f, lowStockThreshold: e.target.value }))}
                    placeholder="Leave blank to keep unchanged"
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setUpdateItem(null)}>Cancel</button>
              <button form="updateForm" type="submit" className="btn btn-primary" disabled={updateLoad}>
                {updateLoad ? 'Saving…' : 'Update Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
