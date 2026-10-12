
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV YOLO_CONFIG_DIR=/tmp/ultralytics

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    git \
    git-lfs \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir \
    torch --index-url https://download.pytorch.org/whl/cpu

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN git clone --depth 1 --branch main \
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

CMD ["sh", "-c", "exec uvicorn ai_api:app --host 0.0.0.0 --port ${PORT:-8000}"]
