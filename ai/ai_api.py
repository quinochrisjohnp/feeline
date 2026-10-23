from contextlib import asynccontextmanager
from pathlib import Path
import tempfile
import logging
import anyio
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from PIL import UnidentifiedImageError
from predict_cat_emotion import CatEmotionPipeline


@asynccontextmanager
async def lifespan(app: FastAPI):
    # One instance per worker; no subprocess/model reload on request.
    app.state.pipeline = await anyio.to_thread.run_sync(CatEmotionPipeline)
    app.state.inference_limiter = anyio.CapacityLimiter(1)
    yield
    app.state.pipeline = None


app = FastAPI(title="FeELINE AI API", lifespan=lifespan)


@app.get("/")
def home():
    return {"message": "FeELINE AI API is running"}


@app.post("/predict")
async def predict(request: Request, file: UploadFile = File(...)):
    try:
        if file.content_type not in ("image/jpeg", "image/png"):
            raise HTTPException(status_code=415, detail="Only JPEG and PNG images are supported.")
        data = await file.read(5 * 1024 * 1024 + 1)
        if not data or len(data) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Provide an image up to 5 MB.")
        def infer():
            # Temporary input exists only for this request; no output artifacts.
            with tempfile.TemporaryDirectory() as directory:
                image = Path(directory) / ("image.png" if file.content_type == "image/png" else "image.jpg")
                image.write_bytes(data)
                return request.app.state.pipeline.predict(image)
        # The limiter remains held until inference finishes, including cancellation.
        return await anyio.to_thread.run_sync(infer, limiter=request.app.state.inference_limiter)
    except HTTPException:
        raise
    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="Invalid or unreadable image.")
    except Exception:
        logging.exception("Local inference failed")
        raise HTTPException(status_code=503, detail="Detection service unavailable.")
    finally:
        await file.close()
