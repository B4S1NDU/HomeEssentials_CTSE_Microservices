const stripeService = require("../services/stripeService");
const Payment = require("../models/Payment");
const { sendPaymentNotification } = require("../services/notificationService");

const STRIPE_MIN_AMOUNT = Number.parseInt(process.env.STRIPE_MIN_AMOUNT || "50", 10);

// Create a Payment Intent and return Client secret
const createPayment = async (req, res, next) => {
  try {
    const { orderId, userId, amount, currency, email } = req.body;
    if (!orderId || !userId || !amount) {
      return res
        .status(400)
        .json({ error: "orderId, userId and amount are required" });
    }

    // Ensure amount is integer in smallest currency unit (e.g., cents)
    const amountInt = Math.round(Number(amount));
    if (!Number.isFinite(amountInt) || amountInt <= 0) {
      return res.status(400).json({
        error: "Amount must be a positive number in the smallest currency unit"
      });
    }

    if (amountInt < STRIPE_MIN_AMOUNT) {
      return res.status(400).json({
        error: `Amount too low. Minimum allowed is ${STRIPE_MIN_AMOUNT} in the smallest currency unit.`
      });
    }

    const metadata = { orderId, userId, email: email || "" };
    const pi = await stripeService.createPaymentIntent({
      amount: amountInt,
      currency,
      metadata,
    });

    // Save a pending payment record (optional: keep minimal until confirm)
    const payment = new Payment({
      paymentId: pi.id,
      orderId,
      userId,
      email,
      amount: amountInt,
      currency: currency || "usd",
      stripePaymentIntentId: pi.id,
      paymentStatus: "pending",
    });
    await payment.save();

    return res.json({ clientSecret: pi.client_secret, paymentIntentId: pi.id });
  } catch (err) {
    if (err?.type && String(err.type).includes("Stripe")) {
      return res.status(400).json({
        error: err.message || "Stripe payment validation failed"
      });
    }
    next(err);
  }
};

// Verify Payment status on Stripe and update MongoDB
const verifyPayment = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;
    if (!paymentIntentId)
      return res.status(400).json({ error: "paymentIntentId is required" });

    const pi = await stripeService.retrievePaymentIntent(paymentIntentId);

    const status = pi.status; // e.g., 'succeeded'

    const existing = await Payment.findOne({
      stripePaymentIntentId: paymentIntentId,
    });
    if (status === "succeeded") {
      let notificationPayload;
      if (existing) {
        existing.paymentStatus = "success";
        await existing.save();
        notificationPayload = {
          userId: existing.userId,
          email: existing.email,
          orderId: existing.orderId,
          amount: existing.amount,
        };
      } else {
        const payment = new Payment({
          paymentId: pi.id,
          orderId: pi.metadata?.orderId || "",
          userId: pi.metadata?.userId || "",
          email: pi.metadata?.email || "",
          amount: pi.amount,
          currency: pi.currency,
          stripePaymentIntentId: pi.id,
          paymentStatus: "success",
        });
        await payment.save();
        notificationPayload = {
          userId: payment.userId,
          email: payment.email,
          orderId: payment.orderId,
          amount: payment.amount,
        };
      }

      sendPaymentNotification({
        ...notificationPayload,
        type: "PAYMENT_SUCCESS",
      });

      // Return the json directly rather than using res.redirect which breaks API calls via Axios
      return res.status(200).json({
        success: true,
        status: "succeeded",
        payment: existing || payment,
      });
    } else {
      if (existing) {
        existing.paymentStatus = "failed";
        await existing.save();

        sendPaymentNotification({
          userId: existing.userId,
          email: existing.email,
          orderId: existing.orderId,
          amount: existing.amount,
          reason: status,
          type: "PAYMENT_FAILED",
        });
      }
      return res.status(400).json({ success: false, status: status });
    }
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPayment,
  verifyPayment,
};
