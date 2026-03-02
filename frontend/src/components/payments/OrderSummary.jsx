import React from "react";

const OrderSummary = ({ items = [], shipping = 0, tax = 0 }) => {
  const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const total = subtotal + shipping + tax;

  return (
    <aside className="bg-white rounded-xl shadow-sm p-4 w-full md:w-96">
      <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
      <div className="space-y-3 max-h-64 overflow-auto">
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-3">
            <img
              src={it.image}
              alt={it.name}
              className="w-14 h-14 object-cover rounded-md"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-800">{it.name}</div>
              <div className="text-xs text-gray-500">Qty {it.quantity}</div>
            </div>
            <div className="text-sm font-medium">
              ${((it.price * it.quantity) / 100).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t pt-4 text-sm space-y-2">
        <div className="flex justify-between text-gray-600">
          {" "}
          <span>Subtotal</span> <span>${(subtotal / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          {" "}
          <span>Shipping</span> <span>${(shipping / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          {" "}
          <span>Tax</span> <span>${(tax / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold text-gray-900 text-lg">
          {" "}
          <span>Total</span> <span>${(total / 100).toFixed(2)}</span>
        </div>
      </div>
    </aside>
  );
};

export default OrderSummary;
