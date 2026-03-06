const express = require("express");
const router = express.Router();

const orderController = require("../controllers/order.controller");
const authMiddleware = require("../middlewares/auth.middleware");


// place order
router.post("/place", authMiddleware, orderController.placeOrder);
router.get("/my", authMiddleware, orderController.getMyOrders);

module.exports = router;