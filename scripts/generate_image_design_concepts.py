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
OUT_DIR = ROOT / "assets" / "image-design-concepts"
BASE_URL = os.getenv("OHLAOO_BASE_URL", "https://ohlaoo.com").rstrip("/")
API_KEY = os.getenv("OHLAOO_API_KEY")


STYLE_LOCK = (
    "Low-resolution pixel game screenshot. Hard square pixels, nearest-neighbor, chunky dark outlines, limited palette. "
    "Not a webpage, not smooth illustration, no antialiasing, no gradients, no 3D, no photorealism, no watermark. "
    "One consistent 2D mini-game style, scale, and perspective."
)

CORE_SCENE = (
    "SUB2API token ranking mini game in a nostalgic 1990s Chinese internet cafe. "
    "Exactly 10 powered-on beige CRT computers, two rows of five. "
    "Each desk has one seated cute horse worker at correct scale. "
    "Some horses work on dashboards or terminals, some play games, one sleeps. "
    "Every CRT screen is visible and shows different content: dashboard, terminal, MOBA, FPS, video, download, rank, card game, AFK, fishing. "
    "Bossy cow boss behind the back service counter near shelves. "
    "Small pixel leaderboard/reward UI for player plus top three. Only readable text allowed: SUB2API."
)


CONCEPTS = [
    {
        "name": "concept-a-arcade-floorplan",
        "prompt": (
            f"{STYLE_LOCK} {CORE_SCENE} "
            "Composition: camera is a fixed 3/4 overhead game camera, like a playable management mini game. "
            "Two rows of five desks form a clean grid with enough walking space between rows. "
            "Background details: fluorescent tube lights, wall fan, snack shelf, service counter, bead curtain, posters, tiled floor. "
            "Important layering clarity: monitors are behind the horse heads, horse bodies sit below the screen interiors, no screen should cover a horse and no horse should fully block a screen. "
            "Make it feel like a finished pixel game's main arena screen."
        ),
    },
    {
        "name": "concept-b-sideview-netbar",
        "prompt": (
            f"{STYLE_LOCK} {CORE_SCENE} "
            "Composition: slightly lower side-view arcade perspective, cozy and dense like an old Chinese netbar room. "
            "The front row is lower on the canvas and the back row is raised behind it; all ten computers remain visible. "
            "Cow boss is exactly behind the back counter by shelves, not floating in the workstation rows. "
            "Emphasize CRT glow, tiny desktop accessories, token counters, cup noodles, sticky notes, and game-like idle animations implied through varied poses. "
            "Keep the readable silhouettes big, playful, and game-like."
        ),
    },
    {
        "name": "concept-c-clean-game-ui",
        "prompt": (
            f"{STYLE_LOCK} {CORE_SCENE} "
            "Composition: clean browser mini-game viewport with a pixel UI frame, but the main content is the netbar game scene. "
            "Keep the 10-machine grid highly legible and less crowded, with clear empty space for future clickable interactions. "
            "Top strip has token ranking, right side has compact coupon/reward icons, bottom has a small selected-user status bar. "
            "The art should be cute and polished, closer to a real indie pixel game than a poster. "
            "Avoid any farmhouse, fantasy village, modern office, cyberpunk, or smooth cartoon style."
        ),
    },
    {
        "name": "concept-d-hard-pixel-tilemap",
        "prompt": (
            "16-bit pixel art game screenshot, hard square pixels, low-res tilemap, chunky black outlines, limited colors. "
            "No smooth painting, no antialiasing, no gradients, no 3D. "
            "SUB2API mini game in a 1990s Chinese internet cafe. Exactly 10 beige CRT computers in two rows of five. "
            "Ten same-scale cute horse workers sit at the computers. Screens are powered on and all different: code, chart, MOBA, FPS, video, download, rank, cards, AFK, fishing. "
            "Cow boss behind the back snack counter near shelves. Small pixel UI for player and top 3 token ranking. "
            "Clean playable game layout, clear separation, monitors visible, horses do not cover screen interiors. Only readable text: SUB2API."
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
        raise RuntimeError(f"No image data in response: {result}")
    item = data[0]
    if item.get("b64_json"):
        out_path.write_bytes(base64.b64decode(item["b64_json"]))
        return
    if item.get("url"):
        with urllib.request.urlopen(item["url"], timeout=180) as resp:
            out_path.write_bytes(resp.read())
        return
    raise RuntimeError(f"Unsupported image item: {item}")


def request_streamed_image(url: str, payload: dict, out_path: Path) -> None:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=300) as resp:
        for raw_line in resp:
            line = raw_line.decode("utf-8", errors="replace").strip()
            if not line.startswith("data:"):
                continue
            text = line[5:].strip()
            if not text or text == "[DONE]":
                continue
            event = json.loads(text)
            if event.get("object") != "image.generation.result":
                continue
            save_image(event, out_path)
            return
    raise RuntimeError("Stream ended without image.generation.result.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Image API concept motherboards for the SUB2API horse netbar game.")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--only", nargs="*")
    parser.add_argument("--size", default="2048x1152")
    parser.add_argument("--quality", default="medium")
    parser.add_argument("--stream", action="store_true")
    args = parser.parse_args()

    if not API_KEY:
        raise SystemExit("Set OHLAOO_API_KEY before running.")

    selected = set(args.only or [])
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest = []
    for concept in CONCEPTS:
        if selected and concept["name"] not in selected:
            continue
        out = OUT_DIR / f"{concept['name']}.png"
        if out.exists() and out.stat().st_size > 0 and not args.force:
            print(f"skip existing {out}")
        else:
            payload = {
                "model": "gpt-image-2",
                "prompt": concept["prompt"],
                "size": args.size,
                "quality": args.quality,
                "output_format": "png",
            }
            if args.stream:
                payload["stream"] = True
                payload["partial_images"] = 1
            print(f"generating {concept['name']}...")
            started = time.time()
            if args.stream:
                request_streamed_image(f"{BASE_URL}/v1/images/generations", payload, out)
            else:
                result = request_json(f"{BASE_URL}/v1/images/generations", payload)
                save_image(result, out)
            print(f"wrote {out} in {time.time() - started:.1f}s")
        manifest.append(
            {
                "name": concept["name"],
                "path": str(out.relative_to(ROOT)),
                "size": args.size,
                "quality": args.quality,
                "prompt": concept["prompt"],
            }
        )

    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
