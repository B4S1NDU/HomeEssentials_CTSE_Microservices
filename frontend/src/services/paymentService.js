import { paymentClient } from "../api/axiosConfig";

const createPayment = async ({ orderId, userId, amount, currency = "lkr" }) => {
  const resp = await paymentClient.post("/api/payments/create", {
    orderId,
    userId,
    amount,
    currency,
  });
  return resp.data;
};

const verifyPayment = async ({ orderId, paymentIntentId }) => {
  const resp = await paymentClient.post("/api/payments/verify", {
    orderId,
    paymentIntentId,
  });
  return resp.data;
};

export default {
  createPayment,
  verifyPayment,
};
