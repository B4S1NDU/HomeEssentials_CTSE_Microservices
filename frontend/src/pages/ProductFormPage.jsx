import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { productApi } from '../config/api.js';

const CATEGORIES = ['rice', 'soap', 'detergent', 'cooking-oil', 'spices', 'cleaning', 'personal-care', 'other'];
const UNITS      = ['kg', 'g', 'l', 'ml', 'piece', 'pack'];
const INIT       = { name: '', description: '', category: 'rice', price: '', unit: 'kg', imageUrl: '', brand: '', isActive: true };

export default function ProductFormPage() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const isEdit      = !!id;

  const [form,        setForm]        = useState(INIT);
  const [loading,     setLoading]     = useState(false);
  const [fetchLoad,   setFetchLoad]   = useState(isEdit);
  const [error,       setError]       = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!id) return;
    productApi.get(`/api/products/${id}`)
      .then(res => {
        const p = res.data.data;
        setForm({
          name:        p.name,
          description: p.description,
          category:    p.category,
          price:       p.price,
          unit:        p.unit,
          imageUrl:    p.imageUrl || '',
          brand:       p.brand   || '',
          isActive:    p.isActive,
        });
      })
      .catch(() => setError('Failed to load product details.'))
      .finally(() => setFetchLoad(false));
  }, [id]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);
    try {
      const body = { ...form, price: parseFloat(form.price) };
      if (!body.imageUrl) delete body.imageUrl;
      if (!body.brand)    delete body.brand;

      if (isEdit) {
        await productApi.put(`/api/products/${id}`, body);
      } else {
        await productApi.post('/api/products', body);
      }
      navigate('/products');
    } catch (err) {
      if (err.response?.data?.errors) {
        const errs = {};
        err.response.data.errors.forEach(e => { errs[e.path] = e.msg; });
        setFieldErrors(errs);
      } else {
        setError(err.response?.data?.message || 'Save failed. Please check all fields.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoad) return <div className="loading">Loading product…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">{isEdit ? 'Edit Product' : 'Add New Product'}</div>
          <div className="page-subtitle">
            {isEdit ? 'Update the details below' : 'Fill in the form to add a new product'}
          </div>
        </div>
        <Link to="/products" className="btn btn-secondary">← Back to Products</Link>
      </div>

      <div className="card" style={{ maxWidth: 700 }}>
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input
              className="form-control"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              minLength={3}
              maxLength={100}
              placeholder="e.g. Basmati Rice 1kg"
            />
            {fieldErrors.name && <div className="form-error">{fieldErrors.name}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
              className="form-control"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              required
              minLength={10}
              maxLength={1000}
              placeholder="Describe the product in detail…"
            />
            {fieldErrors.description && <div className="form-error">{fieldErrors.description}</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-control" name="category" value={form.category} onChange={handleChange}>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
              {fieldErrors.category && <div className="form-error">{fieldErrors.category}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Unit *</label>
              <select className="form-control" name="unit" value={form.unit} onChange={handleChange}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Price (LKR) *</label>
              <input
                className="form-control"
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                placeholder="0.00"
              />
              {fieldErrors.price && <div className="form-error">{fieldErrors.price}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Brand</label>
              <input
                className="form-control"
                name="brand"
                value={form.brand}
                onChange={handleChange}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Image URL</label>
            <input
              className="form-control"
              name="imageUrl"
              value={form.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg  (optional)"
            />
            {fieldErrors.imageUrl && <div className="form-error">{fieldErrors.imageUrl}</div>}
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              style={{ width: 16, height: 16, accentColor: 'var(--primary)' }}
            />
            <label htmlFor="isActive" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
              Product is Active (visible to customers)
            </label>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : (isEdit ? '✅ Update Product' : '✅ Create Product')}
            </button>
            <Link to="/products" className="btn btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
