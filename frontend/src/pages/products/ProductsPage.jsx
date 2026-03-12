import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Package, RefreshCw } from 'lucide-react';
import { productsApi } from '../../api/productApi';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import ProductForm from './ProductForm';
import toast from 'react-hot-toast';
import { extractErrorMessage, formatCurrency, capitalizeFirst } from '../../utils/helpers';
import { PRODUCT_CATEGORIES } from '../../utils/constants';

export default function ProductsPage() {
  const { isAdminOrManager } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (category) params.category = category;
      if (!showInactive) params.isActive = true;
      const res = await productsApi.getAll(params);
      const d = res.data;
      setProducts(d.data ?? []);
      setTotalPages(d.totalPages ?? 1);
      setTotal(d.total ?? d.count ?? 0);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, category, showInactive]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') { setPage(1); fetchProducts(); }
  };

  const openCreate = () => { setEditProduct(null); setModalOpen(true); };
  const openEdit = (product) => { setEditProduct(product); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditProduct(null); };

  const handleSaved = () => { closeModal(); fetchProducts(); };

  const confirmDelete = (product) => setDeleteTarget(product);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await productsApi.delete(deleteTarget._id);
      toast.success('Product deleted');
      setDeleteTarget(null);
      fetchProducts();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Product',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          {row.imageUrl ? (
            <img src={row.imageUrl} alt={val} className="w-9 h-9 rounded-lg object-cover bg-gray-100" />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Package size={16} className="text-indigo-400" />
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900 text-sm">{val}</p>
            {row.brand && <p className="text-xs text-gray-400">{row.brand}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (val) => (
        <Badge className="text-indigo-700 bg-indigo-50 border-indigo-200 capitalize">{val}</Badge>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      render: (val, row) => (
        <span className="font-semibold text-gray-900">{formatCurrency(val)}</span>
      ),
    },
    { key: 'unit', label: 'Unit', render: (val) => <span className="text-gray-500">{val}</span> },
    {
      key: 'isActive',
      label: 'Status',
      render: (val) => (
        <Badge className={val ? 'text-green-700 bg-green-50 border-green-200' : 'text-gray-500 bg-gray-50 border-gray-200'}>
          {val ? 'Active' : 'Inactive'}
        </Badge>
      ),
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
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={() => confirmDelete(row)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
          <h2 className="text-xl font-bold text-gray-900">Products</h2>
          <p className="text-sm text-gray-500">{total} product{total !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchProducts}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          {isAdminOrManager() && (
            <Button onClick={openCreate} size="md">
              <Plus size={16} /> Add Product
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">All Categories</option>
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c} value={c}>{capitalizeFirst(c)}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => { setShowInactive(e.target.checked); setPage(1); }}
            className="rounded"
          />
          Show inactive
        </label>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <Table columns={columns} data={products} loading={loading} emptyMessage="No products found." />
        <div className="p-4 border-t border-gray-100">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editProduct ? 'Edit Product' : 'Add New Product'}
        size="lg"
      >
        <ProductForm product={editProduct} onSaved={handleSaved} onCancel={closeModal} />
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Product" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-gray-900">{deleteTarget?.name}</span>? This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" loading={deleteLoading} onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
