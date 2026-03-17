const express = require('express');
const {
  createOrder,
  getOrderById,
  getOrdersByUser,
  updateOrderStatus,
  getAllOrders,
  deleteOrder
} = require('../controllers/orderController');

const router = express.Router();

router.get('/', getAllOrders);
router.post('/', createOrder);
router.get('/:id', getOrderById);
router.get('/user/:userId', getOrdersByUser);
router.put('/:id/status', updateOrderStatus);
router.delete('/:id', deleteOrder);

module.exports = router;

