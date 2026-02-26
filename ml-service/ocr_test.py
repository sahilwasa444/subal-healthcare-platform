# ocr_test.py
# Better OCR pipeline for messy/doctor handwriting:
# 1) EasyOCR for text-region detection
# 2) TrOCR (handwritten model) for recognition per detected region

import argparse
from pathlib import Path

import cv2
import numpy as np
import torch
from PIL import Image
import easyocr
from transformers import TrOCRProcessor, VisionEncoderDecoderModel


class DoctorHandwritingOCR:
    def __init__(self, device: str = None):
        if device is None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
        self.device = device

        # Detection model (good at finding text areas)
        self.detector = easyocr.Reader(["en"], gpu=(self.device == "cuda"))

        # Recognition model (better for handwriting)
        self.processor = TrOCRProcessor.from_pretrained("microsoft/trocr-base-handwritten")
        self.recognizer = VisionEncoderDecoderModel.from_pretrained("microsoft/trocr-base-handwritten")
        self.recognizer.to(self.device)
        self.recognizer.eval()

    @staticmethod
    def _normalize_crop(crop: np.ndarray) -> np.ndarray:
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)

        # Contrast normalize
        gray = cv2.equalizeHist(gray)

        # Denoise while preserving strokes
        gray = cv2.fastNlMeansDenoising(gray, None, 12, 7, 21)

        # Adaptive threshold to handle uneven lighting/background
        bw = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 11
        )

        # Ensure dark text on light bg for TrOCR
        if np.mean(bw) < 127:
            bw = 255 - bw

        return cv2.cvtColor(bw, cv2.COLOR_GRAY2BGR)

    @staticmethod
    def _sort_boxes(read_results):
        # Sort top-to-bottom, then left-to-right
        def box_key(item):
            box = item[0]
            xs = [p[0] for p in box]
            ys = [p[1] for p in box]
            return (int(min(ys) // 20), int(min(xs)))

        return sorted(read_results, key=box_key)

    @staticmethod
    def _crop_from_box(image: np.ndarray, box, pad=6) -> np.ndarray:
        xs = [int(p[0]) for p in box]
        ys = [int(p[1]) for p in box]
        x1, x2 = max(min(xs) - pad, 0), min(max(xs) + pad, image.shape[1] - 1)
        y1, y2 = max(min(ys) - pad, 0), min(max(ys) + pad, image.shape[0] - 1)
        return image[y1:y2, x1:x2]

    def _recognize_crop(self, crop_bgr: np.ndarray) -> str:
        pre = self._normalize_crop(crop_bgr)
        pil_img = Image.fromarray(cv2.cvtColor(pre, cv2.COLOR_BGR2RGB))

        pixel_values = self.processor(images=pil_img, return_tensors="pt").pixel_values.to(self.device)

        with torch.no_grad():
            generated_ids = self.recognizer.generate(
                pixel_values,
                max_new_tokens=48,
                num_beams=4,
                early_stopping=True,
                no_repeat_ngram_size=2,
            )

        text = self.processor.batch_decode(generated_ids, skip_special_tokens=True)[0].strip()
        return " ".join(text.split())

    def extract(self, image_path: str, min_det_conf: float = 0.20):
        image = cv2.imread(image_path)
        if image is None:
            raise FileNotFoundError(f"Could not read image: {image_path}")

        # EasyOCR detection returns: [ [box, text, conf], ... ]
        det = self.detector.readtext(image, detail=1, paragraph=False, decoder="beamsearch")
        det = [d for d in det if d[2] >= min_det_conf]
        det = self._sort_boxes(det)

        lines = []
        for box, _, _ in det:
            crop = self._crop_from_box(image, box)
            if crop.size == 0:
                continue
            txt = self._recognize_crop(crop)
            if txt:
                lines.append(txt)

        return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Extract doctor handwriting from image")
    parser.add_argument("--image", required=True, help="Path to prescription/handwriting image")
    parser.add_argument("--device", default=None, choices=["cpu", "cuda", None], help="cpu or cuda")
    parser.add_argument("--min-conf", type=float, default=0.20, help="Min detection confidence (EasyOCR)")
    args = parser.parse_args()

    ocr = DoctorHandwritingOCR(device=args.device)
    text = ocr.extract(args.image, min_det_conf=args.min_conf)
    print(text)


if __name__ == "__main__":
    main()
