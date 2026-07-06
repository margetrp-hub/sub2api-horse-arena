from __future__ import annotations

import argparse
import base64
import json
import os
from pathlib import Path
import time
import urllib.error
import urllib.request


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "assets" / "api-layered-scene" / "raw"
BASE_URL = os.getenv("OHLAOO_BASE_URL", "https://ohlaoo.com").rstrip("/")
API_KEY = os.getenv("OHLAOO_API_KEY")


STYLE = (
    "Strict low-resolution 2D pixel game sprite art, like a 1990s arcade/browser mini game. "
    "Hard square pixels, nearest-neighbor look, chunky black outline, limited color palette, no antialiasing, "
    "no painterly lighting, no smooth digital illustration, no gradients, no glow, no 3D render, no watermark. "
    "The art should look like it was drawn at tiny sprite resolution and enlarged."
)

CHROMA = (
    "Use a perfectly flat solid #00ff00 chroma-key background. "
    "The background must be one uniform color with no shadow, texture, floor, gradients, or light spill. "
    "Do not use #00ff00 inside the character. Keep each character fully separated from the background."
)

SHEET_RULES = (
    "Make exactly four equal animation frames in one horizontal row, no gutters, no labels, no text. "
    "The same character must keep the same size and same seat position in all frames; only tiny hand, ear, head, and mouth motion changes. "
    "Leave the top 22 percent of every cell empty so the sprite can sit in front of a CRT without covering the monitor screen. "
    "No computer monitor, no desk, no keyboard unless explicitly requested, no room background."
)

JOBS = [
    {
        "name": "horse-working-strict",
        "size": "1536x512",
        "prompt": (
            f"{STYLE} {CHROMA} {SHEET_RULES} "
            "Subject: cute brown chibi horse office worker, side three-quarter view facing left, sitting on a small blue stool, "
            "front hooves low as if typing on an invisible keyboard on a desk in front of it, focused but funny expression. "
            "Readable game silhouette, medium brown body, cream muzzle, small dark mane, compact body, not shiny, not realistic."
        ),
    },
    {
        "name": "horse-gaming-strict",
        "size": "1536x512",
        "prompt": (
            f"{STYLE} {CHROMA} {SHEET_RULES} "
            "Subject: cute brown chibi horse slacking off, side three-quarter view facing left, sitting on a small blue stool, "
            "wearing tiny blue headphones, holding an invisible controller or keyboard low, mischievous gaming expression. "
            "Readable game silhouette, compact body, same scale as a working horse sprite, not realistic, no logos."
        ),
    },
    {
        "name": "horse-sleep-strict",
        "size": "1536x512",
        "prompt": (
            f"{STYLE} {CHROMA} {SHEET_RULES} "
            "Subject: cute brown chibi horse dozing at work, side three-quarter view facing left, sitting on a small blue stool, "
            "head drooping low with tiny white Z marks above the head, front hooves near an invisible keyboard. "
            "Readable game silhouette, compact sleepy pose, same scale as the working horse sprite, not realistic."
        ),
    },
]


def request_json(url: str, payload: dict) -> dict:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }
    last_error: Exception | None = None
    for attempt in range(1, 4):
        req = urllib.request.Request(url, data=body, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=260) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            last_error = RuntimeError(f"HTTP {exc.code}: {detail}")
            if exc.code not in {408, 409, 429, 500, 502, 503, 504} or attempt == 3:
                raise last_error from exc
        except Exception as exc:
            last_error = exc
            if attempt == 3:
                raise
        print(f"retrying image API error ({attempt}/3)...")
        time.sleep(3 * attempt)
    raise RuntimeError(f"Image API failed: {last_error}")


def save_image(result: dict, out_path: Path) -> None:
    data = result.get("data") or []
    if not data:
        raise RuntimeError(f"No image data: {result}")
    item = data[0]
    if item.get("b64_json"):
        out_path.write_bytes(base64.b64decode(item["b64_json"]))
        return
    if item.get("url"):
        with urllib.request.urlopen(item["url"], timeout=180) as resp:
            out_path.write_bytes(resp.read())
        return
    raise RuntimeError(f"Unsupported image item: {item}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate strict pixel horse sprites with the ohlaoo image API.")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--only", nargs="*")
    args = parser.parse_args()
    if not API_KEY:
        raise SystemExit("Set OHLAOO_API_KEY.")
    selected = set(args.only or [])
    RAW.mkdir(parents=True, exist_ok=True)
    manifest = []
    for job in JOBS:
        if selected and job["name"] not in selected:
            continue
        out = RAW / f"{job['name']}.png"
        if out.exists() and out.stat().st_size > 0 and not args.force:
            print(f"skip existing {out}")
        else:
            print(f"generating {job['name']}...")
            started = time.time()
            result = request_json(
                f"{BASE_URL}/v1/images/generations",
                {
                    "model": "gpt-image-2",
                    "prompt": job["prompt"],
                    "size": job["size"],
                    "quality": "medium",
                    "output_format": "png",
                },
            )
            save_image(result, out)
            print(f"wrote {out} in {time.time() - started:.1f}s")
        manifest.append({"name": job["name"], "path": str(out.relative_to(ROOT)), "prompt": job["prompt"]})
    (RAW / "strict-sprite-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
