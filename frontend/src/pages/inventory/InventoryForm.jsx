import { useState } from 'react';
import { inventoryApi } from '../../api/inventoryApi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { extractErrorMessage } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function InventoryForm({ item, onSaved, onCancel }) {
  const isEdit = !!item;
  const [form, setForm] = useState({
    productId: item?.productId ?? '',
    productName: item?.productName ?? '',
    quantity: item?.quantity ?? '',
    lowStockThreshold: item?.lowStockThreshold ?? 10,
    reorderPoint: item?.reorderPoint ?? 20,
    warehouse: item?.location?.warehouse ?? 'Main Warehouse',
    shelf: item?.location?.shelf ?? 'A1',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!isEdit && !form.productId.trim()) errs.productId = 'Product ID is required';
    if (!isEdit && !form.productName.trim()) errs.productName = 'Product Name is required';
    if (form.quantity === '' || isNaN(form.quantity) || Number(form.quantity) < 0)
      errs.quantity = 'Valid quantity required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const payload = {
        quantity: Number(form.quantity),
        lowStockThreshold: Number(form.lowStockThreshold),
        reorderPoint: Number(form.reorderPoint),
        location: { warehouse: form.warehouse, shelf: form.shelf },
      };
      if (!isEdit) {
        payload.productId = form.productId;
        payload.productName = form.productName;
        await inventoryApi.create(payload);
        toast.success('Inventory item created');
      } else {
        await inventoryApi.update(item.productId, payload);
        toast.success('Inventory updated successfully');
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
      {!isEdit && (
        <>
          <Input
            label="Product ID"
            value={form.productId}
            onChange={set('productId')}
            error={errors.productId}
            placeholder="MongoDB ObjectId of the product"
            required
          />
          <Input
            label="Product Name"
            value={form.productName}
            onChange={set('productName')}
            error={errors.productName}
            placeholder="Product display name"
            required
          />
        </>
      )}
      {isEdit && (
        <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
          <p className="text-xs text-gray-500 font-medium">Product</p>
          <p className="text-sm font-semibold text-gray-900">{item.productName}</p>
          <p className="text-xs text-gray-400 font-mono">{item.productId}</p>
        </div>
      )}

      <Input
        label="Quantity"
        type="number"
        min="0"
        value={form.quantity}
        onChange={set('quantity')}
        error={errors.quantity}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Low Stock Threshold"
          type="number"
          min="0"
          value={form.lowStockThreshold}
          onChange={set('lowStockThreshold')}
          helperText="Alert when qty falls below this"
        />
        <Input
          label="Reorder Point"
          type="number"
          min="0"
          value={form.reorderPoint}
          onChange={set('reorderPoint')}
          helperText="Suggested reorder trigger"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Warehouse" value={form.warehouse} onChange={set('warehouse')} />
        <Input label="Shelf" value={form.shelf} onChange={set('shelf')} />
      </div>

      <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>
          {isEdit ? 'Update Inventory' : 'Create Item'}
        </Button>
      </div>
    </form>
  );
}
