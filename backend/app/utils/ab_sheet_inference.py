import os
import io
from typing import Dict, Any, List

import cv2
import numpy as np
from PIL import Image
import torch
import torchvision.transforms as T

from app.ml.ab_classifier_model import load_trained_model

# Folder for saving debug cell images
DEBUG_CELLS_DIR = "debug_cells"
os.makedirs(DEBUG_CELLS_DIR, exist_ok=True)

# ====== FIXED STRUCTURE (match your existing table) ======

SKILL_AREAS = [
    "Gross Motor",
    "Fine Motor",
    "Eating",
    "Dressing",
    "Grooming",
    "Toileting",
    "Receptive Language",
    "Expressive Language",
    "Social Interaction",
    "Reading",
    "Writing",
    "Numbers",
    "Time",
    "Money",
    "Domestic Behaviour",
    "Community Orientation",
    "Recreation",
    "Vocational",
]

HEADERS = [
    "Student Name",
    "Register Number",
    "Skill Area",
    "Session 1", "Session 2", "Session 3", "Session 4", "Session 5",
    "Session 6", "Session 7", "Session 8", "Session 9", "Session 10",
    "Session 11", "Session 12", "Session 13", "Session 14", "Session 15",
    "Session 16", "Session 17", "Session 18", "Session 19", "Session 20",
    "Total A",
    "Total B",
    "I Qr",
    "II Qr",
    "III Qr",
    "IV Qr",
    "Assessment Date",
]

N_ROWS = len(SKILL_AREAS)
N_COLS = 20  # 20 sessions

# Fixed pixel crop for the A/B table region
TABLE_TOP = 390
TABLE_BOTTOM = 875
TABLE_LEFT = 280
TABLE_RIGHT = 985

# ====== MODEL LOADING (singleton) ======

_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
_model = None

# Path relative to backend working directory
_MODEL_WEIGHTS_PATH = "app/models/ab_classifier.pth"


def _get_model():
    global _model
    if _model is None:
        _model = load_trained_model(_MODEL_WEIGHTS_PATH, _device)
    return _model


_cell_transform = T.Compose([
    T.Grayscale(num_output_channels=1),
    T.Resize((28, 28)),
    T.ToTensor(),
    T.Normalize(mean=[0.5], std=[0.5]),
])


# ====== IMAGE HELPERS ======

def _bytes_to_bgr(file_bytes: bytes) -> np.ndarray:
    """Decode image bytes into a BGR OpenCV image."""
    nparr = np.frombuffer(file_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image bytes")
    return img


def _deskew_and_rotate(image_bgr: np.ndarray) -> np.ndarray:
    """
    For now, do not rotate at all.
    Use the uploaded orientation directly.
    """
    return image_bgr


def _compute_fixed_crop_bounds(height: int, width: int) -> tuple[int, int, int, int]:
    """Return clamped fixed crop bounds: (top, bottom, left, right)."""
    top = max(0, min(TABLE_TOP, height - 1))
    bottom = max(top + 1, min(TABLE_BOTTOM, height))
    left = max(0, min(TABLE_LEFT, width - 1))
    right = max(left + 1, min(TABLE_RIGHT, width))
    return top, bottom, left, right


def _crop_table_region(image_bgr: np.ndarray) -> np.ndarray:
    """Crop the fixed region where the assessment table lives."""
    h, w = image_bgr.shape[:2]
    top, bottom, left, right = _compute_fixed_crop_bounds(h, w)

    cropped = image_bgr[top:bottom, left:right]
    if cropped.size == 0:
        raise ValueError("Table crop is empty; adjust fixed TABLE_* pixel constants")
    return cropped

def _split_into_cells(table_bgr: np.ndarray) -> List[List[np.ndarray]]:
    h, w = table_bgr.shape[:2]

    # Trim so height/width are divisible by N_ROWS/N_COLS (keep this part)
    extra_h = h % N_ROWS
    if extra_h != 0:
        trim_top = extra_h // 2
        trim_bottom = extra_h - trim_top
        table_bgr = table_bgr[trim_top:h - trim_bottom, :]
        h = table_bgr.shape[0]

    extra_w = w % N_COLS
    if extra_w != 0:
        trim_left = extra_w // 2
        trim_right = extra_w - trim_left
        table_bgr = table_bgr[:, trim_left:w - trim_right]
        w = table_bgr.shape[1]

    cell_h = h // N_ROWS
    cell_w = w // N_COLS

    # Margin inside each cell to avoid grid lines (15% each side)
    V_MARGIN_FRAC = 0.15
    H_MARGIN_FRAC = 0.15

    cells: List[List[np.ndarray]] = []
    for r in range(N_ROWS):
        row_cells = []
        for c in range(N_COLS):
            y1 = r * cell_h
            y2 = (r + 1) * cell_h
            x1 = c * cell_w
            x2 = (c + 1) * cell_w

            inner_y1 = y1 + int(cell_h * V_MARGIN_FRAC)
            inner_y2 = y2 - int(cell_h * V_MARGIN_FRAC)
            inner_x1 = x1 + int(cell_w * H_MARGIN_FRAC)
            inner_x2 = x2 - int(cell_w * H_MARGIN_FRAC)

            cell = table_bgr[inner_y1:inner_y2, inner_x1:inner_x2]

            debug_path = os.path.join(
                DEBUG_CELLS_DIR,
                f"row{r+1:02d}_col{c+1:02d}.png",
            )
            cv2.imwrite(debug_path, cell)

            row_cells.append(cell)
        cells.append(row_cells)

    return cells


def _preprocess_cell(cell_bgr: np.ndarray) -> torch.Tensor:
    """Convert BGR cell to normalized 1x28x28 tensor on correct device."""
    cell_rgb = cv2.cvtColor(cell_bgr, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(cell_rgb)
    tensor = _cell_transform(pil_img).unsqueeze(0).to(_device)  # [1,1,28,28]
    return tensor


def _predict_cell_label(model, cell_bgr: np.ndarray) -> str:
    """
    Run model on one cell; return 'A' or 'B'.
    Threshold: prob(B) >= 0.5 => 'B', else 'A'.
    """
    with torch.no_grad():
        x = _preprocess_cell(cell_bgr)
        logit = model(x)          # shape [1,1]
        prob_b = torch.sigmoid(logit)[0].item()
    return "B" if prob_b >= 0.4 else "A"


# ====== MAIN ENTRY POINT (replaces Paddle-based extract_table_from_image) ======

def predict_ab_table_from_image(file_bytes: bytes) -> Dict[str, Any]:
    """
    End-to-end pipeline:
    - decode bytes
    - deskew
    - crop fixed table region
    - split into grid
    - classify each cell as A/B
    - build the same structured table format used by the old OCRService.
    """
    try:
        image_bgr = _bytes_to_bgr(file_bytes)
        rotated = _deskew_and_rotate(image_bgr)
        table_bgr = _crop_table_region(rotated)

        # Save debug images to verify fixed crop region on every upload.
        crop_h, crop_w = rotated.shape[:2]
        crop_top, crop_bottom, crop_left, crop_right = _compute_fixed_crop_bounds(crop_h, crop_w)
        debug_crop_path = os.path.join(DEBUG_CROPS_DIR, "latest_table_crop.png")
        cv2.imwrite(debug_crop_path, table_bgr)

        debug_overlay = rotated.copy()
        cv2.rectangle(
            debug_overlay,
            (crop_left, crop_top),
            (crop_right - 1, crop_bottom - 1),
            (0, 255, 0),
            3,
        )
        debug_overlay_path = os.path.join(DEBUG_CROPS_DIR, "latest_full_with_crop_box.png")
        cv2.imwrite(debug_overlay_path, debug_overlay)
        grid_cells = _split_into_cells(table_bgr)
        model = _get_model()

        extracted_data: Dict[str, List[str]] = {}
        table_rows: List[Dict[str, Any]] = []

        total_A = 0
        total_B = 0

        for row_idx, skill in enumerate(SKILL_AREAS):
            session_values: List[str] = []
            for col_idx in range(N_COLS):
                cell_img = grid_cells[row_idx][col_idx]
                label = _predict_cell_label(model, cell_img)
                session_values.append(label)
                if label == "A":
                    total_A += 1
                elif label == "B":
                    total_B += 1

            extracted_data[skill] = session_values

            # Per-row A/B totals
            row_total_a = session_values.count("A")
            row_total_b = session_values.count("B")

            row = {
                "Student Name": "",
                "Register Number": "",
                "Skill Area": skill,
                "Session 1": session_values[0],
                "Session 2": session_values[1],
                "Session 3": session_values[2],
                "Session 4": session_values[3],
                "Session 5": session_values[4],
                "Session 6": session_values[5],
                "Session 7": session_values[6],
                "Session 8": session_values[7],
                "Session 9": session_values[8],
                "Session 10": session_values[9],
                "Session 11": session_values[10],
                "Session 12": session_values[11],
                "Session 13": session_values[12],
                "Session 14": session_values[13],
                "Session 15": session_values[14],
                "Session 16": session_values[15],
                "Session 17": session_values[16],
                "Session 18": session_values[17],
                "Session 19": session_values[18],
                "Session 20": session_values[19],
                "Total A": str(row_total_a),
                "Total B": str(row_total_b),
                "I Qr": "",
                "II Qr": "",
                "III Qr": "",
                "IV Qr": "",
                "Assessment Date": "",
            }
            table_rows.append(row)

        extraction_report = [
            f"{skill}: [{', '.join(vals)}]" for skill, vals in extracted_data.items()
        ]

        table_dict = {
            "headers": HEADERS,
            "rows": table_rows,
            "row_count": len(table_rows),
            "extracted_values": extracted_data,
            "extraction_report": extraction_report,
        }

        extraction_summary = {
            "total_cells": N_ROWS * N_COLS,
            "total_A": total_A,
            "total_B": total_B,
            "skills_found": list(extracted_data.keys()),
        }

        return {
            "success": True,
            "method": "cnn_fixed_grid_ocr",
            "tables": [table_dict],
            "table_count": 1,
            "extracted_data": extracted_data,
            "table_detection": {
                "detected": True,
                "cropped": True,
            },
            "extraction_summary": extraction_summary,
        }

    except Exception as e:
        # Log to console; FastAPI layer will handle error message
        print("CNN-based OCR error:", e)
        return {
            "success": False,
            "error": str(e),
            "tables": [],
            "table_count": 0,
        }


