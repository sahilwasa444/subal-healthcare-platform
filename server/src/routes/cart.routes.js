const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/add", authMiddleware, cartController.addToCart);
router.get("/", authMiddleware, cartController.getCart);
router.delete("/remove/:productId", authMiddleware, cartController.removeFromCart);
router.get("/total", authMiddleware, cartController.calculateCartTotal);

module.exports = router;
