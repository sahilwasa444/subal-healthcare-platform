const express = require("express");
const router = express.Router();
const drugController = require("../controllers/drug.controller");
const protect = require("../middlewares/auth.middleware");

// Add drug (protected)
router.post("/", protect, drugController.addDrug);

// Get all drugs
router.get("/", drugController.getDrugs);

module.exports = router;