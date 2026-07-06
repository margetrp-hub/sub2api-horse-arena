from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageChops, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "assets" / "api-game-kit" / "raw"
FINAL = ROOT / "assets" / "api-game-kit" / "final"
PROC = ROOT / "assets" / "api-game-kit" / "processed-preview"

STATION_W = 220
STATION_H = 180
HORSE_W = 150
HORSE_H = 150
BOSS_W = 96
BOSS_H = 112
SCREEN_W = 78
SCREEN_H = 46
API_SCREEN_W = 54
API_SCREEN_H = 31


def remove_green_screen(src: Image.Image) -> Image.Image:
    img = src.convert("RGBA")
    pixels = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            green_score = g - max(r, b)
            is_key = g > 95 and green_score > 28 and g > r * 1.18 and g > b * 1.18
            if is_key:
                pixels[x, y] = (r, g, b, 0)
            elif g > 80 and green_score > 12:
                # Despill edges from imperfect API chroma backgrounds.
                pixels[x, y] = (r, min(g, max(r, b) + 8), b, a)
    return img


def alpha_bbox(img: Image.Image, min_alpha: int = 8) -> tuple[int, int, int, int]:
    alpha = img.getchannel("A")
    mask = alpha.point(lambda p: 255 if p >= min_alpha else 0)
    bbox = mask.getbbox()
    if not bbox:
        return (0, 0, img.width, img.height)
    return bbox


def fit_to_canvas(img: Image.Image, size: tuple[int, int], pad: int = 0, anchor_y: float = 0.92) -> Image.Image:
    crop = img.crop(alpha_bbox(img))
    target_w, target_h = size
    scale = min((target_w - pad * 2) / crop.width, (target_h - pad * 2) / crop.height)
    new_size = (max(1, int(crop.width * scale)), max(1, int(crop.height * scale)))
    resized = crop.resize(new_size, Image.Resampling.NEAREST)
    out = Image.new("RGBA", size, (0, 0, 0, 0))
    x = (target_w - new_size[0]) // 2
    y = int(target_h * anchor_y - new_size[1])
    y = max(pad, min(target_h - new_size[1] - pad, y))
    out.alpha_composite(resized, (x, y))
    return out


def largest_dark_rect(img: Image.Image) -> tuple[int, int, int, int]:
    rgba = img.convert("RGBA")
    pix = rgba.load()
    w, h = rgba.size
    min_x, min_y, max_x, max_y = w, h, 0, 0
    count = 0
    for y in range(0, int(h * 0.62)):
        for x in range(int(w * 0.18), int(w * 0.78)):
            r, g, b, a = pix[x, y]
            if a > 20 and r < 55 and g < 55 and b < 55:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
                count += 1
    if count < 300:
        return (50, 36, 78, 46)
    # Trim outline spill and keep a regular screen hole.
    x = min_x + 2
    y = min_y + 2
    width = max(24, max_x - min_x - 3)
    height = max(18, max_y - min_y - 3)
    return (x, y, width, height)


def punch_screen_hole(workstation: Image.Image) -> tuple[Image.Image, tuple[int, int, int, int]]:
    img = workstation.copy()
    # The API workstation consistently places the CRT screen in this normalized area.
    # Manual rect is more stable than dark-pixel detection because outlines are also dark.
    x, y, w, h = (87, 31, 54, 31)
    pix = img.load()
    for py in range(y, y + h):
        for px in range(x, x + w):
            if 0 <= px < img.width and 0 <= py < img.height:
                r, g, b, a = pix[px, py]
                if r < 75 and g < 75 and b < 75:
                    pix[px, py] = (r, g, b, 0)
    return img, (x, y, w, h)


def make_workstation() -> tuple[int, int, int, int]:
    raw = Image.open(RAW / "workstation-crt-empty.png")
    transparent = remove_green_screen(raw)
    station = fit_to_canvas(transparent, (STATION_W, STATION_H), pad=2, anchor_y=0.96)
    station, screen_rect = punch_screen_hole(station)
    station.save(FINAL / "workstation-crt-empty.png")
    return screen_rect


def cell_crop(raw: Image.Image, index: int, count: int = 4) -> Image.Image:
    cell_w = raw.width // count
    return raw.crop((index * cell_w, 0, (index + 1) * cell_w, raw.height))


def make_horse_sheet(name: str, source_indices: Iterable[int]) -> None:
    raw = Image.open(RAW / f"{name}.png")
    cells = []
    for index in source_indices:
        frame = remove_green_screen(cell_crop(raw, index))
        cells.append(fit_to_canvas(frame, (HORSE_W, HORSE_H), pad=2, anchor_y=0.98))
    while len(cells) < 4:
        cells.append(cells[len(cells) % len(cells)].copy())
    sheet = Image.new("RGBA", (HORSE_W * 4, HORSE_H), (0, 0, 0, 0))
    for i, frame in enumerate(cells[:4]):
        sheet.alpha_composite(frame, (i * HORSE_W, 0))
    out_name = name.replace("-sheet", "")
    sheet.save(FINAL / f"{out_name}-sheet.png")


def make_boss_sheet() -> None:
    raw = Image.open(RAW / "cow-boss-sheet.png")
    sheet = Image.new("RGBA", (BOSS_W * 4, BOSS_H), (0, 0, 0, 0))
    for i in range(4):
        frame = remove_green_screen(cell_crop(raw, i))
        frame = fit_to_canvas(frame, (BOSS_W, BOSS_H), pad=1, anchor_y=0.98)
        sheet.alpha_composite(frame, (i * BOSS_W, 0))
    sheet.save(FINAL / "cow-boss-sheet.png")


def make_hit_fx() -> None:
    sheet = Image.new("RGBA", (64 * 4, 64), (0, 0, 0, 0))
    for i in range(4):
        img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        radius = 9 + i * 6
        pts = [
            (32, 32 - radius - 10),
            (40, 32 - radius // 2),
            (32 + radius + 12, 32),
            (40, 38),
            (32, 32 + radius + 10),
            (24, 38),
            (32 - radius - 12, 32),
            (24, 26),
        ]
        draw.polygon(pts, fill=(255, 212, 72, max(90, 255 - i * 42)), outline=(214, 68, 52, 255))
        draw.text((29, 18), "!", fill=(24, 16, 22, 255))
        sheet.alpha_composite(img, (i * 64, 0))
    sheet.save(FINAL / "boss-hit-fx-sheet.png")


def draw_rect(draw: ImageDraw.ImageDraw, xy, fill, outline=None, width=1):
    draw.rectangle(xy, fill=fill, outline=outline, width=width)


def draw_line(draw: ImageDraw.ImageDraw, xy, fill, width=1):
    draw.line(xy, fill=fill, width=width)


def screen_frame(theme: str, frame: int) -> Image.Image:
    img = Image.new("RGB", (API_SCREEN_W, API_SCREEN_H), (5, 15, 17))
    draw = ImageDraw.Draw(img)
    w, h = img.size
    draw_rect(draw, (0, 0, w - 1, h - 1), (5, 15, 17), (21, 57, 54), 1)
    for y in range(2 + frame % 3, h, 5):
        draw_line(draw, (1, y, w - 2, y), (24, 54, 50), 1)

    if theme == "dashboard":
        for i, x in enumerate((5, 14, 23, 32, 41)):
            bar = 4 + ((frame + i) * 4) % 18
            draw_rect(draw, (x, h - 4 - bar, x + 4, h - 4), (72, 232, 134))
        draw_line(draw, (4, 23 - frame % 4, 48, 11 + frame % 8), (239, 198, 82), 1)
    elif theme == "api":
        lines = ["GET", "200", "TOK", "RUN"]
        for i in range(4):
            draw.text((4, 3 + i * 7), lines[(i + frame) % 4], fill=(72, 232, 134))
    elif theme == "moba":
        draw_rect(draw, (4, 4, 26, 26), (31, 92, 53), (92, 184, 81), 1)
        draw_line(draw, (5, 25, 25, 5), (239, 198, 82), 1)
        for i in range(5):
            x = 6 + ((frame * 4 + i * 7) % 20)
            y = 22 - ((frame * 2 + i * 4) % 17)
            draw_rect(draw, (x, y, x + 2, y + 2), (72, 232, 112) if i % 2 else (221, 76, 58))
    elif theme == "shooter":
        cx, cy = 27 + (frame % 3 - 1) * 2, 16
        draw_line(draw, (cx - 9, cy, cx + 9, cy), (84, 219, 139), 1)
        draw_line(draw, (cx, cy - 9, cx, cy + 9), (84, 219, 139), 1)
        if frame % 2 == 0:
            draw_rect(draw, (38, 10, 46, 16), (221, 76, 58))
    elif theme == "video":
        draw_rect(draw, (3, 3, 50, 24), (36, 68, 95))
        draw.polygon([(23, 10), (23, 18), (32, 14)], fill=(245, 232, 192))
        draw_rect(draw, (4, 27, 49, 29), (52, 42, 42))
        draw_rect(draw, (4, 27, 4 + (frame * 7) % 45, 29), (221, 76, 58))
    elif theme == "download":
        for i in range(4):
            draw_rect(draw, (4, 5 + i * 6, 49, 8 + i * 6), (34, 42, 42))
            draw_rect(draw, (4, 5 + i * 6, 4 + ((frame * 5 + i * 11) % 45), 8 + i * 6), (72, 232, 134))
    elif theme == "rank":
        for i, x in enumerate((10, 23, 36)):
            height = [21, 16, 12][i] + (frame + i) % 2
            draw_rect(draw, (x, 27 - height, x + 8, 27), [(239, 198, 82), (190, 205, 221), (218, 139, 86)][i])
    elif theme == "card":
        for i, x in enumerate((10, 22, 34)):
            c = (236, 226, 190) if (frame + i) % 2 else (185, 61, 69)
            draw_rect(draw, (x, 9 + (i % 2) * 2, x + 11, 24 + (i % 2) * 2), (24, 16, 22))
            draw_rect(draw, (x + 2, 11 + (i % 2) * 2, x + 9, 22 + (i % 2) * 2), c)
    elif theme == "afk":
        x = 4 + (frame * 5) % 26
        y = 6 + (frame * 3) % 12
        draw.text((x, y), "AFK", fill=(143, 120, 255))
    elif theme == "fishing":
        draw_rect(draw, (1, 16, 52, 29), (38, 104, 128))
        for x in range(-18 + frame * 3, 54, 12):
            draw_line(draw, (x, 23, x + 8, 21), (103, 194, 212), 1)
        draw_line(draw, (15, 5, 30, 20 + frame % 2), (239, 198, 82), 1)
        draw_rect(draw, (30, 21 + frame % 2, 33, 24 + frame % 2), (221, 76, 58))
    return img


def make_screen_gifs() -> None:
    themes = ["dashboard", "api", "moba", "shooter", "video", "download", "rank", "card", "afk", "fishing"]
    screens = FINAL / "screens"
    screens.mkdir(parents=True, exist_ok=True)
    for index, theme in enumerate(themes, start=1):
        frames = [screen_frame(theme, frame) for frame in range(8)]
        frames[0].save(
            screens / f"screen-{index:02d}-{theme}.gif",
            save_all=True,
            append_images=frames[1:],
            duration=140,
            loop=0,
            optimize=False,
        )


def make_background() -> None:
    bg = Image.open(RAW / "background-netbar-empty.png").convert("RGBA")
    bg = bg.resize((1280, 720), Image.Resampling.BICUBIC)
    bg.save(FINAL / "netbar-background-empty.png")


def main() -> None:
    FINAL.mkdir(parents=True, exist_ok=True)
    PROC.mkdir(parents=True, exist_ok=True)
    make_background()
    screen_rect = make_workstation()
    make_horse_sheet("horse-working-sheet", [1, 2, 1, 2])
    make_horse_sheet("horse-gaming-sheet", [0, 1, 2, 3])
    make_horse_sheet("horse-sleep-sheet", [0, 1, 2, 3])
    make_boss_sheet()
    make_hit_fx()
    make_screen_gifs()
    manifest = {
        "assetSource": "ohlaoo image API raw assets, locally chroma-keyed and normalized",
        "station": {"width": STATION_W, "height": STATION_H},
        "screenRect": {"x": screen_rect[0], "y": screen_rect[1], "width": screen_rect[2], "height": screen_rect[3]},
        "horse": {"width": HORSE_W, "height": HORSE_H, "frames": 4, "offsetX": 70, "offsetY": 32},
        "boss": {"width": BOSS_W, "height": BOSS_H, "frames": 4},
    }
    (FINAL / "asset-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
