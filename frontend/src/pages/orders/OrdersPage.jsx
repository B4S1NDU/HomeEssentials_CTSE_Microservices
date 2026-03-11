import { ShoppingCart, Clock, Zap } from 'lucide-react';

export default function OrdersPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="w-20 h-20 rounded-3xl bg-orange-50 flex items-center justify-center">
        <ShoppingCart size={40} className="text-orange-400" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Orders Service</h2>
        <p className="text-gray-500 max-w-md">
          The Orders microservice is under development. Once it's ready, you'll be able to manage
          customer orders, track order status, and connect with inventory and payment services here.
        </p>
      </div>
      <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-sm px-4 py-2.5 rounded-xl">
        <Clock size={15} />
        <span>Expected on port <strong>3004</strong> — Not yet implemented</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl w-full mt-2">
        {['Create Order', 'Track Status', 'Order History'].map((f) => (
          <div key={f} className="bg-gray-50 border border-gray-200 rounded-xl p-4 opacity-50">
            <Zap size={16} className="text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-500">{f}</p>
            <p className="text-xs text-gray-400">Coming soon</p>
          </div>
        ))}
      </div>
    </div>
  );
}
