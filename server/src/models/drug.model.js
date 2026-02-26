const mongoose = require("mongoose");

const drugSchema = new mongoose.Schema(
  {
    brandName: {
      type: String,
      required: true
    },
    saltName: {
      type: String,
      required: true
    },
    strength: {
      type: String, // e.g. 500mg
      required: true
    },
    form: {
      type: String, // tablet, syrup, injection
      required: true
    },
    aliases: [
      {
        type: String
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Drug", drugSchema);