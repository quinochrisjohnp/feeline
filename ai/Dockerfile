
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

# NEW: Download EfficientNet-B0 pretrained weights during build
RUN python -c "from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights; efficientnet_b0(weights=EfficientNet_B0_Weights.DEFAULT); print('EfficientNet-B0 weights ready')"

# Copy AI application files
COPY . .

# Download actual AI models from Git LFS
RUN GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 --branch main \
    https://github.com/quinochrisjohnp/feeline.git /tmp/feeline-source \
    && cd /tmp/feeline-source \
    && git lfs pull --include="ai/**/*.pt" \
    && cp ai/training_runs_v3/final_anatomy_detector_v3/weights/best.pt \
       /app/training_runs_v3/final_anatomy_detector_v3/weights/best.pt \
    && cp ai/classification_runs_v3/final_gated_fusion_v3/final_gated_fusion_v3_torchscript.pt \
       /app/classification_runs_v3/final_gated_fusion_v3/final_gated_fusion_v3_torchscript.pt \
    && test "$(wc -c < /app/training_runs_v3/final_anatomy_detector_v3/weights/best.pt)" -gt 1000000 \
    && test "$(wc -c < /app/classification_runs_v3/final_gated_fusion_v3/final_gated_fusion_v3_torchscript.pt)" -gt 1000000 \
    && rm -rf /tmp/feeline-source

# Start FastAPI using Railway's assigned port
CMD ["sh", "-c", "exec uvicorn ai_api:app --host 0.0.0.0 --port ${PORT:-8000}"]
