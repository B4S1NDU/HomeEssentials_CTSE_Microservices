import { useState } from 'react';
import { inventoryApi } from '../../api/inventoryApi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import { extractErrorMessage, getStockStatusColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function StockCheckPanel() {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!productId.trim() || !quantity) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await inventoryApi.checkStock({
        productId: productId.trim(),
        quantity: Number(quantity),
      });
      setResult(res.data);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleCheck} className="space-y-3">
        <Input
          label="Product ID"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          placeholder="Enter product ID"
          required
        />
        <Input
          label="Requested Quantity"
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="1"
          required
        />
        <Button type="submit" loading={loading} className="w-full">Check Availability</Button>
      </form>

      {result && (
        <div className={`rounded-xl p-4 border ${result.available ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-sm text-gray-900">
              {result.available ? '✓ Stock Available' : '✗ Insufficient Stock'}
            </span>
            <Badge className={getStockStatusColor(result.stockStatus)}>
              {result.stockStatus?.replace(/_/g, ' ')}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-gray-500">Requested</p>
              <p className="font-semibold text-gray-900">{result.requestedQuantity}</p>
            </div>
            <div>
              <p className="text-gray-500">Available</p>
              <p className="font-semibold text-gray-900">{result.availableQuantity}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
