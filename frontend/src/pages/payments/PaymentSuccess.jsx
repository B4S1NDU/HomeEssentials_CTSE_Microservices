import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function PaymentSuccess() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const orderId = state?.orderId || "—";

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md">
        <div className="flex items-center justify-center w-24 h-24 mx-auto rounded-full bg-green-50 mb-4">
          <CheckCircle size={48} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Payment Successful</h2>
        <p className="text-gray-600 mb-4">
          Your payment was processed successfully.
        </p>
        <div className="bg-gray-50 p-3 rounded-md mb-4 text-sm">
          <strong>Order ID:</strong> {orderId}
        </div>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => navigate("/products")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md"
          >
            Continue Shopping
          </button>
          <button
            onClick={() => navigate("/orders")}
            className="px-4 py-2 border rounded-md"
          >
            View Orders
          </button>
        </div>
      </div>
    </div>
  );
}
