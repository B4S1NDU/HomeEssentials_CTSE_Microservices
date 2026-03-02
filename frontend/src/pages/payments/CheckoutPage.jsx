import React from "react";
import OrderSummary from "../../components/payments/OrderSummary";
import PaymentForm from "../../components/payments/PaymentForm";

// Dummy cart data – replace with real cart/state integration
const dummyItems = [
  {
    id: "p1",
    name: "Premium Rice",
    image: "/public/images/rice.jpg",
    quantity: 2,
    price: 1200,
  },
  {
    id: "p2",
    name: "Natural Soap",
    image: "/public/images/soap.jpg",
    quantity: 1,
    price: 500,
  },
];

export default function CheckoutPage() {
  const shipping = 200;
  const tax = 100;
  const subtotal = dummyItems.reduce((s, it) => s + it.price * it.quantity, 0);
  const total = subtotal + shipping + tax;

  const orderId = `ORD-${Date.now()}`;
  const userId = "user001";

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Payment</h2>
            <PaymentForm
              orderId={orderId}
              userId={userId}
              amount={total}
              currency="usd"
            />
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <OrderSummary items={dummyItems} shipping={shipping} tax={tax} />
          </div>
        </div>
      </div>
    </div>
  );
}
