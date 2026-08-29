from __future__ import annotations

import argparse
import base64
import json
import os
from pathlib import Path
import time
import urllib.error
import urllib.request
import uuid


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "station-prototype" / "raw"
BASE_URL = os.getenv("OHLAOO_BASE_URL", "https://ohlaoo.com").rstrip("/")
API_KEY = os.getenv("OHLAOO_API_KEY")


STYLE = (
    "Match the supplied OH! horse-netbar reference art direction: a polished Chinese indie browser mini-game, "
    "32-bit pixel art with crisp square pixels, chunky readable silhouettes, clean dark-brown outlines, "
    "warm fluorescent 1990s Chinese internet-cafe colors, worn beige plastic, dark wood and muted teal shadows. "
    "Use a fixed orthographic three-quarter arcade-game camera. No photorealism, no smooth digital painting, "
    "no vector art, no antialiasing, no blurry gradients, no cyberpunk neon overload, no watermark."
)

CHROMA = (
    "Place every asset on a perfectly flat solid #00ff00 chroma-key background. "
    "The background must be one uniform color with no floor, shadow, texture, gradient, reflection or light spill. "
    "Do not use #00ff00 anywhere in the asset. Keep generous clear padding between the subject and canvas edges."
)


JOBS = [
    {
        "name": "station-composite-master-v3",
        "size": "1024x1024",
        "reference": "assets/api-game-kit-v2/final/oh-haolema-master-fixed-top-row.png",
        "prompt": (
            "Use the supplied full OH! horse internet-cafe master image as the sole visual source of truth. "
            "Extract and reconstruct one complete representative playable workstation from that exact game world: "
            "one large cute brown horse worker in a white short-sleeve shirt and blue trousers, seated on the same "
            "blue padded swivel chair, typing at one dark worn wooden internet-cafe desk with one warm aged-beige "
            "1990s CRT monitor, beige tower, keyboard, wired mouse and mug. Keep the exact master-image character "
            "design, chunky proportions, dark brown outlines, palette, pixel density, three-quarter arcade camera, "
            "lighting direction and object scale. The horse must sit left-front of the CRT and face upper-right toward "
            "the monitor, matching the approved master. Keep the powered-on 4:3 CRT screen completely visible above "
            "the horse's hands and unobstructed by the horse's head or ears. Show the whole desk, chair, horse and "
            "computer as one clean isolated game-object composition centered on a plain near-black neutral preview "
            "backdrop with generous padding. This is an asset design reference, not a room and not a webpage. "
            "Do not brighten or modernize the palette. Do not change the horse species, outfit, chair color, desk "
            "material, CRT silhouette or camera angle. No additional characters, no UI panels, no labels, no text, "
            "no frame grid, no smooth illustration, no vector art, no 3D render, no watermark. Crisp square pixels only."
        ),
    },
    {
        "name": "screen-atlas-work-master-v4",
        "size": "1536x1024",
        "prompt": (
            "Match the approved OH! horse-netbar art direction: a dark, polished Chinese indie browser mini-game with "
            "high-detail 32-bit pixel art, crisp square pixels, restrained 1990s CRT colors, muted teal shadows, warm amber "
            "highlights, strong dark outlines and dense but readable interface detail. "
            "Create a production screen-content atlas with exactly six equal square cells in a strict 3 columns by 2 rows grid. "
            "Inside every square cell, center one full-width 4:3 screen image with uniform near-black letterbox bands above and "
            "below it. Separate cells with perfectly straight 6-pixel near-black gutters. Every panel is a front-facing flat computer "
            "display image, full bleed inside its cell, designed to be perspective-mapped into an existing CRT glass opening. "
            "Top row, left to right: (1) a convincing AI token operations dashboard with metric cards, line charts, request logs "
            "and green service indicators; (2) a believable dark developer code editor and API terminal with file tree, syntax "
            "highlighting, request console and status bar; (3) a detailed fantasy MOBA match with lanes, river, towers, minions, "
            "heroes, health bars, minimap and ability HUD. Bottom row, left to right: (4) a detailed first-person tactical shooter "
            "in a dusty desert corridor with crosshair, weapon, health, armor, ammo and kill feed; (5) a live video-stream window "
            "with a visible presenter, chat column, viewer count, timeline and audio meters; (6) a believable model-download/file "
            "manager window with folders, package rows, segmented progress bar, transfer details and buttons. Make each scene read "
            "like genuine software or gameplay at small size, rendered as polished high-detail 32-bit pixel art with crisp square "
            "pixels, restrained CRT colors and strong focal hierarchy. Tiny interface glyphs and pseudo-text are welcome, but no "
            "real logos or copyrighted UI marks. Critical: screen pixels only. No CRT bezel, monitor body, desk, keyboard, horse, "
            "chair, room, reflections, perspective tilt, labels outside the panels, frame numbers, watermark, smooth painting or 3D."
        ),
    },
    {
        "name": "screen-atlas-idle-master-v4",
        "size": "1024x1024",
        "prompt": (
            "Match the approved OH! horse-netbar art direction: a dark, polished Chinese indie browser mini-game with "
            "high-detail 32-bit pixel art, crisp square pixels, restrained 1990s CRT colors, muted teal shadows, warm amber "
            "highlights, strong dark outlines and dense but readable interface detail. "
            "Create a production screen-content atlas with exactly four equal square cells in a strict 2 columns by 2 rows grid. "
            "Inside every square cell, center one full-width 4:3 screen image with uniform near-black letterbox bands above and "
            "below it. Separate cells with perfectly straight 6-pixel near-black gutters. Every panel is a front-facing flat computer "
            "display image, full bleed inside its cell, designed to be perspective-mapped into an existing CRT glass opening. "
            "Top row, left to right: (1) a convincing token leaderboard application with ranked user rows, avatars, medals, usage "
            "bars and totals; (2) an authentic late-1990s desktop solitaire game with green felt, deck, foundations, tableau and "
            "window chrome. Bottom row, left to right: (3) a nostalgic CRT screen saver with star field, bouncing colorful logo, "
            "desktop taskbar and tiny clock; (4) a detailed cozy pixel fishing game with sky, mountains, lake, pier, fisher, line, "
            "bobber, fish and compact game HUD. Make each scene read like genuine software or gameplay at small size, rendered as "
            "polished high-detail 32-bit pixel art with crisp square pixels and restrained CRT colors. Tiny pseudo-text is welcome, "
            "but no real logos. Critical: screen pixels only. No CRT bezel, monitor body, desk, keyboard, horse, chair, room, "
            "reflections, perspective tilt, labels outside panels, frame numbers, watermark, smooth painting or 3D."
        ),
    },
    {
        "name": "workstation-empty-master-v3-chroma",
        "size": "1024x1024",
        "reference": "station-composite-master-v3.png",
        "prompt": (
            f"{CHROMA} Use the input station composite as an exact asset reference, not loose inspiration. "
            "Remove only the horse and blue chair, reconstructing the small occluded desk edge naturally. Keep the "
            "exact same dark worn wooden desk, aged beige 1990s CRT, beige tower, keyboard, wired mouse, mug, camera "
            "angle, dimensions, palette, lighting, outlines and crisp square-pixel density. Preserve their exact relative "
            "positions so the matching horse-and-chair sprite can be layered back in front. Replace only the CRT glass "
            "interior with one perfectly flat solid #ff00ff quadrilateral bounded by the original thick beige bezel. "
            "The magenta glass must have no image, text, glare, scanline, reflection or shading. No horse, no chair, no "
            "room, no extra prop, no labels, no borders, no watermark. Do not redesign, brighten, modernize or rotate anything."
        ),
    },
    {
        "name": "horse-working-master-v3-8frame-chroma",
        "size": "2048x1024",
        "reference": "station-composite-master-v3.png",
        "prompt": (
            f"{CHROMA} Use the input as the exact identity sheet for the brown horse and blue chair. Create one "
            "production pixel-animation sheet with exactly eight equal cells in a strict 4 columns by 2 rows grid. "
            "Every cell contains the same large cute brown horse in the same white short-sleeve shirt, blue trousers "
            "and brown shoes, seated on the same blue padded swivel chair, viewed from the same three-quarter rear-side "
            "camera and facing upper-right. Keep identical silhouette, proportions, pixel density, palette, scale, "
            "bottom-center anchor and chair position in all eight cells. Animate a restrained typing loop through "
            "alternating forelegs, a tiny head bob, one ear twitch and a small tail sway. The motion must read when "
            "played but never change the overall bounding box. Horse and chair only: no monitor, tower, desk, keyboard, "
            "mouse, mug, floor, room, text, frame numbers, cell borders, shadows or watermark."
        ),
    },
    {
        "name": "horse-gaming-master-v3-8frame-chroma",
        "size": "2048x1024",
        "reference": "station-composite-master-v3.png",
        "prompt": (
            f"{CHROMA} Use the input as the exact identity sheet for the brown horse and blue chair. Create one "
            "production pixel-animation sheet with exactly eight equal cells in a strict 4 columns by 2 rows grid. "
            "Every cell contains the same large cute brown horse in the same white shirt, blue trousers and brown shoes, "
            "seated on the same blue padded swivel chair, viewed from the same three-quarter rear-side camera and facing "
            "upper-right. Add compact dark-blue headphones that fit the established design. Keep identical identity, "
            "silhouette, proportions, pixel density, palette, scale, bottom-center anchor and chair position in all cells. "
            "Animate a readable excited gaming loop: quicker alternating forelegs, slight forward lean, ear twitch and "
            "tail flick, without changing the overall bounding box. Horse and chair only: no monitor, tower, desk, "
            "keyboard, mouse, room, text, frame numbers, cell borders, shadows or watermark."
        ),
    },
    {
        "name": "horse-sleeping-master-v3-8frame-chroma",
        "size": "2048x1024",
        "reference": "station-composite-master-v3.png",
        "prompt": (
            f"{CHROMA} Use the input as the exact identity sheet for the brown horse and blue chair. Create one "
            "production pixel-animation sheet with exactly eight equal cells in a strict 4 columns by 2 rows grid. "
            "Every cell contains the same large cute brown horse in the same white shirt, blue trousers and brown shoes, "
            "seated on the same blue padded swivel chair, viewed from the same three-quarter rear-side camera and facing "
            "upper-right. Keep identical identity, silhouette, proportions, pixel density, palette, scale, bottom-center "
            "anchor and chair position in all cells. Animate a slow dozing loop with eyelids lowering, a gentle breathing "
            "bob, one drooping ear and a tiny tail twitch. Keep the horse upright and compact so it never rises into the "
            "off-canvas CRT screen area. Horse and chair only: no monitor, tower, desk, keyboard, mouse, sleep symbols, "
            "room, text, frame numbers, cell borders, shadows or watermark."
        ),
    },
    {
        "name": "arena-empty-room-master-v3",
        "size": "1536x1152",
        "reference": "assets/style-v3/reference/arena-game-area-master.png",
        "prompt": (
            "Edit the supplied 4:3 OH! horse internet-cafe game-area reference while preserving its exact 4:3 framing, dark, "
            "detailed Chinese indie pixel-game style, camera, architecture, palette and lighting. Remove all ten "
            "horses, all chairs, all desks, all computers, all loose workstation props, the cow boss and every UI "
            "overlay. Reconstruct the occluded floor and wall naturally. Preserve the dark blue tiled floor, dark "
            "green and brown walls, back counter, stocked shelves, wooden door, drink refrigerator, plants, wall fan, "
            "clock, hanging lamp and glowing OH! sign in their original positions. Leave a large clean open floor area "
            "for two rows of five separately layered workstations. No leaderboard, no text additions, no new furniture, "
            "no perspective change, no brighter beige room, no modern decor, no smooth illustration, no 3D render, "
            "no watermark. Crisp square pixels and dense moody detail matching the input exactly."
        ),
    },
    {
        "name": "arena-empty-room-master-v3-clean",
        "size": "1536x1152",
        "reference": "arena-empty-room-master-v3.png",
        "prompt": (
            "Make one surgical cleanup to this finished 4:3 pixel-art internet-cafe background. Remove the cropped "
            "leaderboard medal panel and pinned notice-board fragment intruding at the extreme upper-right edge. "
            "Reconstruct that small area as the same dark green-brown paneled wall and continue the existing back-counter "
            "architecture naturally to the right edge. Keep absolutely everything else pixel-for-pixel in composition: "
            "the OH! sign, refrigerator, plant, door, fan, clock, shelves, cans, hanging lamp, empty counter, right plant, "
            "dark blue tiled floor, lighting, 4:3 camera, palette, texture and pixel density. Do not add characters, desks, "
            "computers, UI, signs, text, props or decoration. No crop, no zoom, no perspective or brightness change, no watermark."
        ),
    },
    {
        "name": "station-composite-reference",
        "size": "1024x640",
        "prompt": (
            f"{STYLE} Create one production design reference for a single playable workstation vertical slice. "
            "Show one large cute brown chibi horse office worker seated on a blue padded swivel chair, "
            "wearing a white short-sleeve shirt and blue trousers, typing at one wooden desk. "
            "The workstation has one beige 1990s CRT monitor, beige computer tower, keyboard, wired mouse and a mug. "
            "The horse is seen from a three-quarter rear-side view and faces the monitor. "
            "The horse and computer must use the same scale and perspective as the supplied ten-workstation reference. "
            "The CRT screen is powered on and fully visible above the horse's hands; the horse head and ears must not cover it. "
            "The screen displays a readable abstract token dashboard with tiny bars and charts, but no brand names or text. "
            "Present it as a clean isolated game-object composition on a dim neutral pixel-art preview backdrop, "
            "not as a full room, not as a webpage, and not as a sprite sheet."
        ),
    },
    {
        "name": "workstation-empty-chroma",
        "size": "1024x1024",
        "reference": "station-composite-reference.png",
        "prompt": (
            f"{STYLE} {CHROMA} Use the input image as the exact character-scale, perspective, palette and pixel-density reference. "
            "Remove the horse and chair completely, then create one isolated empty workstation sprite matching that input. "
            "Include a wooden internet-cafe desk, beige CRT monitor, beige tower, keyboard, wired mouse and one mug. "
            "No horse, no chair, no person, no room background. Leave clear open space in front of the keyboard for a horse sprite. "
            "Critical screen rule: the CRT glass interior is one perfectly flat solid #ff00ff 4:3 rectangle with no image, "
            "text, glare, reflection or shading; keep the thick beige CRT bezel around it."
        ),
    },
    {
        "name": "horse-working-8frame-chroma",
        "size": "2048x1024",
        "reference": "station-composite-reference.png",
        "prompt": (
            f"{STYLE} {CHROMA} Use the input image as the exact identity, outfit, proportions, palette, perspective and pixel-density reference. "
            "Extract that same brown horse worker and blue chair, then create one production-ready pixel animation sprite sheet with exactly eight equal cells "
            "in a clean 4 columns by 2 rows grid. Every cell contains the exact same cute brown chibi horse worker "
            "from the approved composite, seated on the same blue padded swivel chair, wearing the same white shirt and blue trousers. "
            "Three-quarter rear-side view facing upper-right toward an off-canvas CRT monitor. "
            "All eight frames must keep identical character identity, proportions, scale, anchor point and chair position. "
            "Animate only a subtle typing loop: alternating forelegs, one-pixel head bob, tiny ear twitch and tail movement. "
            "Keep the upper third of every cell clear so the horse cannot cover the monitor screen when layered. "
            "No computer, no monitor, no desk, no keyboard, no room, no labels, no frame numbers, no dividing borders."
        ),
    },
    {
        "name": "horse-gaming-8frame-chroma",
        "size": "2048x1024",
        "reference": "station-composite-reference.png",
        "prompt": (
            f"{STYLE} {CHROMA} Use the input image as the exact identity, outfit, proportions, chair, palette, perspective and pixel-density reference. "
            "Create one production-ready pixel animation sprite sheet with exactly eight equal cells in a clean 4 columns by 2 rows layout. "
            "Every cell contains that same brown horse worker seated on the same blue swivel chair, wearing the same white shirt and blue trousers, "
            "now visibly gaming with chunky dark-blue headphones: one foreleg works an off-canvas mouse and the other taps an off-canvas keyboard. "
            "Animate a readable excited gaming loop with alternating forelegs, focused forward lean, ear twitch and tail flick. "
            "Keep identity, scale, chair position and bottom-center anchor consistent in every frame. Face upper-right. "
            "No computer, no monitor, no desk, no keyboard, no room, no labels, no frame numbers and no dividing borders."
        ),
    },
    {
        "name": "horse-sleeping-8frame-chroma",
        "size": "2048x1024",
        "reference": "station-composite-reference.png",
        "prompt": (
            f"{STYLE} {CHROMA} Use the input image as the exact identity, outfit, proportions, chair, palette, perspective and pixel-density reference. "
            "Create one production-ready pixel animation sprite sheet with exactly eight equal cells in a clean 4 columns by 2 rows layout. "
            "Every cell contains that same brown horse worker seated on the same blue swivel chair, wearing the same white shirt and blue trousers, "
            "dozing at work with head lowered slightly and forelegs relaxed in front. Animate a readable slow breathing loop, eyelid change, ear droop and tail twitch. "
            "Keep the horse upright enough that the off-canvas CRT remains visible; no giant sleep symbols. "
            "Keep identity, scale, chair position and bottom-center anchor consistent in every frame. Face upper-right. "
            "No computer, no monitor, no desk, no keyboard, no room, no labels, no frame numbers and no dividing borders."
        ),
    },
    {
        "name": "cow-boss-8frame-chroma",
        "size": "2048x1024",
        "reference": "assets/api-game-kit-v2/final/oh-haolema-master-fixed-top-row.png",
        "prompt": (
            f"{STYLE} {CHROMA} Use the input image as the exact reference for the cute black-and-white cow boss behind the back counter. "
            "Create one production-ready pixel animation sprite sheet with exactly eight equal cells in a clean 4 columns by 2 rows layout. "
            "Every cell contains the same waist-up cow boss facing forward, wearing the same black suit, black sunglasses and chunky gold chain. "
            "Animate an overbearing company boss talking to workers: mouth changes, head bob, one hoof pointing forward, one hoof thumping the counter, and a brief recoil pose for being clicked. "
            "Keep identity, proportions, scale and bottom-center anchor consistent in every frame. "
            "No counter, no shelf, no cash register, no room, no other characters, no text, no labels, no frame numbers and no dividing borders."
        ),
    },
]

SCREEN_SCENES = {
    "dashboard": "a convincing AI token operations dashboard with metric cards, line charts, request logs and green service indicators",
    "api": "a believable dark developer code editor and API terminal with file tree, syntax highlighting, request console and status bar",
    "moba": "a detailed fantasy MOBA match with lanes, river, towers, minions, heroes, health bars, minimap and ability HUD",
    "shooter": "a detailed first-person tactical shooter in a dusty desert corridor with crosshair, weapon, health, armor, ammo and kill feed",
    "video": "a live video-stream window with a visible presenter, chat column, viewer count, timeline and audio meters",
    "download": "a believable model-download and file-manager window with folders, package rows, segmented progress bar, transfer details and buttons",
    "rank": "a convincing token leaderboard application with ranked user rows, avatars, medals, usage bars and totals",
    "card": "an authentic late-1990s desktop solitaire game with green felt, deck, foundations, tableau and window chrome",
    "afk": "a nostalgic CRT screen saver with star field, a bouncing colorful logo, desktop taskbar and tiny clock",
    "fishing": "a detailed cozy pixel fishing game with sky, mountains, lake, pier, fisher, line, bobber, fish and compact game HUD",
}

SCREEN_PROMPT = (
    "Create one front-facing flat computer display image for the approved OH! horse-netbar game. "
    "The actual screen content must be a centered full-width 4:3 rectangle inside this square output, with uniform "
    "near-black letterbox bands above and below. Render polished high-detail 32-bit pixel art with crisp square pixels, "
    "a believable late-1990s CRT software/game appearance, restrained dark teal shadows, warm amber highlights and "
    "dense but readable interface hierarchy. It must look like genuine software or gameplay at small size rather than "
    "an abstract diagram. Tiny interface glyphs and pseudo-text are welcome, but no real logos. Screen pixels only: "
    "no CRT bezel, monitor body, desk, keyboard, horse, chair, room, reflection, perspective tilt, watermark or 3D render. "
)

JOBS.extend(
    {
        "name": f"screen-real-{name}-v4",
        "size": "1024x1024",
        "prompt": f"{SCREEN_PROMPT} Scene: {description}.",
    }
    for name, description in SCREEN_SCENES.items()
)


def request_json(url: str, payload: dict) -> dict:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}
    last_error: Exception | None = None
    for attempt in range(1, 4):
        request = urllib.request.Request(url, data=body, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(request, timeout=300) as response:
                return json.loads(response.read().decode("utf-8"))
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
        time.sleep(attempt * 3)
    raise RuntimeError(f"Image API failed: {last_error}")


def request_edit(url: str, payload: dict, reference: Path) -> dict:
    boundary = f"----ohlaoo-{uuid.uuid4().hex}"
    body = bytearray()

    def add_field(name: str, value: str) -> None:
        body.extend(f"--{boundary}\r\n".encode())
        body.extend(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode())
        body.extend(value.encode("utf-8"))
        body.extend(b"\r\n")

    for name, value in payload.items():
        add_field(name, str(value))
    body.extend(f"--{boundary}\r\n".encode())
    body.extend(
        f'Content-Disposition: form-data; name="image"; filename="{reference.name}"\r\n'.encode()
    )
    body.extend(b"Content-Type: image/png\r\n\r\n")
    body.extend(reference.read_bytes())
    body.extend(b"\r\n")
    body.extend(f"--{boundary}--\r\n".encode())

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": f"multipart/form-data; boundary={boundary}",
    }
    last_error: Exception | None = None
    for attempt in range(1, 4):
        request = urllib.request.Request(url, data=bytes(body), headers=headers, method="POST")
        try:
            with urllib.request.urlopen(request, timeout=360) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            last_error = RuntimeError(f"HTTP {exc.code}: {detail}")
            if exc.code not in {408, 409, 429, 500, 502, 503, 504} or attempt == 3:
                raise last_error from exc
        except Exception as exc:
            last_error = exc
            if attempt == 3:
                raise
        print(f"retrying image edit API error ({attempt}/3)...")
        time.sleep(attempt * 3)
    raise RuntimeError(f"Image edit API failed: {last_error}")


def save_image(result: dict, path: Path) -> None:
    data = result.get("data") or []
    if not data:
        raise RuntimeError(f"No image data in response: {result}")
    image = data[0]
    if image.get("b64_json"):
        path.write_bytes(base64.b64decode(image["b64_json"]))
        return
    if image.get("url"):
        with urllib.request.urlopen(image["url"], timeout=180) as response:
            path.write_bytes(response.read())
        return
    raise RuntimeError(f"Unsupported image response: {image}")


def request_streamed_image(url: str, payload: dict, path: Path) -> None:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}
    request = urllib.request.Request(url, data=body, headers=headers, method="POST")
    with urllib.request.urlopen(request, timeout=360) as response:
        for raw_line in response:
            line = raw_line.decode("utf-8", errors="replace").strip()
            if not line.startswith("data:"):
                continue
            text = line[5:].strip()
            if not text or text == "[DONE]":
                continue
            event = json.loads(text)
            if event.get("object") != "image.generation.result":
                continue
            save_image(event, path)
            return
    raise RuntimeError("Stream ended without image.generation.result.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate one layered OH! horse workstation prototype kit.")
    parser.add_argument("--only", nargs="*", help="Generate only named jobs.")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--quality", default="medium")
    parser.add_argument("--stream", action="store_true")
    args = parser.parse_args()

    if not API_KEY:
        raise SystemExit("Set OHLAOO_API_KEY before running.")

    selected = set(args.only or [])
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = []
    for job in JOBS:
        if selected and job["name"] not in selected:
            continue
        output = OUT / f"{job['name']}.png"
        if output.exists() and output.stat().st_size > 0 and not args.force:
            print(f"skip existing {output}")
        else:
            payload = {
                "model": "gpt-image-2",
                "prompt": job["prompt"],
                "size": job["size"],
                "quality": args.quality,
                "output_format": "png",
            }
            if args.stream:
                payload["stream"] = True
                payload["partial_images"] = 1
            print(f"generating {job['name']}...")
            started = time.time()
            reference_name = job.get("reference")
            if reference_name:
                reference = OUT / reference_name
                if not reference.exists():
                    reference = ROOT / reference_name
                if not reference.exists():
                    raise RuntimeError(f"Missing reference image: {reference}")
                result = request_edit(f"{BASE_URL}/v1/images/edits", payload, reference)
                save_image(result, output)
            elif args.stream:
                request_streamed_image(f"{BASE_URL}/v1/images/generations", payload, output)
            else:
                result = request_json(f"{BASE_URL}/v1/images/generations", payload)
                save_image(result, output)
            print(f"wrote {output} in {time.time() - started:.1f}s")
        manifest.append({**job, "path": str(output.relative_to(ROOT)), "quality": args.quality})

    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
