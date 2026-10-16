
from pathlib import Path
import json
import sys

import torch
from PIL import Image, UnidentifiedImageError
from torchvision.models import (
    EfficientNet_B0_Weights,
    efficientnet_b0,
)


# ============================================================
# DOMESTIC CAT VALIDATION CONFIGURATION
# ============================================================

WEIGHTS = EfficientNet_B0_Weights.DEFAULT

# ImageNet domestic-cat classes:
# 281 = tabby
# 282 = tiger cat (domestic coat pattern)
# 283 = Persian cat
# 284 = Siamese cat
# 285 = Egyptian cat

DOMESTIC_CAT_CLASSES = {
    281,
    282,
    283,
    284,
    285,
}

MIN_CAT_CONFIDENCE = 0.50

_model = None


# ============================================================
# LOAD PRETRAINED EFFICIENTNET-B0 MODEL
# ============================================================

def load_model():
    global _model

    if _model is None:
        _model = efficientnet_b0(weights=WEIGHTS)
        _model.eval()

    return _model


# ============================================================
# VALIDATE DOMESTIC CAT IMAGE
# ============================================================

@torch.inference_mode()
def validate_domestic_cat(image_path, model=None):
    if model is None:
        model = load_model()

    try:
        with Image.open(image_path) as source:
            image = source.convert("RGB")
    except (UnidentifiedImageError, OSError) as exc:
        raise ValueError(
            "Invalid or unreadable image."
        ) from exc

    preprocess = WEIGHTS.transforms()
    image_tensor = preprocess(image).unsqueeze(0)

    outputs = model(image_tensor)
    probabilities = torch.softmax(outputs[0], dim=0)

    cat_confidence = sum(
        probabilities[index].item()
        for index in DOMESTIC_CAT_CLASSES
    )

    top_index = int(torch.argmax(probabilities).item())
    top_label = WEIGHTS.meta["categories"][top_index]

    is_domestic_cat = (
        cat_confidence >= MIN_CAT_CONFIDENCE
        and top_index in DOMESTIC_CAT_CLASSES
    )

    return {
        "is_domestic_cat": is_domestic_cat,
        "cat_confidence": round(cat_confidence, 4),
        "top_class": top_label,
        "top_class_confidence": round(
            probabilities[top_index].item(),
            4,
        ),
    }


# ============================================================
# SIMPLE BOOLEAN VALIDATOR FOR AI API
# ============================================================

def is_domestic_cat_image(image_path):
    result = validate_domestic_cat(image_path)

    print(
        "Domestic cat validation:",
        result,
        flush=True,
    )

    return result["is_domestic_cat"]


# ============================================================
# COMMAND LINE TEST
# ============================================================

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(
            "Usage: python domestic_cat_validator.py "
            "<image_path>"
        )
        sys.exit(1)

    image_path = Path(sys.argv[1])

    if not image_path.is_file():
        print(f"Image not found: {image_path}")
        sys.exit(1)

    result = validate_domestic_cat(image_path)

    print(json.dumps(result, indent=2))
