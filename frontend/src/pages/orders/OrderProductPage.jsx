import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Minus,
  Plus,
  Package,
  ShoppingCart,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { productsApi } from '../../api/productApi';
import { ordersApi } from '../../api/orderApi';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';
import { extractErrorMessage, formatCurrency } from '../../utils/helpers';

/**
 * Order flow: product detail + quantity → Proceed creates order via Order Service.
 * Route: /order/product/:productId
 */
export default function OrderProductPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id ?? user?._id;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!productId) return;
      setLoading(true);
      try {
        const res = await productsApi.getById(productId);
        const data = res.data?.data ?? res.data;
        if (!cancelled) setProduct(data);
      } catch (err) {
        if (!cancelled) {
          toast.error(extractErrorMessage(err));
          setProduct(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const lineTotal =
    product && typeof product.price === 'number'
      ? product.price * quantity
      : 0;

  const handleProceed = async () => {
    if (!userId) {
      toast.error('Please log in to place an order');
      navigate('/login', { state: { from: `/order/product/${productId}` } });
      return;
    }
    if (!product?._id) return;
    if (quantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await ordersApi.create({
        userId,
        items: [{ productId: product._id, quantity: Number(quantity) }],
      });
      toast.success('Order placed successfully');
      navigate('/orders', { state: { createdOrder: data?.data } });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-gradient-to-b from-slate-50 via-indigo-50/20 to-white">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="h-4 w-32 bg-slate-200 rounded-lg animate-pulse mb-8" />
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="aspect-[4/3] rounded-2xl bg-slate-200 animate-pulse" />
            <div className="space-y-4">
              <div className="h-8 bg-slate-200 rounded-lg w-3/4 animate-pulse" />
              <div className="h-4 bg-slate-100 rounded w-full animate-pulse" />
              <div className="h-4 bg-slate-100 rounded w-5/6 animate-pulse" />
              <div className="h-24 bg-slate-100 rounded-xl mt-6 animate-pulse" />
            </div>
          </div>
          <div className="flex justify-center mt-12">
            <Spinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm max-w-md">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Package className="text-slate-400" size={32} />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Product not found</h1>
          <p className="text-sm text-gray-500 mb-6">
            This product may have been removed or the link is invalid.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 text-white font-medium px-5 py-2.5 text-sm hover:bg-indigo-700 transition-colors"
          >
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  const inactive = product.isActive === false;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Breadcrumb + step */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors group"
          >
            <span className="p-1.5 rounded-lg bg-white border border-gray-200 shadow-sm group-hover:border-indigo-200 group-hover:shadow">
              <ArrowLeft size={16} />
            </span>
            Back
          </button>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-200 px-3 py-1 text-gray-500 shadow-sm">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                1
              </span>
              Product
            </span>
            <span className="text-gray-300">→</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 text-white px-3 py-1 shadow-md shadow-indigo-500/25">
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                2
              </span>
              Review & order
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200/80 bg-white shadow-xl shadow-gray-200/50 overflow-hidden">
          <div className="grid lg:grid-cols-5 gap-0">
            {/* Product visual */}
            <div className="lg:col-span-2 relative bg-gradient-to-br from-indigo-50 to-slate-100 p-6 sm:p-8 flex items-center justify-center min-h-[280px] lg:min-h-[420px]">
              <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_30%_20%,#4f46e5_0%,transparent_50%)]" />
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="relative z-10 w-full max-w-sm aspect-square object-cover rounded-2xl shadow-2xl shadow-indigo-900/10 ring-1 ring-black/5"
                />
              ) : (
                <div className="relative z-10 w-full max-w-sm aspect-square rounded-2xl bg-white/80 backdrop-blur flex items-center justify-center shadow-inner ring-1 ring-indigo-100">
                  <Package size={96} strokeWidth={1} className="text-indigo-200" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="lg:col-span-3 p-6 sm:p-8 lg:p-10 flex flex-col">
              <div className="flex flex-wrap items-start gap-2 mb-3">
                <Badge className="text-indigo-700 bg-indigo-50 border-indigo-200 uppercase tracking-wide text-[10px]">
                  Order flow
                </Badge>
                {product.category && (
                  <Badge className="capitalize text-gray-600 bg-gray-50 border-gray-200">
                    {product.category}
                  </Badge>
                )}
                {product.brand && (
                  <Badge className="text-gray-600 bg-white border-gray-200">{product.brand}</Badge>
                )}
                {inactive && (
                  <Badge className="text-red-700 bg-red-50 border-red-200">Unavailable</Badge>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-3">
                {product.name}
              </h1>
              {product.description && (
                <p className="text-sm text-gray-600 leading-relaxed mb-8 line-clamp-4">
                  {product.description}
                </p>
              )}

              <div className="grid sm:grid-cols-2 gap-6 mb-8">
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Unit price
                  </p>
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">
                    {formatCurrency(product.price)}
                  </p>
                  {product.unit && (
                    <p className="text-sm text-slate-500 mt-1">per {product.unit}</p>
                  )}
                </div>
                <div className="rounded-2xl border border-gray-200 p-4 flex flex-col justify-center">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Quantity
                  </p>
                  <div className="inline-flex items-center gap-1 rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
                    <button
                      type="button"
                      disabled={quantity <= 1 || inactive}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-2.5 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={18} className="text-gray-700" />
                    </button>
                    <span className="min-w-[3rem] text-center text-lg font-bold text-gray-900 tabular-nums">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      disabled={inactive}
                      onClick={() => setQuantity((q) => q + 1)}
                      className="p-2.5 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus size={18} className="text-gray-700" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Order summary */}
              <div className="mt-auto rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white p-5 sm:p-6 shadow-lg shadow-indigo-500/25">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={18} className="opacity-90" />
                  <span className="text-sm font-semibold opacity-95">Order summary</span>
                </div>
                <div className="flex items-end justify-between gap-4 border-b border-white/20 pb-4 mb-4">
                  <div>
                    <p className="text-xs opacity-80">Line total</p>
                    <p className="text-3xl font-bold tabular-nums mt-0.5">{formatCurrency(lineTotal)}</p>
                  </div>
                  <div className="text-right text-sm opacity-90">
                    <p>
                      {quantity} × {formatCurrency(product.price)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="flex-1 !bg-white !text-indigo-700 hover:!bg-indigo-50 border-0 shadow-md"
                    size="lg"
                    loading={submitting}
                    disabled={inactive}
                    onClick={handleProceed}
                  >
                    <ShoppingCart size={18} />
                    Proceed to order
                  </Button>
                  <Link
                    to="/products"
                    className="inline-flex flex-1 sm:flex-initial items-center justify-center rounded-lg font-medium px-4 py-3 text-sm text-white/95 border border-white/30 hover:bg-white/10 transition-colors"
                  >
                    More products
                  </Link>
                </div>
              </div>

              {!userId && (
                <div className="mt-4 flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-900">
                  <ShieldCheck className="shrink-0 mt-0.5 text-amber-600" size={18} />
                  <p>
                    Sign in required to place an order. Tap <strong>Proceed to order</strong> to go to
                    login, then you’ll return here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
