const axios = require("axios");
const FormData = require("form-data");

const predictPrescription = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    const formData = new FormData();
    formData.append("file", req.file.buffer, req.file.originalname);

    const response = await axios.post(
      "http://127.0.0.1:8000/predict",
      formData,
      {
        headers: formData.getHeaders(),
        maxBodyLength: Infinity,
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get prediction from ML service",
      error: error.response?.data || error.message,
    });
  }
};

module.exports = { predictPrescription };
