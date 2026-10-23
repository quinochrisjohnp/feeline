#!/usr/bin/env python3
"""Run the complete FeELINE inference pipeline on one uploaded image.

The binary validator first rejects non-cat images. The frozen anatomy detector
then counts distinct cats and rejects images containing multiple cats. Emotion
inference runs only when exactly one cat is detected.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

try:
    import numpy as np
    import torch
    from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageStat
    from ultralytics import YOLO
except ImportError as error:
    raise SystemExit(
        "ERROR: Missing dependency. Activate detector_env, then run: "
        "python -m pip install ultralytics pillow numpy"
    ) from error


CLASSES = ("angry", "fearful", "happy", "neutral")
IMAGE_SIZE = 300
VALIDATOR_IMAGE_SIZE = 320
DEFAULT_CAT_ACCEPTANCE_THRESHOLD = 0.56
DEFAULT_CAT_COUNT_CONFIDENCE = 0.35
DEFAULT_DETECTOR_CONFIDENCE = 0.20
REGION_COLORS = {
    "cat_face": (225, 95, 75),
    "cat_full_body": (70, 165, 85),
    "ears_region": (230, 155, 55),
    "eyes_region": (75, 130, 225),
    "mouth_muzzle": (175, 85, 200),
    "tail": (35, 175, 175),
}


def median_color(image: Image.Image, sample_size: int = 32) -> tuple[int, int, int]:
    return tuple(
        int(value)
        for value in ImageStat.Stat(image.resize((sample_size, sample_size))).median[:3]
    )


def clamp_box(
    box: tuple[float, float, float, float], width: int, height: int
) -> tuple[int, int, int, int]:
    x1, y1, x2, y2 = box
    left = max(0, min(width - 1, round(x1)))
    top = max(0, min(height - 1, round(y1)))
    right = max(left + 1, min(width, round(x2)))
    bottom = max(top + 1, min(height, round(y2)))
    return left, top, right, bottom


def add_margin(
    box: tuple[int, int, int, int], width: int, height: int, fraction: float
) -> tuple[int, int, int, int]:
    x1, y1, x2, y2 = box
    margin_x = round((x2 - x1) * fraction)
    margin_y = round((y2 - y1) * fraction)
    return (
        max(0, x1 - margin_x),
        max(0, y1 - margin_y),
        min(width, x2 + margin_x),
        min(height, y2 + margin_y),
    )


def center_inside(
    inner: tuple[int, int, int, int], outer: tuple[int, int, int, int]
) -> bool:
    ix1, iy1, ix2, iy2 = inner
    ox1, oy1, ox2, oy2 = outer
    center_x = (ix1 + ix2) / 2.0
    center_y = (iy1 + iy2) / 2.0
    return ox1 <= center_x <= ox2 and oy1 <= center_y <= oy2


def intersection_over_union(
    first: tuple[int, int, int, int], second: tuple[int, int, int, int]
) -> float:
    ax1, ay1, ax2, ay2 = first
    bx1, by1, bx2, by2 = second
    left, top = max(ax1, bx1), max(ay1, by1)
    right, bottom = min(ax2, bx2), min(ay2, by2)
    intersection = max(0, right - left) * max(0, bottom - top)
    first_area = max(1, ax2 - ax1) * max(1, ay2 - ay1)
    second_area = max(1, bx2 - bx1) * max(1, by2 - by1)
    return intersection / max(1, first_area + second_area - intersection)


def deduplicate_candidates(
    candidates: list[dict[str, Any]], iou_threshold: float = 0.75
) -> list[dict[str, Any]]:
    """Suppress only near-identical same-class boxes; preserve overlapping cats."""
    retained: list[dict[str, Any]] = []
    for candidate in sorted(candidates, key=lambda item: item["confidence"], reverse=True):
        if all(
            intersection_over_union(candidate["box"], prior["box"]) < iou_threshold
            for prior in retained
        ):
            retained.append(candidate)
    return retained


def count_cat_instances(
    detections: list[dict[str, Any]], minimum_confidence: float
) -> tuple[int, list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    """Count bodies plus unmatched faces, matching at most one face to each body."""
    bodies = deduplicate_candidates([
        item for item in detections
        if item["label"] == "cat_full_body" and item["confidence"] >= minimum_confidence
    ])
    faces = deduplicate_candidates([
        item for item in detections
        if item["label"] == "cat_face" and item["confidence"] >= minimum_confidence
    ])

    unmatched_body_indices = set(range(len(bodies)))
    matched_faces: list[dict[str, Any]] = []
    unmatched_faces: list[dict[str, Any]] = []
    for face in sorted(faces, key=lambda item: item["confidence"], reverse=True):
        compatible = [
            index for index in unmatched_body_indices
            if center_inside(face["box"], bodies[index]["box"])
        ]
        if compatible:
            # Prefer the tightest containing body to avoid pairing with a broad false box.
            selected = min(
                compatible,
                key=lambda index: (
                    (bodies[index]["box"][2] - bodies[index]["box"][0])
                    * (bodies[index]["box"][3] - bodies[index]["box"][1])
                ),
            )
            unmatched_body_indices.remove(selected)
            matched_faces.append(face)
        else:
            unmatched_faces.append(face)

    return len(bodies) + len(unmatched_faces), faces, bodies, unmatched_faces


def validator_preprocess(image: Image.Image, device: torch.device) -> torch.Tensor:
    """Whole-image 320px letterbox matching cat-validator training."""
    image = image.convert("RGB")
    width, height = image.size
    scale = min(VALIDATOR_IMAGE_SIZE / width, VALIDATOR_IMAGE_SIZE / height)
    resized_width = max(1, round(width * scale))
    resized_height = max(1, round(height * scale))
    resized = image.resize((resized_width, resized_height), Image.Resampling.BILINEAR)
    canvas = Image.new(
        "RGB", (VALIDATOR_IMAGE_SIZE, VALIDATOR_IMAGE_SIZE), (114, 114, 114)
    )
    canvas.paste(
        resized,
        ((VALIDATOR_IMAGE_SIZE - resized_width) // 2,
         (VALIDATOR_IMAGE_SIZE - resized_height) // 2),
    )
    array = np.asarray(canvas, dtype=np.float32) / 255.0
    return torch.from_numpy(array.transpose(2, 0, 1)).unsqueeze(0).to(device)


def normalize_classifier_output(output: Any) -> torch.Tensor:
    if isinstance(output, dict):
        output = next(iter(output.values()))
    if isinstance(output, (tuple, list)):
        output = output[0]
    if not isinstance(output, torch.Tensor) or output.ndim != 2:
        raise RuntimeError("Unexpected cat-validator model output.")
    sums = output.sum(dim=1)
    if (
        torch.all(output >= 0) and torch.all(output <= 1)
        and torch.allclose(sums, torch.ones_like(sums), atol=1e-3)
    ):
        return output
    return torch.softmax(output, dim=1)


def validate_cat_image(
    validator: YOLO, image: Image.Image, device: torch.device
) -> dict[str, float]:
    names = validator.names
    items = names.items() if isinstance(names, dict) else enumerate(names)
    class_indices = {str(name).lower(): int(index) for index, name in items}
    if set(class_indices) != {"cat", "non_cat"}:
        raise RuntimeError(f"Unexpected cat-validator classes: {names}")
    tensor = validator_preprocess(image, device)
    model = validator.model.to(device).eval()
    with torch.inference_mode():
        probabilities = normalize_classifier_output(model(tensor))[0].float().cpu()
    return {
        "cat": float(probabilities[class_indices["cat"]]),
        "non_cat": float(probabilities[class_indices["non_cat"]]),
    }


def choose_pair(
    detections: list[dict[str, Any]],
) -> tuple[dict[str, Any] | None, dict[str, Any] | None, str]:
    faces = [item for item in detections if item["label"] == "cat_face"]
    bodies = [item for item in detections if item["label"] == "cat_full_body"]
    best_face = max(faces, key=lambda item: item["confidence"]) if faces else None
    best_body = max(bodies, key=lambda item: item["confidence"]) if bodies else None
    if not faces or not bodies:
        return best_face, best_body, "missing_required_detection"
    valid_pairs = [
        (face["confidence"] + body["confidence"], face, body)
        for face in faces
        for body in bodies
        if center_inside(face["box"], body["box"])
    ]
    if valid_pairs:
        _, face, body = max(valid_pairs, key=lambda item: item[0])
        return face, body, "face_center_inside_body"
    return best_face, best_body, "independent_highest_confidence_fallback"


def mask_face_on_body(
    body_crop: Image.Image,
    body_crop_box: tuple[int, int, int, int],
    face_box: tuple[int, int, int, int],
) -> Image.Image:
    bx1, by1, _, _ = body_crop_box
    fx1, fy1, fx2, fy2 = face_box
    pad_x = max(2, round((fx2 - fx1) * 0.05))
    pad_y = max(2, round((fy2 - fy1) * 0.05))
    left = max(0, fx1 - bx1 - pad_x)
    top = max(0, fy1 - by1 - pad_y)
    right = min(body_crop.width, fx2 - bx1 + pad_x)
    bottom = min(body_crop.height, fy2 - by1 + pad_y)
    if right <= left or bottom <= top:
        return body_crop
    masked = body_crop.copy()
    ImageDraw.Draw(masked).rectangle(
        (left, top, right, bottom), fill=median_color(body_crop, sample_size=64)
    )
    return masked


def preprocess(image: Image.Image, device: torch.device) -> torch.Tensor:
    image = image.convert("RGB")
    width, height = image.size
    side = max(width, height)
    left = (side - width) // 2
    top = (side - height) // 2
    image = ImageOps.expand(
        image,
        border=(left, top, side - width - left, side - height - top),
        fill=median_color(image),
    )
    image = image.resize((IMAGE_SIZE, IMAGE_SIZE), Image.Resampling.BICUBIC)
    array = np.asarray(image, dtype=np.float32) / 255.0
    array = (array - np.asarray([0.485, 0.456, 0.406], dtype=np.float32)) / np.asarray(
        [0.229, 0.224, 0.225], dtype=np.float32
    )
    return torch.from_numpy(array.transpose(2, 0, 1)).unsqueeze(0).to(device)


def classify(
    model: torch.jit.ScriptModule,
    face_crop: Image.Image,
    posture_crop: Image.Image | None,
    device: torch.device,
) -> tuple[np.ndarray, int, np.ndarray | None]:
    face_tensor = preprocess(face_crop, device)
    posture_tensor = (
        preprocess(posture_crop, device)
        if posture_crop is not None else torch.zeros_like(face_tensor)
    )
    with torch.inference_mode(), torch.amp.autocast(
        device_type=device.type, enabled=device.type == "cuda"
    ):
        fused_logits, gates, face_logits, _ = model(face_tensor, posture_tensor)
        if posture_crop is None:
            logits = face_logits
            selected_gates = None
        else:
            logits = fused_logits
            selected_gates = gates[0].float().cpu().numpy()
        probabilities = torch.softmax(logits, dim=1)[0].float().cpu().numpy()
    return probabilities, int(np.argmax(probabilities)), selected_gates


def draw_result(
    image: Image.Image,
    detections: list[dict[str, Any]],
    prediction: str | None,
    confidence: float | None,
    route: str,
    status: str,
    cat_count: int,
) -> Image.Image:
    annotated = image.copy()
    draw = ImageDraw.Draw(annotated)
    font = ImageFont.load_default()
    for item in detections:
        label = item["label"]
        color = REGION_COLORS.get(label, (120, 120, 120))
        draw.rectangle(item["box"], outline=color, width=3)
        draw.text(
            (item["box"][0] + 3, item["box"][1] + 3),
            f"{label} {item['confidence']:.2f}", fill=color, font=font,
        )
    if status == "rejected_non_cat":
        caption = "Rejected: no domestic cat accepted | cat count: 0"
    elif status == "rejected_multiple_cats":
        caption = f"Rejected: multiple cats detected | cat count: {cat_count}"
    elif prediction is None:
        caption = f"No reliable emotion prediction | cat count: {cat_count}"
    else:
        caption = (
            f"Emotion: {prediction} | confidence: {confidence:.3f} | "
            f"cat count: {cat_count} | route: {route}"
        )
    draw.rectangle((0, 0, min(annotated.width, 900), 28), fill=(255, 255, 255))
    draw.text((6, 8), caption, fill=(0, 0, 0), font=font)
    return annotated


def serialize_detection(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "label": item["label"],
        "confidence": round(float(item["confidence"]), 6),
        "box_xyxy": [int(value) for value in item["box"]],
    }


class CatEmotionPipeline:
    """One model set per API worker. Callers serialize inference on this instance."""
    def __init__(self, project_root: Path | None = None, *, cpu: bool = False,
                 min_emotion_confidence: float = 0.0):
        root = (project_root or Path(__file__).resolve().parent).resolve()
        self.device = torch.device("cuda" if torch.cuda.is_available() and not cpu else "cpu")
        self.detector_device = 0 if self.device.type == "cuda" else "cpu"
        self.detector_conf = DEFAULT_DETECTOR_CONFIDENCE
        self.cat_count_conf = DEFAULT_CAT_COUNT_CONFIDENCE
        if not 0 <= min_emotion_confidence <= 1:
            raise ValueError("Invalid emotion threshold")
        self.min_emotion_confidence = min_emotion_confidence
        threshold_path = root / "classification_runs/cat_validator_yolo26s/untouched_test_evaluation/selected_threshold.json"
        self.cat_threshold = float(json.loads(threshold_path.read_text(encoding="utf-8"))["threshold"])
        if self.cat_threshold != DEFAULT_CAT_ACCEPTANCE_THRESHOLD:
            raise ValueError("Expected tested domestic-cat threshold 0.56")
        for relative in ("classification_runs/cat_validator_yolo26s/weights/best.pt",
                         "training_runs_v3/final_anatomy_detector_v3/weights/best.pt",
                         "classification_runs_v3/final_gated_fusion_v3/final_gated_fusion_v3_torchscript.pt"):
            if not (root / relative).is_file():
                raise FileNotFoundError("Required local model is missing")
        self.validator = YOLO(str(root / "classification_runs/cat_validator_yolo26s/weights/best.pt"))
        self.detector = YOLO(str(root / "training_runs_v3/final_anatomy_detector_v3/weights/best.pt"))
        self.classifier = torch.jit.load(str(root / "classification_runs_v3/final_gated_fusion_v3/final_gated_fusion_v3_torchscript.pt"), map_location=self.device).eval()

    def predict(self, image_path: Path, *, debug_output: Path | None = None) -> dict[str, Any]:
        with Image.open(image_path) as source:
            image = ImageOps.exif_transpose(source).convert("RGB")
        width, height = image.size
        validator_probabilities = validate_cat_image(self.validator, image, self.device)
        accepted_as_cat = validator_probabilities["cat"] >= self.cat_threshold

        detections: list[dict[str, Any]] = []
        cat_count = 0
        count_faces: list[dict[str, Any]] = []
        count_bodies: list[dict[str, Any]] = []
        unmatched_faces: list[dict[str, Any]] = []
        pairing_status = "not_run"
        face: dict[str, Any] | None = None
        body: dict[str, Any] | None = None
        face_crop: Image.Image | None = None
        posture_crop: Image.Image | None = None

        route = "cat_validation"
        status = "rejected_non_cat" if not accepted_as_cat else "cannot_predict"
        predicted_emotion: str | None = None
        confidence_value: float | None = None
        probabilities: np.ndarray | None = None
        gates: np.ndarray | None = None
        warnings: list[str] = []

        if not accepted_as_cat:
            warnings.append("The image did not meet the domestic-cat acceptance threshold.")
        else:
            result = self.detector.predict(
                source=str(image_path), imgsz=640, conf=self.detector_conf,
                iou=0.7, device=self.detector_device, verbose=False,
            )[0]
            names = result.names
            if result.boxes is not None:
                for class_id, confidence, xyxy in zip(
                    result.boxes.cls.cpu().tolist(),
                    result.boxes.conf.cpu().tolist(),
                    result.boxes.xyxy.cpu().tolist(),
                ):
                    integer_class = int(class_id)
                    label = str(
                        names[integer_class] if isinstance(names, dict) else names[integer_class]
                    )
                    detections.append({
                        "label": label,
                        "confidence": float(confidence),
                        "box": clamp_box(tuple(xyxy), width, height),
                    })

            cat_count, count_faces, count_bodies, unmatched_faces = count_cat_instances(
                detections, self.cat_count_conf
            )
            if cat_count >= 2:
                status = "rejected_multiple_cats"
                route = "multiple_cat_rejection"
                warnings.append(
                    f"{cat_count} distinct cats were detected; FeELINE accepts one cat per image."
                )
            elif cat_count == 0:
                route = "detection_failure"
                warnings.append(
                    "The validator accepted a cat, but the anatomy detector could not confirm a "
                    "usable face or body. Try a clearer image."
                )
            else:
                selection_detections = [
                    item for item in detections
                    if item["label"] not in {"cat_face", "cat_full_body"}
                ] + count_faces + count_bodies
                face, body, pairing_status = choose_pair(selection_detections)
                if face is not None:
                    face_box = add_margin(face["box"], width, height, 0.08)
                    face_crop = image.crop(face_box)
                if body is not None and face is not None:
                    body_box = add_margin(body["box"], width, height, 0.03)
                    posture_crop = mask_face_on_body(
                        image.crop(body_box), body_box, face["box"]
                    )

                if pairing_status == "independent_highest_confidence_fallback":
                    warnings.append(
                        "The selected face center was not inside the selected body box; inspect "
                        "the annotated image."
                    )

                if face_crop is not None and posture_crop is not None:
                    route = "gated_fusion"
                    probabilities, predicted_index, gates = classify(
                        self.classifier, face_crop, posture_crop, self.device
                    )
                    predicted_emotion = CLASSES[predicted_index]
                    confidence_value = float(probabilities[predicted_index])
                    status = "success"
                elif face_crop is not None:
                    route = "face_only_fallback"
                    probabilities, predicted_index, _ = classify(
                        self.classifier, face_crop, None, self.device
                    )
                    predicted_emotion = CLASSES[predicted_index]
                    confidence_value = float(probabilities[predicted_index])
                    status = "success"
                    warnings.append(
                        "Full-body detection was unavailable; the frozen face branch was used."
                    )
                elif body is not None:
                    route = "detection_failure"
                    warnings.append(
                        "A body was detected without a usable face. No emotion prediction was made."
                    )
                else:
                    route = "detection_failure"
                    warnings.append("No usable cat face was detected. Try a clearer image.")

        if (
            status == "success" and confidence_value is not None
            and confidence_value < self.min_emotion_confidence
        ):
            status = "low_confidence"
            warnings.append(
                f"Emotion confidence is below the configured threshold "
                f"({self.min_emotion_confidence:.2f})."
            )


        reason, message = None, None
        if status == "rejected_non_cat":
            reason, message = "non_cat", "No real domestic cat was detected."
        elif status == "rejected_multiple_cats":
            reason = "multiple_cats_detected"
            message = f"{cat_count} cats were detected. FeELINE can analyze only one cat at a time."
        elif status == "cannot_predict":
            reason, message = "unclear_cat", "A usable cat face could not be analyzed."
        payload = {
            "status": status,
            "validation": {"accepted_as_domestic_cat": accepted_as_cat,
                "cat_probability": round(float(validator_probabilities["cat"]), 6),
                "threshold": self.cat_threshold},
            "cat_count": cat_count,
            "rejection": {"reason": reason, "message": message},
            "prediction": {"emotion": predicted_emotion,
                "confidence": round(confidence_value, 6) if confidence_value is not None else None,
                "probabilities": {emotion: round(float(probabilities[index]), 6) if probabilities is not None else None
                    for index, emotion in enumerate(CLASSES)}, "route": route},
        }
        if debug_output is not None:
            debug_output.mkdir(parents=True, exist_ok=False)
            if face_crop is not None:
                face_crop.save(debug_output / "face_crop.jpg")
            if posture_crop is not None:
                posture_crop.save(debug_output / "posture_crop_face_masked.jpg")
            draw_result(image, detections, predicted_emotion, confidence_value, route, status, cat_count).save(debug_output / "annotated_result.jpg")
            (debug_output / "prediction.json").write_text(json.dumps(payload, allow_nan=False), encoding="utf-8")
        return payload


def main() -> int:
    parser = argparse.ArgumentParser(description="FeELINE single-cat inference")
    parser.add_argument("image", type=Path)
    parser.add_argument("--project-root", type=Path, default=Path(__file__).resolve().parent)
    parser.add_argument("--cpu", action="store_true")
    parser.add_argument("--min-emotion-confidence", type=float, default=0.0)
    parser.add_argument("--debug-output", type=Path, default=None)
    args = parser.parse_args()
    pipeline = CatEmotionPipeline(args.project_root, cpu=args.cpu, min_emotion_confidence=args.min_emotion_confidence)
    print(json.dumps(pipeline.predict(args.image, debug_output=args.debug_output), allow_nan=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
