from __future__ import annotations

import base64
import json
import os
from pathlib import Path
import time
import urllib.error
import urllib.request


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "assets" / "api-game-kit" / "raw"
FINAL = ROOT / "assets" / "api-game-kit" / "final"
BASE_URL = os.getenv("OHLAOO_BASE_URL", "https://ohlaoo.com").rstrip("/")
API_KEY = os.getenv("OHLAOO_API_KEY")


JOBS = [
    {
        "name": "background-netbar-empty",
        "model": "gpt-image-2",
        "size": "1280x720",
        "quality": "medium",
        "prompt": (
            "Create a single coherent pixel-art game background, 1280x720, 16-bit mini game style. "
            "Scene: 1990s Chinese internet cafe interior, slightly isometric side view, tiled floor, old green lower wall, beige upper wall, fluorescent tube lights, fan, service counter, shelves, posters. "
            "Important: no computers, no desks, no chairs, no horses, no people, no characters. Keep the lower half open for 10 workstation sprites. "
            "No blurred painterly rendering, no 3D, no realistic photo, no gradients, no watermark. Crisp square pixels, cohesive palette."
        ),
    },
    {
        "name": "workstation-crt-empty",
        "model": "gpt-image-2",
        "size": "1024x1024",
        "quality": "medium",
        "prompt": (
            "Create this sprite on a perfectly flat solid #00ff00 chroma-key background for background removal. "
            "The #00ff00 background must be uniform with no shadows, gradients, texture, floor plane, or lighting variation. "
            "Do not use #00ff00 anywhere inside the subject. "
            "Transparent PNG sprite for a pixel-art game. One 1990s Chinese internet cafe workstation only: wooden desk, beige CRT monitor, keyboard, mouse, computer tower. "
            "The CRT monitor must face the viewer at a slight three-quarter angle. The screen area must be plain pure black / empty, rectangular, clean, and easy to replace with animation. "
            "No horse, no character, no chair, no room background, no text, no watermark. Crisp 16-bit pixel art, thick dark outline, consistent scale, centered with generous padding."
        ),
    },
    {
        "name": "horse-working-sheet",
        "model": "gpt-image-2",
        "size": "1024x1024",
        "quality": "medium",
        "prompt": (
            "Create this sprite sheet on a perfectly flat solid #00ff00 chroma-key background for background removal. "
            "The #00ff00 background must be uniform with no shadows, gradients, texture, floor plane, or lighting variation. "
            "Do not use #00ff00 anywhere inside the subject. "
            "Pixel-art sprite sheet, exactly 4 equal cells in one horizontal row. "
            "Each cell contains one complete full-body cute brown horse mascot, centered with generous padding and not touching any image edge. "
            "The horse sits on a small blue stool and types on a small keyboard, three-quarter front view. "
            "All 4 frames should be same size and same position, only subtle head/hand movement for typing. "
            "No computer monitor, no desk, no room background, no text, no watermark. Thick dark outline, 16-bit game style, large readable character."
        ),
    },
    {
        "name": "horse-gaming-sheet",
        "model": "gpt-image-2",
        "size": "1024x1024",
        "quality": "medium",
        "prompt": (
            "Create this sprite sheet on a perfectly flat solid #00ff00 chroma-key background for background removal. "
            "The #00ff00 background must be uniform with no shadows, gradients, texture, floor plane, or lighting variation. "
            "Do not use #00ff00 anywhere inside the subject. "
            "Transparent PNG pixel-art sprite sheet, 4 animation frames in one horizontal row. "
            "Cute brown horse mascot sitting on a small blue stool, slacking off and gaming, wearing tiny headset, hands on keyboard/controller, mischievous expression, three-quarter front view. "
            "Frames should be same size and same position, subtle bobbing and hand movement. "
            "No computer monitor, no desk, no room background, no text, no watermark. Thick dark outline, 16-bit mini game style, large readable character."
        ),
    },
    {
        "name": "horse-sleep-sheet",
        "model": "gpt-image-2",
        "size": "1024x1024",
        "quality": "medium",
        "prompt": (
            "Create this sprite sheet on a perfectly flat solid #00ff00 chroma-key background for background removal. "
            "The #00ff00 background must be uniform with no shadows, gradients, texture, floor plane, or lighting variation. "
            "Do not use #00ff00 anywhere inside the subject. "
            "Pixel-art sprite sheet, exactly 4 equal cells in one horizontal row. "
            "Each cell contains one complete full-body cute brown horse mascot, centered with generous padding and not touching any image edge. "
            "The horse sits on a small blue stool at a keyboard, asleep and slumped forward, head drooping, tiny Z marks above head. "
            "It must still be a horse sitting at a computer workstation posture, not a bed, not a blanket, not a pillow scene. "
            "All 4 frames should be same size and same position, subtle breathing motion. "
            "No computer monitor, no full desk, no room background, no watermark. Thick dark outline, 16-bit mini game style, large readable character."
        ),
    },
    {
        "name": "cow-boss-sheet",
        "model": "gpt-image-2",
        "size": "1024x1024",
        "quality": "medium",
        "prompt": (
            "Create this sprite sheet on a perfectly flat solid #00ff00 chroma-key background for background removal. "
            "The #00ff00 background must be uniform with no shadows, gradients, texture, floor plane, or lighting variation. "
            "Do not use #00ff00 anywhere inside the subject. "
            "Pixel-art sprite sheet, exactly 4 equal cells in one horizontal row. "
            "Each cell contains one complete anthropomorphic cow boss, centered with generous padding and not touching any image edge. "
            "Cow boss stands behind a tiny internet cafe counter, bossy office manager expression, dark vest, tiny tie, pointing and talking. "
            "All 4 frames should be same size and same position, subtle mouth/arm movement. "
            "No room background, no text, no speech bubble, no watermark. Thick dark outline, 16-bit mini game style, readable at small size."
        ),
    },
]


def request_json(url: str, payload: dict) -> dict:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    last_error = None
    for attempt in range(1, 4):
        try:
            with urllib.request.urlopen(req, timeout=180) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            last_error = RuntimeError(f"HTTP {exc.code}: {detail}")
            if exc.code not in {429, 500, 502, 503, 504} or attempt == 3:
                raise last_error from exc
        except Exception as exc:
            last_error = exc
            if attempt == 3:
                raise
        print(f"retrying after transient image API error ({attempt}/3)...")
        time.sleep(2 * attempt)
    raise RuntimeError(f"Image API failed: {last_error}")


def save_image_response(result: dict, out_path: Path) -> None:
    data = result.get("data") or []
    if not data:
        raise RuntimeError(f"No image data in response: {result}")
    item = data[0]
    if item.get("b64_json"):
        out_path.write_bytes(base64.b64decode(item["b64_json"]))
        return
    if item.get("url"):
        with urllib.request.urlopen(item["url"], timeout=120) as resp:
            out_path.write_bytes(resp.read())
        return
    raise RuntimeError(f"Unsupported image item: {item}")


def main() -> None:
    if not API_KEY:
        raise SystemExit("Set OHLAOO_API_KEY before running.")

    RAW.mkdir(parents=True, exist_ok=True)
    FINAL.mkdir(parents=True, exist_ok=True)
    manifest = []
    for job in JOBS:
        out = RAW / f"{job['name']}.png"
        if out.exists() and out.stat().st_size > 0:
            print(f"skip existing {out}")
            manifest.append({"name": job["name"], "path": str(out.relative_to(ROOT)), "model": job["model"]})
            continue
        payload = {
            "model": job["model"],
            "prompt": job["prompt"],
            "size": job["size"],
            "quality": job.get("quality", "medium"),
            "output_format": "png",
        }
        if job.get("background"):
            payload["background"] = job["background"]
        print(f"generating {job['name']} with {job['model']}...")
        started = time.time()
        result = request_json(f"{BASE_URL}/v1/images/generations", payload)
        save_image_response(result, out)
        print(f"wrote {out} in {time.time() - started:.1f}s")
        manifest.append({"name": job["name"], "path": str(out.relative_to(ROOT)), "model": job["model"]})

    (RAW / "api-generation-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
