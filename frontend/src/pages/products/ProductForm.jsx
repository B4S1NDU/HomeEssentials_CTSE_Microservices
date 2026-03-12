import { useState } from 'react';
import { productsApi } from '../../api/productApi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from '../../utils/constants';
import { extractErrorMessage } from '../../utils/helpers';
import toast from 'react-hot-toast';

const CATEGORY_OPTIONS = PRODUCT_CATEGORIES.map((c) => ({ value: c, label: c }));
const UNIT_OPTIONS = PRODUCT_UNITS.map((u) => ({ value: u, label: u }));

export default function ProductForm({ product, onSaved, onCancel }) {
  const isEdit = !!product;
  const [form, setForm] = useState({
    name: product?.name ?? '',
    description: product?.description ?? '',
    category: product?.category ?? 'other',
    price: product?.price ?? '',
    unit: product?.unit ?? 'piece',
    brand: product?.brand ?? '',
    imageUrl: product?.imageUrl ?? '',
    isActive: product?.isActive ?? true,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: field === 'isActive' ? e.target.checked : e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.length < 3) errs.name = 'Name must be at least 3 characters';
    if (!form.description.trim() || form.description.length < 10) errs.description = 'Description must be at least 10 characters';
    if (form.price === '' || isNaN(form.price) || Number(form.price) < 0) errs.price = 'Valid price required';
    if (!form.category) errs.category = 'Category is required';
    if (!form.unit) errs.unit = 'Unit is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const payload = { ...form, price: Number(form.price) };
      if (!payload.imageUrl) delete payload.imageUrl;
      if (!payload.brand) delete payload.brand;

      if (isEdit) {
        await productsApi.update(product._id, payload);
        toast.success('Product updated successfully');
      } else {
        await productsApi.create(payload);
        toast.success('Product created successfully');
      }
      onSaved();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Product Name"
        value={form.name}
        onChange={set('name')}
        error={errors.name}
        placeholder="e.g., Sunlight Soap Bar"
        required
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={form.description}
          onChange={set('description')}
          rows={3}
          className={`rounded-lg border px-3 py-2 text-sm outline-none resize-none transition-colors
            focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            ${errors.description ? 'border-red-400' : 'border-gray-300'}`}
          placeholder="Describe the product in at least 10 characters..."
        />
        {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Category"
          value={form.category}
          onChange={set('category')}
          options={CATEGORY_OPTIONS}
          error={errors.category}
          required
        />
        <Select
          label="Unit"
          value={form.unit}
          onChange={set('unit')}
          options={UNIT_OPTIONS}
          error={errors.unit}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Price (LKR)"
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={set('price')}
          error={errors.price}
          placeholder="0.00"
          required
        />
        <Input
          label="Brand"
          value={form.brand}
          onChange={set('brand')}
          placeholder="Optional"
        />
      </div>

      <Input
        label="Image URL"
        type="url"
        value={form.imageUrl}
        onChange={set('imageUrl')}
        placeholder="https://..."
      />

      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={set('isActive')}
          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        Product is active (visible to customers)
      </label>

      <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>
          {isEdit ? 'Save Changes' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
}
