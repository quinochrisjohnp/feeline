
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV YOLO_CONFIG_DIR=/tmp/ultralytics

# Install system dependencies and Git LFS
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    git \
    git-lfs \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements
COPY requirements.txt .

# Install compatible CPU versions of PyTorch and TorchVision
RUN pip install --no-cache-dir \
    torch==2.5.1+cpu \
    torchvision==0.20.1+cpu \
    --index-url https://download.pytorch.org/whl/cpu

# Install AI API dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Verify PyTorch and TorchVision compatibility
RUN python -c "import torch, torchvision; from torchvision.ops import nms; print('PyTorch:', torch.__version__, 'TorchVision:', torchvision.__version__)"

# Copy AI application files
COPY . .

# Use the supplied build-context models; never replace them from remote main.
RUN test -s classification_runs/cat_validator_yolo26s/untouched_test_evaluation/selected_threshold.json \
    && test "$(wc -c < classification_runs/cat_validator_yolo26s/weights/best.pt)" -gt 1000000 \
    && test "$(wc -c < training_runs_v3/final_anatomy_detector_v3/weights/best.pt)" -gt 1000000 \
    && test "$(wc -c < classification_runs_v3/final_gated_fusion_v3/final_gated_fusion_v3_torchscript.pt)" -gt 1000000

# Fail the build if bundled models cannot load with the pinned CPU packages.
# No API requests, storage access, or prediction artifacts are produced.
RUN python -c "from predict_cat_emotion import CatEmotionPipeline; CatEmotionPipeline(cpu=True); print('FeELINE models loaded successfully on CPU')"

# Start FastAPI using Railway's assigned port
CMD ["sh", "-c", "exec uvicorn ai_api:app --host 0.0.0.0 --port ${PORT:-8000}"]
