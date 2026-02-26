const express = require("express");
const cors = require("cors");
const protect = require("./middlewares/auth.middleware");
const productRoutes = require("./routes/product.routes");

const authRoutes = require("./routes/auth.routes");
const drugRoutes = require("./routes/drug.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Healthcare API Running 🚀");
});
app.get("/api/protected", protect, (req, res) => {
  res.json({
    message: "You accessed protected route",
    user: req.user
  });
});

app.use("/api/drugs", drugRoutes);
app.use("/api/products", productRoutes);
module.exports = app;