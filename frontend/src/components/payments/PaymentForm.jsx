import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements } from "@stripe/react-stripe-js";
import StripeCardForm from "./StripeCardForm";
import paymentService from "../../services/paymentService";
import { useNavigate } from "react-router-dom";

const PaymentFormInner = ({
  clientSecret,
  orderId,
  userId,
  amount,
  currency,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!stripe || !elements) return;
    setLoading(true);

    const card = elements.getElement("card");
    const billing = {
      name: e.target.cardholderName?.value || "Customer",
      address: {
        line1: e.target.address?.value || "",
        city: e.target.city?.value || "",
        postal_code: e.target.postalCode?.value || "",
        country: e.target.country?.value || "",
      },
    };

    try {
      const res = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: card,
          billing_details: billing,
        },
      });

      if (res.error) {
        setError(res.error.message);
        setLoading(false);
        return;
      }

      if (res.paymentIntent && res.paymentIntent.status === "succeeded") {
        // Verify with backend
        await paymentService.verifyPayment({
          orderId,
          paymentIntentId: res.paymentIntent.id,
        });
        navigate("/payment-success", {
          state: { orderId, paymentIntentId: res.paymentIntent.id },
        });
      } else {
        navigate("/payment-failed", {
          state: { error: "Payment not completed" },
        });
      }
    } catch (err) {
      setError(err.message || "Payment failed");
      navigate("/payment-failed", { state: { error: err.message } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="bg-white rounded-xl p-6 shadow-sm" onSubmit={handleSubmit}>
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-700">
            Cardholder name
          </label>
          <input
            name="cardholderName"
            required
            className="mt-1 w-full border rounded-md p-2"
          />
        </div>

        <StripeCardForm />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            name="address"
            placeholder="Address"
            className="mt-1 w-full border rounded-md p-2"
          />
          <input
            name="city"
            placeholder="City"
            className="mt-1 w-full border rounded-md p-2"
          />
          <input
            name="postalCode"
            placeholder="Postal Code"
            className="mt-1 w-full border rounded-md p-2"
          />
          <input
            name="country"
            placeholder="Country"
            className="mt-1 w-full border rounded-md p-2"
          />
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex items-center gap-3 mt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Processing..." : `Pay $${(amount / 100).toFixed(2)}`}
          </button>
          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="text-sm text-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
};

const PaymentForm = ({ orderId, userId, amount, currency = "usd" }) => {
  const [clientSecret, setClientSecret] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;
    const create = async () => {
      try {
        const resp = await paymentService.createPayment({
          orderId,
          userId,
          amount,
          currency,
        });
        if (mounted) setClientSecret(resp.clientSecret);
      } catch (err) {
        console.error("Create payment error", err);
      }
    };
    create();
    return () => (mounted = false);
  }, [orderId, userId, amount, currency]);

  if (!clientSecret) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm">
        Initializing payment...
      </div>
    );
  }

  const stripePromise = loadStripe(
    import.meta.env.VITE_STRIPE_PUBLIC_KEY || window.STRIPE_PUBLIC_KEY || "",
  );

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentFormInner
        clientSecret={clientSecret}
        orderId={orderId}
        userId={userId}
        amount={amount}
        currency={currency}
      />
    </Elements>
  );
};

export default PaymentForm;
