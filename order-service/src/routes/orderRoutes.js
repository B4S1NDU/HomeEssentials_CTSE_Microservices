const express = require('express');
const {
  createOrder,
  getOrderById,
  getOrdersByUser,
  updateOrderStatus,
  updateDeliveryWindow,
  getAllOrders,
  deleteOrder
} = require('../controllers/orderController');

const router = express.Router();

router.get('/', getAllOrders);
router.post('/', createOrder);
router.get('/user/:userId', getOrdersByUser);
router.put('/:id/delivery', updateDeliveryWindow);
router.get('/:id', getOrderById);
router.put('/:id/status', updateOrderStatus);
router.delete('/:id', deleteOrder);

module.exports = router;

