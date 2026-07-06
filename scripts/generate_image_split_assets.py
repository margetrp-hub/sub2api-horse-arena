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
OUT_DIR = ROOT / "assets" / "image-split-assets" / "raw"
LOG_DIR = ROOT / "assets" / "image-split-assets" / "logs"
BASE_URL = os.getenv("OHLAOO_BASE_URL", "https://ohlaoo.com").rstrip("/")
API_KEY = os.getenv("OHLAOO_API_KEY")


STYLE = (
    "16-bit hard pixel art game asset matching the SUB2API horse netbar game. "
    "Low-resolution tilemap/sprite look, hard square pixels, nearest-neighbor, chunky black outlines, limited warm arcade palette. "
    "No smooth digital painting, no antialiasing, no gradients, no 3D, no photorealism, no watermark."
)

CHROMA = (
    "Use a perfectly flat solid #00ff00 chroma-key background. "
    "The background must be one uniform color with no shadow, texture, floor, gradients, or light spill. "
    "Do not use #00ff00 in the subject. Keep the subject fully separated with generous padding."
)

SHEET = (
    "Make exactly four equal animation frames in one horizontal row, no labels and no text. "
    "The same character keeps the same scale and same seat position in all frames; only small hand, head, ear, mouth, or breathing motion changes."
)


JOBS = [
    {
        "name": "empty-netbar-background-hard-pixel",
        "size": "1536x1024",
        "quality": "low",
        "prompt": (
            f"{STYLE} Create only the empty background layer: nostalgic 1990s Chinese internet cafe interior, "
            "back service counter with snack shelves, fluorescent lights, wall fan, old door, bead curtain, tiled floor, worn green lower wall. "
            "Important: no computers, no desks, no chairs, no horses, no cow boss, no people, no UI. "
            "Leave the middle and lower floor clean and open for exactly ten separate computer sprites in two rows."
        ),
    },
    {
        "name": "single-crt-workstation-hard-pixel",
        "size": "1024x1024",
        "quality": "low",
        "prompt": (
            f"{STYLE} {CHROMA} One standalone sprite: old beige CRT computer workstation for a 1990s internet cafe. "
            "Wood desk, CRT monitor, keyboard, mouse, computer tower, small chair. "
            "The CRT screen interior must be one flat pure #ff00ff rectangle placeholder inside the beige bezel. "
            "No horse, no cow, no person, no room, no text."
        ),
    },
    {
        "name": "horse-working-sheet-hard-pixel",
        "size": "1536x512",
        "quality": "low",
        "prompt": (
            f"{STYLE} {CHROMA} {SHEET} Cute brown chibi horse worker sprite sheet, back view facing upward toward a CRT monitor, "
            "sitting upright on a small office chair, hooves low in front as if typing on a keyboard. "
            "Compact seated silhouette like the horses in the D concept image, tail visible, ears visible, head above shoulders. "
            "No monitor, no desk, no room, no long lying pose."
        ),
    },
    {
        "name": "horse-gaming-sheet-hard-pixel",
        "size": "1536x512",
        "quality": "low",
        "prompt": (
            f"{STYLE} {CHROMA} {SHEET} Cute brown chibi horse slacking sprite sheet, back view facing upward toward a CRT monitor, "
            "sitting upright on a small office chair, tiny headset, excited gaming pose, hooves low on invisible keyboard. "
            "Compact seated silhouette, no monitor, no desk, no logos, no room, no long lying pose."
        ),
    },
    {
        "name": "horse-sleep-sheet-hard-pixel",
        "size": "1536x512",
        "quality": "low",
        "prompt": (
            f"{STYLE} {CHROMA} {SHEET} Cute brown chibi horse sleeping at work sprite sheet, back view facing upward toward a CRT monitor, "
            "sitting on a small office chair, slumped forward slightly, tiny Z marks above head. "
            "Compact seated silhouette, no monitor, no desk, no room, no long lying pose."
        ),
    },
    {
        "name": "cow-boss-sheet-hard-pixel",
        "size": "1024x512",
        "quality": "low",
        "prompt": (
            f"{STYLE} {CHROMA} {SHEET} Bossy chibi cow boss sprite sheet, standing behind a small netbar service counter, "
            "dark vest and tiny tie, pointing and talking like an annoying company boss. "
            "Large readable body, no full room background, no speech bubble."
        ),
    },
    {
        "name": "cow-boss-single-hard-pixel",
        "size": "1024x1024",
        "quality": "low",
        "prompt": (
            f"{STYLE} {CHROMA} One standalone chibi cow internet cafe manager sprite. "
            "The cow stands behind a small wooden cashier counter, wearing a dark vest and tiny tie, one hoof pointing forward, mouth open as if talking. "
            "Cute game character, large readable silhouette, centered. No room background, no speech bubble, no text."
        ),
    },
    {
        "name": "horse-gaming-single-hard-pixel",
        "size": "1024x1024",
        "quality": "low",
        "prompt": (
            f"{STYLE} {CHROMA} One standalone cute brown chibi horse gamer sprite, back view facing upward toward a CRT monitor. "
            "Sitting upright on a small office chair, tiny headset, excited pose, hooves low on an invisible keyboard. "
            "Compact seated silhouette like a 16-bit management game worker. No monitor, no desk, no room, no text."
        ),
    },
    {
        "name": "horse-sleep-single-hard-pixel",
        "size": "1024x1024",
        "quality": "low",
        "prompt": (
            f"{STYLE} {CHROMA} One standalone cute brown chibi horse sleeping-at-work sprite, back view facing upward toward a CRT monitor. "
            "Sitting on a small office chair, head drooping slightly, tiny Z marks, compact seated silhouette. "
            "No monitor, no desk, no room, no text."
        ),
    },
]


def save_image(event: dict, out_path: Path) -> None:
    data = event.get("data") or []
    if not data:
        raise RuntimeError(f"No image data in response: {event}")
    item = data[0]
    if item.get("b64_json"):
        out_path.write_bytes(base64.b64decode(item["b64_json"]))
        return
    if item.get("url"):
        with urllib.request.urlopen(item["url"], timeout=180) as resp:
            out_path.write_bytes(resp.read())
        return
    raise RuntimeError(f"Unsupported image item: {item}")


def stream_generate(payload: dict, out_path: Path, log_path: Path) -> None:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }
    req = urllib.request.Request(f"{BASE_URL}/v1/images/generations", data=body, headers=headers, method="POST")
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(req, timeout=330) as resp:
        with log_path.open("w", encoding="utf-8") as log:
            for raw_line in resp:
                line = raw_line.decode("utf-8", errors="replace").strip()
                if not line.startswith("data:"):
                    continue
                text = line[5:].strip()
                if not text or text == "[DONE]":
                    continue
                event = json.loads(text)
                compact = {k: v for k, v in event.items() if k != "data"}
                compact["data_count"] = len(event.get("data") or [])
                log.write(json.dumps(compact, ensure_ascii=False) + "\n")
                if event.get("object") == "image.generation.result":
                    save_image(event, out_path)
                    return
    raise RuntimeError("Stream ended without image.generation.result.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate split Image API assets for the SUB2API horse netbar game.")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--only", nargs="*")
    args = parser.parse_args()
    if not API_KEY:
        raise SystemExit("Set OHLAOO_API_KEY before running.")

    selected = set(args.only or [])
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    manifest = []
    for job in JOBS:
        if selected and job["name"] not in selected:
            continue
        out = OUT_DIR / f"{job['name']}.png"
        if out.exists() and out.stat().st_size > 0 and not args.force:
            print(f"skip existing {out}")
        else:
            payload = {
                "model": "gpt-image-2",
                "prompt": job["prompt"],
                "size": job["size"],
                "quality": job["quality"],
                "output_format": "png",
                "stream": True,
                "partial_images": 1,
            }
            print(f"generating {job['name']}...")
            started = time.time()
            stream_generate(payload, out, LOG_DIR / f"{job['name']}.jsonl")
            print(f"wrote {out} in {time.time() - started:.1f}s")
        manifest.append({**job, "path": str(out.relative_to(ROOT))})
    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
