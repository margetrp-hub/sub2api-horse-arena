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
OUT = ROOT / "assets" / "image-master-v3" / "raw"
BASE_URL = os.getenv("OHLAOO_BASE_URL", "https://ohlaoo.com").rstrip("/")
API_KEY = os.getenv("OHLAOO_API_KEY")


STYLE = (
    "Strict 16-bit pixel game art, like a polished Chinese indie browser mini game. "
    "Hard square pixels, nearest-neighbor look, chunky dark outlines, limited warm fluorescent palette, "
    "orthographic 3/4 old internet-cafe perspective. No smooth painting, no vector art, no 3D, "
    "no photorealism, no gradients, no antialiasing, no watermark."
)

GREEN = (
    "Create the asset on a perfectly flat solid #00ff00 chroma-key background. "
    "The #00ff00 background must be one uniform color with no floor plane, no shadow, no texture, and no lighting variation. "
    "Do not use #00ff00 inside the subject."
)

STATION_RULES = (
    "Sprite sheet layout: exactly four equal cells in one horizontal row. "
    "Every cell contains the same complete workstation group: wooden internet-cafe desk, beige CRT monitor, keyboard, mouse, "
    "computer tower, small chair/stool, and one cute brown chibi horse user seated at the desk. "
    "The screen interior of the CRT must be a perfectly flat #ff00ff rectangle in exactly the same position in all four cells; "
    "this magenta screen is a placeholder hole for later animation. "
    "The horse and desk must share one perspective and lighting, with coherent scale. "
    "The horse body must sit below the screen interior; horse head/ears must not cover the magenta screen. "
    "No room background, no UI, no text, no logos."
)


JOBS = [
    {
        "name": "master-v3-reference",
        "size": "2048x1152",
        "quality": "high",
        "prompt": (
            f"{STYLE} Complete production mockup screenshot for a pixel game called SUB2API. "
            "Scene: nostalgic 1990s Chinese internet cafe, exactly ten powered-on beige CRT workstations in two rows of five, "
            "same-scale cute horse workers sitting at the computers, some working, some gaming, one sleeping, "
            "and a bossy cow boss behind the service counter by shelves. "
            "Dark black-and-gold game HUD at top, compact right-side TOP 3 leaderboard, small bottom selected-player status strip. "
            "The whole image must feel like one coherent playable game screen, not a collage, not a webpage. "
            "All computers, horses, boss, background, and UI must share the same pixel style, lighting, scale, and camera angle. "
            "Every CRT screen is visible and powered on with different tiny content. Only readable text allowed: SUB2API."
        ),
    },
    {
        "name": "background-empty-v3",
        "size": "2048x1152",
        "quality": "high",
        "prompt": (
            f"{STYLE} Empty background layer for the same SUB2API pixel game. "
            "A nostalgic 1990s Chinese internet cafe interior with tiled floor, green lower wall, worn beige wall, "
            "fluorescent lights, wall fan, red signboards, posters, bead curtain, snack shelf, and service counter. "
            "Important: no computers, no desks, no chairs, no horses, no cow boss, no characters, no UI panels. "
            "Leave the central and lower area open for exactly ten separate workstation sprites in two rows."
        ),
    },
    {
        "name": "station-working-sheet-v3",
        "size": "2048x512",
        "quality": "high",
        "prompt": (
            f"{STYLE} {GREEN} {STATION_RULES} "
            "Work mode: the horse is focused and typing, with tiny hand and ear movement across the four cells. "
            "Use warm beige CRT glow and old netbar desk clutter such as a cup, notebook, and cable, but keep the screen magenta area clean."
        ),
    },
    {
        "name": "station-gaming-sheet-v3",
        "size": "2048x512",
        "quality": "high",
        "prompt": (
            f"{STYLE} {GREEN} {STATION_RULES} "
            "Gaming/slacking mode: the horse wears a tiny headset and leans forward excitedly, with small head and hand movement across cells. "
            "The pose should feel like playing MOBA or FPS at the computer, but do not include real game logos."
        ),
    },
    {
        "name": "station-sleep-sheet-v3",
        "size": "2048x512",
        "quality": "high",
        "prompt": (
            f"{STYLE} {GREEN} {STATION_RULES} "
            "AFK/sleep mode: the horse is sleepy at the desk, slumped but still seated at the computer, with subtle breathing motion across cells. "
            "Small pixel sleep marks are allowed, but no readable text."
        ),
    },
    {
        "name": "cow-boss-counter-sheet-v3",
        "size": "2048x512",
        "quality": "high",
        "prompt": (
            f"{STYLE} {GREEN} "
            "Sprite sheet layout: exactly four equal cells in one horizontal row. "
            "Every cell contains the same bossy chibi cow boss behind a small old internet-cafe service counter, "
            "wearing a dark vest and tiny tie, pointing and talking like a company boss. "
            "Subtle mouth, arm, and head movement across the four cells. "
            "No room background, no speech bubble, no UI, no readable text."
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
            with urllib.request.urlopen(req, timeout=300) as resp:
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
        print(f"retrying after transient image API error ({attempt}/3)...")
        time.sleep(4 * attempt)
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
        with urllib.request.urlopen(item["url"], timeout=240) as resp:
            out_path.write_bytes(resp.read())
        return
    raise RuntimeError(f"Unsupported image item: {item}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate strict Image-first v3 assets for the SUB2API horse netbar game.")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--only", nargs="*")
    parser.add_argument("--draft", action="store_true", help="Use smaller medium-quality image requests for faster, more reliable iteration.")
    args = parser.parse_args()

    if not API_KEY:
        raise SystemExit("Set OHLAOO_API_KEY before running.")

    selected = set(args.only or [])
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = []
    for job in JOBS:
        if selected and job["name"] not in selected:
            continue
        out = OUT / f"{job['name']}.png"
        if out.exists() and out.stat().st_size > 0 and not args.force:
            print(f"skip existing {out}")
        else:
            size = job["size"]
            quality = job["quality"]
            if args.draft:
                size = "1536x864" if "reference" in job["name"] or "background" in job["name"] else "1536x512"
                quality = "medium"
            payload = {
                "model": "gpt-image-2",
                "prompt": job["prompt"],
                "size": size,
                "quality": quality,
                "output_format": "png",
            }
            print(f"generating {job['name']}...")
            started = time.time()
            result = request_json(f"{BASE_URL}/v1/images/generations", payload)
            save_image_response(result, out)
            print(f"wrote {out} in {time.time() - started:.1f}s")
        manifest.append({**job, "path": str(out.relative_to(ROOT))})

    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
