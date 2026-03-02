import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";

export default function PaymentFailed() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const error = state?.error || "Payment failed. Please try again.";

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md">
        <div className="flex items-center justify-center w-24 h-24 mx-auto rounded-full bg-red-50 mb-4">
          <XCircle size={48} className="text-red-600" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Payment Failed</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md"
          >
            Retry Payment
          </button>
          <button
            onClick={() => navigate("/orders")}
            className="px-4 py-2 border rounded-md"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
