#!/usr/bin/env python3
"""Run FeELINE V3 emotion inference on one new cat image.

The predictor uses the frozen V3 YOLO anatomy detector followed by the frozen
gated face-posture classifier. It uses gated fusion when both face and full-body
regions are detected, falls back to the frozen face branch when only the face
is available, and refuses to guess when no reliable route is available.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime
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
    if prediction is None:
        caption = "No reliable emotion prediction"
    else:
        caption = f"Emotion: {prediction} | confidence: {confidence:.3f} | route: {route}"
    draw.rectangle((0, 0, min(annotated.width, 900), 28), fill=(255, 255, 255))
    draw.text((6, 8), caption, fill=(0, 0, 0), font=font)
    return annotated


def serialize_detection(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "label": item["label"],
        "confidence": round(float(item["confidence"]), 6),
        "box_xyxy": [int(value) for value in item["box"]],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Predict one cat emotion with FeELINE V3")
    default_root = Path(r"C:\Users\admin\Documents\FeELINE_AI")
    parser.add_argument("image", type=Path, help="Path to one local cat image")
    parser.add_argument("--project-root", type=Path, default=default_root)
    parser.add_argument("--output-root", type=Path, default=None)
    parser.add_argument("--detector-conf", type=float, default=DEFAULT_DETECTOR_CONFIDENCE)
    parser.add_argument(
        "--min-emotion-confidence", type=float, default=0.0,
        help="Optional minimum classifier confidence; below it, status becomes low_confidence",
    )
    parser.add_argument(
        "--cpu", action="store_true",
        help="Allow CPU inference. GPU is used automatically when available.",
    )
    args = parser.parse_args()

    image_path = args.image.expanduser().resolve()
    if not image_path.is_file():
        raise SystemExit(f"ERROR: Image not found: {image_path}")
    if not 0.0 <= args.detector_conf <= 1.0:
        raise SystemExit("ERROR: --detector-conf must be between 0 and 1")
    if not 0.0 <= args.min_emotion_confidence <= 1.0:
        raise SystemExit("ERROR: --min-emotion-confidence must be between 0 and 1")

    root = args.project_root.expanduser().resolve()
    detector_path = (
        root / "training_runs_v3" / "final_anatomy_detector_v3" / "weights" / "best.pt"
    )
    classifier_path = (
        root / "classification_runs_v3" / "final_gated_fusion_v3"
        / "final_gated_fusion_v3_torchscript.pt"
    )
    for required in (detector_path, classifier_path):
        if not required.is_file():
            raise SystemExit(f"ERROR: Missing required model: {required}")

    if args.cpu:
        device = torch.device("cpu")
        detector_device: str | int = "cpu"
    else:
        if not torch.cuda.is_available():
            raise SystemExit(
                "ERROR: CUDA GPU was not detected. Use --cpu only if slower CPU inference is acceptable."
            )
        device = torch.device("cuda")
        detector_device = 0

    detector = YOLO(str(detector_path))
    classifier = torch.jit.load(str(classifier_path), map_location=device).eval()
    try:
        with Image.open(image_path) as source:
            image = ImageOps.exif_transpose(source).convert("RGB")
    except Exception as error:
        raise SystemExit(f"ERROR: Could not open image: {image_path}\n{error}") from error
    width, height = image.size

    result = detector.predict(
        source=str(image_path), imgsz=640, conf=args.detector_conf,
        iou=0.7, device=detector_device, verbose=False,
    )[0]
    names = result.names
    detections: list[dict[str, Any]] = []
    if result.boxes is not None:
        for class_id, confidence, xyxy in zip(
            result.boxes.cls.cpu().tolist(),
            result.boxes.conf.cpu().tolist(),
            result.boxes.xyxy.cpu().tolist(),
        ):
            integer_class = int(class_id)
            label = str(names[integer_class] if isinstance(names, dict) else names[integer_class])
            detections.append({
                "label": label,
                "confidence": float(confidence),
                "box": clamp_box(tuple(xyxy), width, height),
            })

    face, body, pairing_status = choose_pair(detections)
    face_crop: Image.Image | None = None
    posture_crop: Image.Image | None = None
    if face is not None:
        face_box = add_margin(face["box"], width, height, 0.08)
        face_crop = image.crop(face_box)
    if body is not None and face is not None:
        body_box = add_margin(body["box"], width, height, 0.03)
        posture_crop = mask_face_on_body(image.crop(body_box), body_box, face["box"])

    route = "detection_failure"
    status = "cannot_predict"
    predicted_emotion: str | None = None
    confidence_value: float | None = None
    probabilities: np.ndarray | None = None
    gates: np.ndarray | None = None
    warnings: list[str] = []

    face_count = sum(item["label"] == "cat_face" for item in detections)
    body_count = sum(item["label"] == "cat_full_body" for item in detections)
    if face_count > 1 or body_count > 1:
        warnings.append(
            "Multiple cat face/body candidates were detected; the strongest compatible pair was used."
        )
    if pairing_status == "independent_highest_confidence_fallback":
        warnings.append(
            "The selected face center was not inside the selected body box; inspect the annotated image."
        )

    if face_crop is not None and posture_crop is not None:
        route = "gated_fusion"
        probabilities, predicted_index, gates = classify(
            classifier, face_crop, posture_crop, device
        )
        predicted_emotion = CLASSES[predicted_index]
        confidence_value = float(probabilities[predicted_index])
        status = "success"
    elif face_crop is not None:
        route = "face_only_fallback"
        probabilities, predicted_index, _ = classify(classifier, face_crop, None, device)
        predicted_emotion = CLASSES[predicted_index]
        confidence_value = float(probabilities[predicted_index])
        status = "success"
        warnings.append("Full-body detection was unavailable; the frozen face branch was used.")
    elif body is not None:
        warnings.append(
            "A body was detected without a usable face. No prediction was made because the posture "
            "branch was trained on face-masked body crops."
        )
    else:
        warnings.append("No usable cat face was detected. Try a clearer, well-lit cat image.")

    if (
        status == "success" and confidence_value is not None
        and confidence_value < args.min_emotion_confidence
    ):
        status = "low_confidence"
        warnings.append(
            f"Emotion confidence is below the configured threshold "
            f"({args.min_emotion_confidence:.2f})."
        )

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    safe_stem = "".join(character if character.isalnum() or character in "-_" else "_" for character in image_path.stem)
    output_root = (
        args.output_root.expanduser().resolve()
        if args.output_root is not None else root / "prediction_runs_v3"
    )
    run_output = output_root / f"{timestamp}_{safe_stem}"
    run_output.mkdir(parents=True, exist_ok=False)
    if face_crop is not None:
        face_crop.save(run_output / "face_crop.jpg", quality=95, subsampling=0)
    if posture_crop is not None:
        posture_crop.save(run_output / "posture_crop_face_masked.jpg", quality=95, subsampling=0)
    annotated = draw_result(
        image, detections, predicted_emotion, confidence_value, route
    )
    annotated.save(run_output / "annotated_result.jpg", quality=92)

    probability_map = {
        emotion: round(float(probabilities[index]), 6) if probabilities is not None else None
        for index, emotion in enumerate(CLASSES)
    }
    modality_weights = None
    if gates is not None and predicted_emotion is not None:
        predicted_index = CLASSES.index(predicted_emotion)
        face_weight = float(gates[predicted_index])
        modality_weights = {
            "face": round(face_weight, 6),
            "posture": round(1.0 - face_weight, 6),
        }
    elif route == "face_only_fallback":
        modality_weights = {"face": 1.0, "posture": 0.0}

    region_summary = {
        label: {
            "count": sum(item["label"] == label for item in detections),
            "highest_confidence": (
                round(max(item["confidence"] for item in detections if item["label"] == label), 6)
                if any(item["label"] == label for item in detections) else None
            ),
        }
        for label in REGION_COLORS
    }
    payload = {
        "status": status,
        "prediction": {
            "emotion": predicted_emotion,
            "confidence": round(confidence_value, 6) if confidence_value is not None else None,
            "probabilities": probability_map,
            "route": route,
            "modality_weights_for_predicted_emotion": modality_weights,
        },
        "detection": {
            "threshold": args.detector_conf,
            "pairing_status": pairing_status,
            "region_summary": region_summary,
            "detections": [serialize_detection(item) for item in detections],
        },
        "input": {
            "image": str(image_path),
            "width": width,
            "height": height,
        },
        "artifacts": {
            "output_folder": str(run_output),
            "annotated_result": str(run_output / "annotated_result.jpg"),
            "face_crop": str(run_output / "face_crop.jpg") if face_crop is not None else None,
            "posture_crop": (
                str(run_output / "posture_crop_face_masked.jpg")
                if posture_crop is not None else None
            ),
        },
        "warnings": warnings,
        "disclaimer": (
            "FeELINE identifies observable image-based cues for educational and research use; "
            "it is not a veterinary diagnosis."
        ),
    }
    result_path = run_output / "prediction.json"
    result_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    print("SUCCESS: FeELINE V3 single-image prediction completed.")
    print(f"  status: {status}")
    print(f"  route: {route}")
    print(f"  emotion: {predicted_emotion}")
    print(f"  confidence: {confidence_value}")
    print(f"  probabilities: {probability_map}")
    print(f"  warnings: {warnings}")
    print(f"  annotated result: {run_output / 'annotated_result.jpg'}")
    print(f"  JSON result: {result_path}")
    return 0 if status in {"success", "low_confidence"} else 2


if __name__ == "__main__":
    sys.exit(main())
