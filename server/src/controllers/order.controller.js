
const Order = require("../models/orderschema");
const Cart = require("../models/cart");
const Drug = require("../models/drug.model");


exports.placeOrder = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1️⃣ Find Cart
    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let total = 0;

    // 2️⃣ Check stock
    for (let item of cart.items) {
      if (
        typeof item.productId.stock === "number" &&
        item.productId.stock < item.quantity
      ) {
        return res.status(400).json({
          message: `Not enough stock for ${item.productId.brand || item.productId.brandName || "this item"}`,
        });
      }

      total += (Number(item.productId.price) || 0) * item.quantity;
    }

    // 3️⃣ Apply Discount
    let discount = 0;

    if (total > 2000) {
      discount = total * 0.15;
    } else if (total > 1000) {
      discount = total * 0.1;
    }

    const finalAmount = total - discount;

    // 4️⃣ Create Order
    const order = new Order({
      user: userId,
      items: cart.items.map((item) => ({
        productId: item.productId._id,
        quantity: item.quantity,
        priceAtPurchase: Number(item.productId.price) || 0,
      })),
      total,
      discount,
      finalAmount,
      paymentStatus: "pending",
      orderStatus: "placed",
    });

    await order.save();

    // 5️⃣ Deduct Stock
    for (let item of cart.items) {
      if (typeof item.productId.stock === "number") {
        await Drug.findByIdAndUpdate(item.productId._id, {
          $inc: { stock: -item.quantity },
        });
      }
    }

    // 6️⃣ Clear Cart
    await Cart.findOneAndDelete({ userId });

    res.json({
      message: "Order placed successfully",
      order,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate("items.productId", "brand name brandName salt saltName");
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
