from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "api-game-kit" / "final"
RAW_V2 = ROOT / "assets" / "api-game-kit-v2" / "raw"
OUT = ROOT / "assets" / "api-layered-scene"
TMP = ROOT / "tmp"

WORLD_W = 2048
WORLD_H = 1152

STATION_W = 268
STATION_H = 220
HORSE_W = 178
HORSE_H = 178
HORSE_FRAMES = 12
BOSS_W = 168
BOSS_H = 156

# Source manifest screen hole in the normalized workstation asset.
SRC_SCREEN = (87, 31, 54, 31)
SRC_STATION = (220, 180)
SCREEN_SCALE_X = STATION_W / SRC_STATION[0]
SCREEN_SCALE_Y = STATION_H / SRC_STATION[1]

SCREEN_RECT = {
    "x": round(SRC_SCREEN[0] * SCREEN_SCALE_X),
    "y": round(SRC_SCREEN[1] * SCREEN_SCALE_Y),
    "w": round(SRC_SCREEN[2] * SCREEN_SCALE_X),
    "h": round(SRC_SCREEN[3] * SCREEN_SCALE_Y),
}


def open_rgba(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def alpha_bbox(img: Image.Image, threshold: int = 8) -> tuple[int, int, int, int]:
    alpha = img.getchannel("A")
    mask = alpha.point(lambda p: 255 if p >= threshold else 0)
    return mask.getbbox() or (0, 0, img.width, img.height)


def remove_green_screen(img: Image.Image) -> Image.Image:
    out = img.convert("RGBA")
    pix = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = pix[x, y]
            if a == 0:
                continue
            green_score = g - max(r, b)
            if g > 115 and green_score > 24 and g > r * 1.12 and g > b * 1.12:
                pix[x, y] = (r, g, b, 0)
            elif g > 95 and green_score > 10:
                pix[x, y] = (r, min(g, max(r, b) + 10), b, a)
    return out


def fit_to_canvas(img: Image.Image, size: tuple[int, int], anchor_y: float = 0.96, pad: int = 0) -> Image.Image:
    crop = img.crop(alpha_bbox(img))
    target_w, target_h = size
    scale = min((target_w - pad * 2) / crop.width, (target_h - pad * 2) / crop.height)
    resized = crop.resize((max(1, int(crop.width * scale)), max(1, int(crop.height * scale))), Image.Resampling.NEAREST)
    out = Image.new("RGBA", size, (0, 0, 0, 0))
    x = (target_w - resized.width) // 2
    y = int(target_h * anchor_y - resized.height)
    y = max(pad, min(target_h - resized.height - pad, y))
    out.alpha_composite(resized, (x, y))
    return out


def pixelize(img: Image.Image, low_size: tuple[int, int], colors: int = 96) -> Image.Image:
    low = img.convert("RGBA").resize(low_size, Image.Resampling.BICUBIC)
    alpha = low.getchannel("A")
    quantized = low.convert("RGB").quantize(colors=colors, method=Image.Quantize.MEDIANCUT).convert("RGBA")
    quantized.putalpha(alpha)
    return quantized.resize(img.size, Image.Resampling.NEAREST)


def tint(img: Image.Image, color: tuple[int, int, int], amount: float) -> Image.Image:
    base = img.convert("RGBA")
    overlay = Image.new("RGBA", base.size, (*color, 0))
    pix = overlay.load()
    alpha = base.getchannel("A")
    for y in range(base.height):
        for x in range(base.width):
            a = alpha.getpixel((x, y))
            if a:
                pix[x, y] = (*color, int(a * amount))
    return Image.alpha_composite(base, overlay)


def crop_sheet_frame(sheet: Image.Image, frame: int, frames: int = 4) -> Image.Image:
    cell_w = sheet.width // frames
    return sheet.crop((frame * cell_w, 0, (frame + 1) * cell_w, sheet.height))


def make_workstation_layers() -> dict:
    station = open_rgba(SRC / "workstation-crt-empty.png").resize((STATION_W, STATION_H), Image.Resampling.NEAREST)
    station = pixelize(station, (134, 110), colors=72)

    base = station.copy()
    draw = ImageDraw.Draw(base)
    sx, sy, sw, sh = SCREEN_RECT["x"], SCREEN_RECT["y"], SCREEN_RECT["w"], SCREEN_RECT["h"]
    draw.rectangle((sx - 1, sy - 1, sx + sw + 1, sy + sh + 1), fill=(0, 0, 0, 0))

    frame = Image.new("RGBA", station.size, (0, 0, 0, 0))
    frame.alpha_composite(station)
    pix = frame.load()
    for y in range(frame.height):
        for x in range(frame.width):
            if not (sx - 10 <= x <= sx + sw + 10 and sy - 10 <= y <= sy + sh + 12):
                pix[x, y] = (0, 0, 0, 0)
            elif sx + 2 <= x <= sx + sw - 2 and sy + 2 <= y <= sy + sh - 2:
                r, g, b, a = pix[x, y]
                if a and r < 72 and g < 72 and b < 72:
                    pix[x, y] = (0, 0, 0, 0)

    base.save(OUT / "workstation-base.png")
    frame.save(OUT / "workstation-screen-frame.png")
    return {"station": {"w": STATION_W, "h": STATION_H}, "screen": SCREEN_RECT}


def make_station_variants() -> None:
    base = open_rgba(OUT / "workstation-base.png")
    frame = open_rgba(OUT / "workstation-screen-frame.png")
    variants = [
        ("01", (0, 0, 0), 0.00),
        ("02", (88, 58, 24), 0.08),
        ("03", (20, 88, 102), 0.07),
        ("04", (130, 36, 42), 0.06),
        ("05", (36, 72, 130), 0.06),
        ("06", (110, 80, 25), 0.07),
        ("07", (64, 118, 56), 0.06),
        ("08", (88, 55, 120), 0.06),
        ("09", (90, 90, 90), 0.06),
        ("10", (28, 118, 92), 0.06),
    ]
    for suffix, color, amount in variants:
        tint(base, color, amount).save(OUT / f"workstation-{suffix}-base.png")
        tint(frame, color, amount * 0.55).save(OUT / f"workstation-{suffix}-screen-frame.png")


def make_horse_sheets() -> None:
    sources = {
        "working": OUT / "raw" / "horse-working-strict.png",
        "overdrive": OUT / "raw" / "horse-working-strict.png",
        "gaming": OUT / "raw" / "horse-gaming-strict.png",
        "sleep": OUT / "raw" / "horse-sleep-strict.png",
    }
    fallbacks = {
        "working": SRC / "horse-working-sheet.png",
        "overdrive": SRC / "horse-working-sheet.png",
        "gaming": SRC / "horse-gaming-sheet.png",
        "sleep": SRC / "horse-sleep-sheet.png",
    }
    for name, path in sources.items():
        if not path.exists():
            path = fallbacks[name]
        sheet = open_rgba(path)
        source_frames = []
        frame_indices = [1, 2, 3, 1] if "strict" in path.name else [0, 1, 2, 3]
        for i in frame_indices:
            raw_frame = crop_sheet_frame(sheet, i)
            if "strict" in path.name:
                raw_frame = remove_green_screen(raw_frame)
            frame = fit_to_canvas(raw_frame, (HORSE_W, HORSE_H), anchor_y=0.99, pad=2)
            frame = pixelize(frame, (89, 89), colors=72)
            if name == "overdrive":
                frame = ImageEnhance.Brightness(frame).enhance(1.08)
                frame = ImageEnhance.Color(frame).enhance(1.12)
            source_frames.append(frame)
        out = Image.new("RGBA", (HORSE_W * HORSE_FRAMES, HORSE_H), (0, 0, 0, 0))
        for i in range(HORSE_FRAMES):
            out.alpha_composite(source_frames[i % len(source_frames)], (i * HORSE_W, 0))
        out.save(OUT / f"horse-{name}-sheet.png")


def make_screen_gifs() -> None:
    screen_dir = OUT / "screens"
    screen_dir.mkdir(parents=True, exist_ok=True)
    source_dir = SRC / "screens"
    for source in source_dir.glob("screen-*.gif"):
        img = Image.open(source)
        frames = []
        try:
            i = 0
            while True:
                img.seek(i)
                frame = img.convert("RGB").resize((SCREEN_RECT["w"], SCREEN_RECT["h"]), Image.Resampling.NEAREST)
                frame = pixelize(frame.convert("RGBA"), (max(1, SCREEN_RECT["w"] // 2), max(1, SCREEN_RECT["h"] // 2)), colors=24).convert("RGB")
                frames.append(frame)
                i += 1
        except EOFError:
            pass
        if frames:
            frames[0].save(screen_dir / source.name, save_all=True, append_images=frames[1:], duration=130, loop=0, optimize=False)


def make_boss_sheet() -> None:
    sheet = open_rgba(SRC / "cow-boss-sheet.png")
    source_frames = []
    for i in range(4):
        frame = fit_to_canvas(crop_sheet_frame(sheet, i), (BOSS_W, BOSS_H), anchor_y=0.99, pad=1)
        source_frames.append(pixelize(frame, (84, 78), colors=72))
    out = Image.new("RGBA", (BOSS_W * HORSE_FRAMES, BOSS_H), (0, 0, 0, 0))
    for i in range(HORSE_FRAMES):
        out.alpha_composite(source_frames[i % len(source_frames)], (i * BOSS_W, 0))
    out.save(OUT / "cow-boss-sheet.png")


def draw_preview() -> None:
    bg = open_rgba(OUT / "netbar-background-pixel.png")
    base = open_rgba(OUT / "workstation-base.png")
    frame = open_rgba(OUT / "workstation-screen-frame.png")
    horse_work = open_rgba(OUT / "horse-working-sheet.png").crop((0, 0, HORSE_W, HORSE_H))
    horse_game = open_rgba(OUT / "horse-gaming-sheet.png").crop((0, 0, HORSE_W, HORSE_H))
    horse_sleep = open_rgba(OUT / "horse-sleep-sheet.png").crop((0, 0, HORSE_W, HORSE_H))
    horses = [horse_work, horse_work, horse_game, horse_game, horse_game, horse_work, horse_work, horse_game, horse_sleep, horse_sleep]
    positions = station_positions()
    for i, pos in enumerate(positions):
        bg.alpha_composite(base, (pos["x"], pos["y"]))
        sx = pos["x"] + SCREEN_RECT["x"]
        sy = pos["y"] + SCREEN_RECT["y"]
        ImageDraw.Draw(bg).rectangle((sx, sy, sx + SCREEN_RECT["w"], sy + SCREEN_RECT["h"]), fill=(18, 52, 48, 255))
        bg.alpha_composite(frame, (pos["x"], pos["y"]))
        hx = pos["x"] + pos["horseDx"]
        hy = pos["y"] + pos["horseDy"]
        bg.alpha_composite(horses[i], (hx, hy))
    bg.save(TMP / "api-layered-scene-preview.png")


def station_positions() -> list[dict]:
    back_y = 470
    front_y = 755
    xs = [90, 465, 840, 1215, 1590]
    positions = []
    for row, y in (("back", back_y), ("front", front_y)):
        for x in xs:
            positions.append({
                "x": x,
                "y": y,
                "w": STATION_W,
                "h": STATION_H,
                "row": row,
                "screen": {
                    "x": x + SCREEN_RECT["x"],
                    "y": y + SCREEN_RECT["y"],
                    "w": SCREEN_RECT["w"],
                    "h": SCREEN_RECT["h"],
                },
                "horse": {
                    "x": x + 88,
                    "y": y + 80,
                    "w": HORSE_W,
                    "h": HORSE_H,
                },
                "horseDx": 88,
                "horseDy": 80,
                "label": {"x": x + 88, "y": y + 188},
                "meter": {"x": x + 66, "y": y + 218},
            })
    return positions


def write_manifest(meta: dict) -> None:
    manifest = {
        "source": "ohlaoo image API assets, normalized into deterministic game layers",
        "world": {"w": WORLD_W, "h": WORLD_H},
        **meta,
        "horse": {"w": HORSE_W, "h": HORSE_H, "frames": HORSE_FRAMES},
        "boss": {"w": BOSS_W, "h": BOSS_H, "frames": HORSE_FRAMES, "x": 1176, "y": 286},
        "stations": station_positions(),
    }
    (OUT / "layered-scene-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


def make_background() -> None:
    source = RAW_V2 / "background-netbar-empty.png"
    if not source.exists():
        source = SRC / "netbar-background-empty.png"
    bg = open_rgba(source).resize((WORLD_W, WORLD_H), Image.Resampling.BICUBIC)
    bg = pixelize(bg, (512, 288), colors=96)
    bg.save(OUT / "netbar-background-pixel.png")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    TMP.mkdir(parents=True, exist_ok=True)
    make_background()
    meta = make_workstation_layers()
    make_station_variants()
    make_horse_sheets()
    make_boss_sheet()
    make_screen_gifs()
    write_manifest(meta)
    draw_preview()
    print(json.dumps({"out": str(OUT), "preview": str(TMP / "api-layered-scene-preview.png"), **meta}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
