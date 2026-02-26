const Product = require("../models/product.model");
const Drug = require("../models/drug.model");

// ➤ Add Product (Admin Only)
exports.addProduct = async (req, res) => {
  try {
    const { name, drug, price, stock, manufacturer, discount } = req.body;

    // 1️⃣ Validate drug exists
    const existingDrug = await Drug.findById(drug);
    if (!existingDrug) {
      return res.status(400).json({ message: "Drug not found" });
    }

    // 2️⃣ Prevent duplicate product
    const duplicate = await Product.findOne({ name, drug });
    if (duplicate) {
      return res.status(400).json({ message: "Product already exists" });
    }

    // 3️⃣ Create product
    const product = await Product.create({
      name,
      drug,
      price,
      stock,
      manufacturer,
      discount
    });

    res.status(201).json({
      message: "Product created successfully",
      product
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ➤ Get All Products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("drug");   // important: fetch drug details

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ➤ Get Product By ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("drug");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};