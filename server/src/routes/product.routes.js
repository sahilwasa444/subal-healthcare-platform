const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const protect = require("../middlewares/auth.middleware");

// Add product (protected)
router.post("/", protect, productController.addProduct);

// Get all products
router.get("/", productController.getProducts);

// Get single product
router.get("/:id", productController.getProductById);

module.exports = router;