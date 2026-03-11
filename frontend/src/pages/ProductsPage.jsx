import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productApi } from '../config/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const CATEGORIES = ['rice', 'soap', 'detergent', 'cooking-oil', 'spices', 'cleaning', 'personal-care', 'other'];
const EMOJI = { rice: '🌾', soap: '🧼', detergent: '🧴', 'cooking-oil': '🫙', spices: '🌶️', cleaning: '🧹', 'personal-care': '💊', other: '📦' };
const canManage = role => ['Admin', 'StoreManager'].includes(role);

export default function ProductsPage() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [products,   setProducts]   = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [category,   setCategory]   = useState('');
  const [deleteId,   setDeleteId]   = useState(null);
  const [deleting,   setDeleting]   = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 12 };
      if (category) params.category = category;
      if (search)   params.search   = search;
      const res = await productApi.get('/api/products', { params });
      setProducts(res.data.data    || []);
      setTotal(res.data.total      || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      setError('Failed to load products. Make sure the Product Service is running on port 3002.');
    } finally {
      setLoading(false);
    }
  }, [page, category, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSearch = e => { e.preventDefault(); setPage(1); fetchProducts(); };

  const clearFilters = () => { setSearch(''); setCategory(''); setPage(1); };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await productApi.delete(`/api/products/${deleteId}`);
      setDeleteId(null);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Product Catalog</div>
          <div className="page-subtitle">{total} product{total !== 1 ? 's' : ''} available</div>
        </div>
        {canManage(user?.role) && (
          <Link to="/products/new" className="btn btn-primary">+ Add Product</Link>
        )}
      </div>

      {/* Filter Bar */}
      <form className="filter-bar" onSubmit={handleSearch}>
        <input
          className="form-control"
          placeholder="🔍  Search products…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="form-control"
          value={category}
          onChange={e => { setCategory(e.target.value); setPage(1); }}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>
              {EMOJI[c]} {c.charAt(0).toUpperCase() + c.slice(1).replace('-', ' ')}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-secondary">Search</button>
        {(search || category) && (
          <button type="button" className="btn btn-secondary" onClick={clearFilters}>✕ Clear</button>
        )}
      </form>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="loading">Loading products…</div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <p>No products found.</p>
          {canManage(user?.role) && (
            <Link to="/products/new" className="btn btn-primary" style={{ marginTop: 14 }}>
              + Add your first product
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="products-grid">
            {products.map(p => (
              <div className={`product-card${p.isActive === false ? ' inactive-overlay' : ''}`} key={p._id}>
                <div className="product-img">
                  {p.imageUrl && !p.imageUrl.includes('placeholder.com') ? (
                    <img src={p.imageUrl} alt={p.name} />
                  ) : (
                    <span style={{ fontSize: '3rem' }}>{EMOJI[p.category] || '📦'}</span>
                  )}
                </div>
                <div className="product-body">
                  <div className="product-name">{p.name}</div>
                  <div className="product-desc">{p.description}</div>
                  <div className="product-meta">
                    <span className="product-category">{p.category}</span>
                    {p.brand && <span className="product-brand">• {p.brand}</span>}
                    {p.isActive === false && (
                      <span className="badge badge-secondary" style={{ marginLeft: 'auto' }}>Inactive</span>
                    )}
                  </div>
                  <div className="product-price">
                    LKR {Number(p.price).toFixed(2)}
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                      {' '}/ {p.unit}
                    </span>
                  </div>
                  {canManage(user?.role) && (
                    <div className="product-actions">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => navigate(`/products/${p._id}/edit`)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => setDeleteId(p._id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

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
        </>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Confirm Delete</div>
              <button className="modal-close" onClick={() => setDeleteId(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this product? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
