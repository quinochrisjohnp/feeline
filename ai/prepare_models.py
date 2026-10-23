"""Materialize exact, hash-pinned Git LFS weights during the image build only."""
import hashlib
import json
from pathlib import Path
import re
import tempfile
import urllib.request

ROOT = Path(__file__).resolve().parent
BATCH_URL = "https://github.com/quinochrisjohnp/feeline.git/info/lfs/objects/batch"
POINTER = re.compile(rb"version https://git-lfs.github.com/spec/v1\noid sha256:([0-9a-f]{64})\nsize ([0-9]+)\n?")


def verify(path, expected):
    digest = hashlib.sha256()
    size = 0
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            size += len(chunk)
            digest.update(chunk)
    if size != expected["size"] or digest.hexdigest() != expected["sha256"]:
        raise ValueError(f"Model size/SHA256 mismatch: {path.name}")


def download(expected, destination, opener):
    payload = json.dumps({"operation": "download", "transfers": ["basic"],
                          "objects": [{"oid": expected["sha256"], "size": expected["size"]}]}).encode()
    request = urllib.request.Request(BATCH_URL, data=payload, headers={
        "Content-Type": "application/vnd.git-lfs+json", "Accept": "application/vnd.git-lfs+json"})
    with opener(request, timeout=60) as response:
        result = json.load(response)
    objects = result.get("objects", [])
    if len(objects) != 1 or objects[0].get("oid") != expected["sha256"] or objects[0].get("size") != expected["size"]:
        raise ValueError("LFS server returned an unexpected model object")
    action = objects[0].get("actions", {}).get("download", {})
    url = action.get("href", "")
    if not url.startswith("https://"):
        raise ValueError("LFS model unavailable: check repository access and LFS upload/quota")
    request = urllib.request.Request(url, headers=action.get("header", {}))
    # Never replace a pointer or existing file until the complete download is verified.
    with tempfile.TemporaryDirectory(dir=destination.parent) as temporary:
        candidate = Path(temporary) / "model.pt"
        with opener(request, timeout=120) as response, candidate.open("wb") as output:
            size = 0
            while chunk := response.read(1024 * 1024):
                size += len(chunk)
                if size > expected["size"]:
                    raise ValueError("LFS download exceeded expected model size")
                output.write(chunk)
        verify(candidate, expected)
        candidate.replace(destination)


def prepare(root=ROOT, opener=urllib.request.urlopen):
    manifest = json.loads((root / "model_manifest.json").read_text(encoding="utf-8"))
    threshold = root / "classification_runs/cat_validator_yolo26s/untouched_test_evaluation/selected_threshold.json"
    if json.loads(threshold.read_text(encoding="utf-8"))["threshold"] != 0.56:
        raise ValueError("Missing or unexpected validator threshold (expected 0.56)")
    for relative, expected in manifest.items():
        destination = (root / relative).resolve()
        if not destination.is_relative_to(root.resolve()):
            raise ValueError("Model path escapes build context")
        if not destination.is_file():
            raise FileNotFoundError(f"Required model missing from build context: {relative}")
        if destination.stat().st_size < 1024:
            pointer = POINTER.fullmatch(destination.read_bytes().replace(b"\r\n", b"\n"))
            if not pointer or pointer[1].decode() != expected["sha256"] or int(pointer[2]) != expected["size"]:
                raise ValueError(f"Invalid or unexpected Git LFS pointer: {relative}")
            print(f"Downloading exact Git LFS object: {relative}", flush=True)
            download(expected, destination, opener)
        verify(destination, expected)
        print(f"Verified model: {relative}", flush=True)


if __name__ == "__main__":
    prepare()
