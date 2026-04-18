import React from "react";
import { useLocation, Navigate } from "react-router-dom";
import OrderSummary from "../../components/payments/OrderSummary";
import PaymentForm from "../../components/payments/PaymentForm";
import { useAuth } from "../../context/AuthContext";

export default function CheckoutPage() {
  const location = useLocation();
  const { user } = useAuth();
  
  if (!location.state || !location.state.orderId) {
    return <Navigate to="/orders" replace />;
  }

  const { orderId, amount, items } = location.state;
  const userId = user?.id ?? user?._id ?? location.state.userId;

  return (
    <div className="max-w-6xl mx-auto p-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Payment Details</h2>
            <p className="text-sm text-gray-500 mb-6">Complete your payment for order <span className="font-mono text-gray-700">{orderId}</span>.</p>
            <PaymentForm
              orderId={orderId}
              userId={userId}
              amount={amount * 100}
              currency="lkr"
            />
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <OrderSummary items={items || []} total={amount} />
          </div>
        </div>
      </div>
    </div>
  );
}
