import { paymentClient } from "../api/axiosConfig";

const createPayment = async ({ orderId, userId, amount, currency = "usd" }) => {
  const resp = await paymentClient.post("/payments/create", {
    orderId,
    userId,
    amount,
    currency,
  });
  return resp.data;
};

const verifyPayment = async ({ orderId, paymentIntentId }) => {
  const resp = await paymentClient.post("/payments/verify", {
    orderId,
    paymentIntentId,
  });
  return resp.data;
};

export default {
  createPayment,
  verifyPayment,
};
