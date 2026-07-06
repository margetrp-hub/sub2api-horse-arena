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
RAW = ROOT / "assets" / "api-game-kit-v2" / "raw"
BASE_URL = os.getenv("OHLAOO_BASE_URL", "https://ohlaoo.com").rstrip("/")
API_KEY = os.getenv("OHLAOO_API_KEY")


STYLE_CORE = (
    "Cohesive cute Chinese indie pixel game art direction, like a polished 2D browser mini game. "
    "32-bit pixel art, crisp square pixels, chunky readable silhouettes, clean dark outlines, "
    "warm fluorescent 1990s Chinese internet-cafe palette, orthographic three-quarter game perspective. "
    "No photorealism, no semi-realistic digital painting, no smooth vector art, no blurry gradients, no watermark."
)

CHROMA_RULES = (
    "Create the subject on a perfectly flat solid #00ff00 chroma-key background for background removal. "
    "The #00ff00 background must be one uniform color with no shadows, gradients, texture, floor plane, or lighting variation. "
    "Do not use #00ff00 anywhere inside the subject. Keep the subject centered with generous padding."
)


JOBS = [
    {
        "name": "master-art-direction",
        "model": "gpt-image-2",
        "size": "2048x1152",
        "quality": "medium",
        "prompt": (
            f"{STYLE_CORE} "
            "Create one complete production mockup for a token leaderboard mini game called SUB2API 马力网吧. "
            "Scene: a nostalgic 1990s Chinese internet cafe with exactly ten CRT computer desks in two rows of five, "
            "large cute chibi horse workers sitting at the computers, some working, some gaming, some sleeping or fishing, "
            "and a bossy chibi cow boss behind a small service counter. "
            "The whole image must feel like one real pixel game screenshot with consistent scale, perspective, lighting, and outlines. "
            "Use simple icon-like signs only; avoid readable Chinese text except the exact title SUB2API if it appears. "
            "No cropped characters, no tiny horses, no farmhouse, no fantasy farm."
        ),
    },
    {
        "name": "background-netbar-empty",
        "model": "gpt-image-2",
        "size": "1280x720",
        "quality": "medium",
        "prompt": (
            f"{STYLE_CORE} "
            "Create only the empty background layer for the same game. "
            "Scene: 1990s Chinese internet cafe interior, tiled floor, green lower wall and beige worn upper wall, "
            "fluorescent tube lights, wall fan, entrance curtain, service counter area, snack shelf, posters and price boards. "
            "Important layer rule: no computers, no desks, no chairs, no horses, no cow boss, no people, no characters. "
            "Leave the lower two-thirds open and clean for exactly ten separate workstation sprites. "
            "Avoid readable text; signs should be blank shapes, icons, or fake pixel marks only."
        ),
    },
    {
        "name": "workstation-crt-magenta",
        "model": "gpt-image-2",
        "size": "1024x1024",
        "quality": "medium",
        "prompt": (
            f"{STYLE_CORE} {CHROMA_RULES} "
            "Transparent game sprite source: one empty 1990s internet cafe workstation only. "
            "Wooden desk, beige CRT monitor, keyboard, mouse, beige computer tower, and a simple low stool. "
            "No horse, no cow, no character, no room background. "
            "Critical screen rule: the CRT screen interior must be a perfectly flat bright #ff00ff rectangle, "
            "front-facing 4:3 shape, with a thick beige monitor bezel around it. "
            "The #ff00ff screen is a placeholder that will be cut out later; do not put any image, reflection, text, or shading inside it."
        ),
    },
    {
        "name": "horse-working-sheet",
        "model": "gpt-image-2",
        "size": "1536x512",
        "quality": "medium",
        "prompt": (
            f"{STYLE_CORE} {CHROMA_RULES} "
            "Pixel sprite sheet with exactly four equal cells in one horizontal row. "
            "Each cell contains the same cute brown chibi horse office worker, large and readable, sitting on a small blue stool, "
            "side view facing left, typing on a small keyboard, focused expression. "
            "The horse body must stay below the top third of the cell so it will not cover a CRT screen when layered in front. "
            "All four frames have the same scale and position with only subtle head, hand, and ear motion. "
            "No computer monitor, no desk, no room background, no speech bubble, no text."
        ),
    },
    {
        "name": "horse-gaming-sheet",
        "model": "gpt-image-2",
        "size": "1536x512",
        "quality": "medium",
        "prompt": (
            f"{STYLE_CORE} {CHROMA_RULES} "
            "Pixel sprite sheet with exactly four equal cells in one horizontal row. "
            "Each cell contains the same cute brown chibi horse slacking off, large and readable, sitting on a small blue stool, "
            "side view facing left, wearing a tiny headset, hands on keyboard/controller, mischievous expression. "
            "The horse body must stay below the top third of the cell so it will not cover a CRT screen when layered in front. "
            "All four frames have the same scale and position with subtle gaming hand movement and ear bounce. "
            "No monitor, no desk, no room background, no logos, no text."
        ),
    },
    {
        "name": "horse-sleep-sheet",
        "model": "gpt-image-2",
        "size": "1536x512",
        "quality": "medium",
        "prompt": (
            f"{STYLE_CORE} {CHROMA_RULES} "
            "Pixel sprite sheet with exactly four equal cells in one horizontal row. "
            "Each cell contains the same cute brown chibi horse sitting on a small blue stool, side view facing left, "
            "sleeping at a keyboard with closed eyes and a relaxed slumped pose, tiny pixel Z marks above the head. "
            "The horse body must stay below the top third of the cell so it will not cover a CRT screen when layered in front. "
            "All four frames have the same scale and position with subtle breathing and Z motion. "
            "No bed, no pillow, no monitor, no full desk, no room background, no readable text."
        ),
    },
    {
        "name": "cow-boss-sheet",
        "model": "gpt-image-2",
        "size": "1536x512",
        "quality": "medium",
        "prompt": (
            f"{STYLE_CORE} {CHROMA_RULES} "
            "Pixel sprite sheet with exactly four equal cells in one horizontal row. "
            "Each cell contains the same bossy chibi cow boss behind a small netbar service counter, "
            "wearing a dark vest and tiny tie, pointing and talking like an annoying company boss. "
            "Large readable silhouette, centered, consistent scale and position. "
            "All four frames show subtle mouth and arm movement. "
            "No room background, no speech bubble, no readable text."
        ),
    },
    {
        "name": "screen-content-atlas",
        "model": "gpt-image-2",
        "size": "1024x1024",
        "quality": "medium",
        "prompt": (
            f"{STYLE_CORE} "
            "Create a game-art reference atlas of ten tiny CRT screen contents arranged in a clean 5 by 2 grid. "
            "Each tile is a different pixel screen: SUB2API dashboard charts, API code terminal, MOBA minimap game, "
            "first-person shooter crosshair, video player, download progress, token leaderboard, card game, AFK idle screen, fishing game. "
            "This is only screen artwork, no CRT monitor frame, no room, no horses. "
            "Use high contrast black/green/amber CRT colors; avoid real logos and avoid readable brand names."
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
            with urllib.request.urlopen(req, timeout=240) as resp:
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
        time.sleep(3 * attempt)
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
        with urllib.request.urlopen(item["url"], timeout=180) as resp:
            out_path.write_bytes(resp.read())
        return
    raise RuntimeError(f"Unsupported image item: {item}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate v2 SUB2API horse arena assets with the ohlaoo image API.")
    parser.add_argument("--force", action="store_true", help="Regenerate files even when they already exist.")
    parser.add_argument("--only", nargs="*", help="Optional job names to generate.")
    args = parser.parse_args()

    if not API_KEY:
        raise SystemExit("Set OHLAOO_API_KEY before running.")

    selected = set(args.only or [])
    RAW.mkdir(parents=True, exist_ok=True)
    manifest = []
    for job in JOBS:
        if selected and job["name"] not in selected:
            continue
        out = RAW / f"{job['name']}.png"
        if out.exists() and out.stat().st_size > 0 and not args.force:
            print(f"skip existing {out}")
            manifest.append({"name": job["name"], "path": str(out.relative_to(ROOT)), "model": job["model"], "size": job["size"]})
            continue
        payload = {
            "model": job["model"],
            "prompt": job["prompt"],
            "size": job["size"],
            "quality": job.get("quality", "medium"),
            "output_format": "png",
        }
        print(f"generating {job['name']} with {job['model']}...")
        started = time.time()
        result = request_json(f"{BASE_URL}/v1/images/generations", payload)
        save_image_response(result, out)
        print(f"wrote {out} in {time.time() - started:.1f}s")
        manifest.append(
            {
                "name": job["name"],
                "path": str(out.relative_to(ROOT)),
                "model": job["model"],
                "size": job["size"],
                "quality": job.get("quality", "medium"),
                "prompt": job["prompt"],
            }
        )

    (RAW / "api-generation-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
