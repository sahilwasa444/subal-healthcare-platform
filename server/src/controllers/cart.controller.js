const Cart = require("../models/cart");
const Drug = require("../models/drug.model");

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    // --- Input Validation ---
    if (!productId || !quantity) {
      return res.status(400).json({ message: "productId and quantity are required" });
    }

    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({ message: "Quantity must be a positive integer" });
    }

    // --- Product Check ---
    const product = await Drug.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.isActive === false) {
      return res.status(400).json({ message: "Product is no longer available" });
    }

    // --- Cart Upsert (atomic, avoids race conditions) ---
    let cart = await Cart.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId, items: [] } },
      { upsert: true, new: true }
    );

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    const newTotalQuantity = existingItem
      ? existingItem.quantity + parsedQuantity
      : parsedQuantity;

    // --- Stock Check Against TOTAL quantity in cart, not just the delta ---
    if (typeof product.stock === "number" && product.stock < newTotalQuantity) {
      return res.status(400).json({
        message: `Only ${product.stock} unit(s) available. You already have ${
          existingItem?.quantity ?? 0
        } in your cart.`,
      });
    }

    // --- Update or Push Item ---
    if (existingItem) {
      existingItem.quantity = newTotalQuantity;
    } else {
      cart.items.push({
        productId,
        quantity: parsedQuantity,
        price: Number(product.price) || 0, // snapshot price at time of adding
      });
    }

    cart.updatedAt = new Date();
    await cart.save();

    // --- Populate for clean response ---
    await cart.populate("items.productId", "name brand brandName salt saltName price imageUrl");

    res.status(200).json({ message: "Added to cart successfully", cart });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid productId format" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id }).populate("items.productId");
    if (!cart) return res.json({ items: [] });

    const items = cart.items.map((item) => ({
      product: item.productId,
      quantity: item.quantity
    }));

    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!productId) {
  return res.status(400).json({ message: "productId required" });
  }
  const itemExists = cart.items.some(
  item => item.productId.toString() === productId
);

if (!itemExists) {
  return res.status(404).json({ message: "Item not found in cart" });
}
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
    await cart.save();

    res.json({ message: "Item removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.calculateCartTotal = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    if (!cart.items || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Filter out orphaned references and invalid quantities
    const validItems = cart.items.filter(
      (item) => item.productId && item.productId.price != null && item.quantity > 0
    );

    if (validItems.length !== cart.items.length) {
      console.warn(
        `Cart ${cart._id}: ${cart.items.length - validItems.length} invalid item(s) skipped`
      );
    }

    // Calculate subtotal
    const subtotal = validItems.reduce((sum, item) => {
      return sum + item.productId.price * item.quantity;
    }, 0);

    // Extensible discount tier logic
    const discount = calculateDiscount(subtotal);
    const finalAmount = subtotal - discount;

    return res.status(200).json({
      itemCount: validItems.length,
      subtotal: parseFloat(subtotal.toFixed(2)),
      discount: parseFloat(discount.toFixed(2)),
      finalAmount: parseFloat(finalAmount.toFixed(2)),
    });
  } catch (err) {
    console.error("calculateCartTotal error:", err);
    return res.status(500).json({ error: "Failed to calculate cart total" });
  }
};

// Separated discount logic — easy to unit test and extend
function calculateDiscount(subtotal) {
  const DISCOUNT_TIERS = [
    { threshold: 2000, rate: 0.15 },
    { threshold: 1000, rate: 0.10 },
  ];

  const tier = DISCOUNT_TIERS.find(({ threshold }) => subtotal > threshold);
  return tier ? subtotal * tier.rate : 0;
}
