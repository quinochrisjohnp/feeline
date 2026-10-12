from fastapi import FastAPI, File, UploadFile, HTTPException
from pathlib import Path
import subprocess
import tempfile
import json
import sys

app = FastAPI(title="FeELINE AI API")

PROJECT_ROOT = Path(__file__).resolve().parent
PREDICTOR = PROJECT_ROOT / "predict_cat_emotion_v3.py"


@app.get("/")
def home():
    return {"message": "FeELINE AI API is running"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if file.content_type not in ("image/jpeg", "image/png"):
        raise HTTPException(
            status_code=400,
            detail="Only JPEG and PNG images are supported."
        )

    with tempfile.TemporaryDirectory() as temp_dir:
        image_path = Path(temp_dir) / (
            "cat.png" if file.content_type == "image/png" else "cat.jpg"
        )
        image_path.write_bytes(await file.read())

        output_root = Path(temp_dir) / "results"

        command = [
            sys.executable,
            str(PREDICTOR),
            str(image_path),
            "--project-root",
            str(PROJECT_ROOT),
            "--output-root",
            str(output_root),
            "--cpu",
        ]

        try:
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=180,
            )
        except subprocess.TimeoutExpired:
            raise HTTPException(
                status_code=504,
                detail="AI prediction timed out."
            )

        json_files = list(output_root.glob("*/prediction.json"))

        if not json_files:
            raise HTTPException(
                status_code=500,
                detail="AI prediction failed."
            )

        prediction_data = json.loads(
            json_files[0].read_text(encoding="utf-8")
        )

        return prediction_data