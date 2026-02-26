const Drug = require("../models/drug.model");

// Add Drug
exports.addDrug = async (req, res) => {
  try {
    const { brandName, saltName, strength, form, aliases } = req.body;

    const drug = await Drug.create({
      brandName,
      saltName,
      strength,
      form,
      aliases
    });

    res.status(201).json({
      message: "Drug added successfully",
      drug
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Drugs
exports.getDrugs = async (req, res) => {
  try {
    const drugs = await Drug.find();
    res.json(drugs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};