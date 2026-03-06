import os
import io
import cv2
import numpy as np
import torch
from PIL import Image
from fastapi import FastAPI, UploadFile, File
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
import easyocr
from fastapi.middleware.cors import CORSMiddleware

from matcher import match_multiple

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500","https://subal-healthcare-platform.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

device = "cuda" if torch.cuda.is_available() else "cpu"

# -------------------------
# Load TrOCR Model
# -------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "f","fine_tuned_model")  # Adjust if your model is in a different subfolder

print("Loading TrOCR model...")
processor = TrOCRProcessor.from_pretrained(MODEL_PATH, local_files_only=True)
model = VisionEncoderDecoderModel.from_pretrained(MODEL_PATH, local_files_only=True)
model.to(device)
model.eval()
print("TrOCR loaded.")

# -------------------------
# Load EasyOCR
# -------------------------
print("Loading EasyOCR...")
detector = easyocr.Reader(["en"], gpu=(device == "cuda"))
print("EasyOCR loaded.")


def recognize_crop(crop_bgr):
    gray = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2GRAY)
    pil_img = Image.fromarray(gray).convert("RGB")

    pixel_values = processor(images=pil_img, return_tensors="pt").pixel_values.to(device)

    with torch.no_grad():
        generated_ids = model.generate(pixel_values, max_new_tokens=24)


    text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
    return text.strip()


@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    contents = await file.read()

    np_img = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
    detections = detector.readtext(image)
    detections = sorted(detections, key=lambda x: x[2], reverse=True)[:12]




    extracted_lines = []

    for box, _, conf in detections:
        if conf < 0.2:
            continue

        xs = [int(p[0]) for p in box]
        ys = [int(p[1]) for p in box]

        x1, x2 = min(xs), max(xs)
        y1, y2 = min(ys), max(ys)

        crop = image[y1:y2, x1:x2]

        if crop.size == 0:
            continue

        text = recognize_crop(crop)

        if text:
            extracted_lines.append(text)

    raw_text = "\n".join(extracted_lines)

    words = raw_text.replace("\n", " ").split()

    matched_drugs = match_multiple(words)

    return {
        "raw_text": raw_text,
        "matched_drugs": matched_drugs
    }