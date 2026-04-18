import React from "react";
import { formatCurrency } from "../../utils/helpers";
import { Package } from "lucide-react";

const OrderSummary = ({ items = [], total = 0 }) => {
  return (
    <aside className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 w-full lg:w-80 xl:w-96">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Package className="w-5 h-5 text-indigo-600" />
        Order Summary
      </h3>
      <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
        {items.map((it, idx) => (
          <div key={it.productId || idx} className="flex md:items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800 line-clamp-2">
                {it.productName}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">Qty: {it.quantity}</div>
            </div>
            <div className="text-sm font-medium text-gray-900 whitespace-nowrap">
              {formatCurrency((it.price ?? 0) * (it.quantity ?? 0))}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-gray-500 italic">No items found.</p>
        )}
      </div>

      <div className="mt-6 border-t border-gray-100 pt-4 text-sm space-y-3">
        <div className="flex justify-between items-center font-bold text-gray-900 text-lg">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    </aside>
  );
};

export default OrderSummary;
