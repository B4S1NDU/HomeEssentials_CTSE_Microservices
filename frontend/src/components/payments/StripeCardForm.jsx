import React from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#111827",
      fontSize: "16px",
      "::placeholder": { color: "#9ca3af" },
    },
    invalid: { color: "#ef4444" },
  },
};

const StripeCardForm = ({ onChange }) => {
  const stripe = useStripe();
  const elements = useElements();

  return (
    <div className="space-y-4">
      <label className="block text-sm text-gray-700">Card</label>
      <div className="p-3 border rounded-lg bg-white">
        <CardElement options={CARD_ELEMENT_OPTIONS} onChange={onChange} />
      </div>
    </div>
  );
};

export default StripeCardForm;
