const express = require("express");
const multer = require("multer");
const { predictPrescription } = require("../controllers/ml.controller");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/predict", upload.single("file"), predictPrescription);

module.exports = router;
