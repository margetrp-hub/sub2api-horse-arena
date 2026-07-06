from __future__ import annotations

import json
from pathlib import Path

from collections import deque

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "assets" / "image-split-assets" / "raw"
FINAL = ROOT / "assets" / "image-split-assets" / "final"


def is_green_candidate(r: int, g: int, b: int, key: tuple[int, int, int]) -> bool:
    close_to_key = max(abs(r - key[0]), abs(g - key[1]), abs(b - key[2])) < 90
    green_dominant = g > 55 and g > r * 1.08 and g > b * 1.08
    lime_shadow = g > 80 and r > 45 and b < 90 and g > b * 1.35
    return close_to_key or green_dominant or lime_shadow


def sample_key(img: Image.Image) -> tuple[int, int, int]:
    rgba = img.convert("RGBA")
    pix = rgba.load()
    samples = []
    step = max(1, min(rgba.width, rgba.height) // 96)
    for x in range(0, rgba.width, step):
        samples.append(pix[x, 0][:3])
        samples.append(pix[x, rgba.height - 1][:3])
    for y in range(0, rgba.height, step):
        samples.append(pix[0, y][:3])
        samples.append(pix[rgba.width - 1, y][:3])
    return tuple(sorted(channel)[len(channel) // 2] for channel in zip(*samples))


def remove_green(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    pixels = rgba.load()
    key = sample_key(rgba)
    visited = bytearray(rgba.width * rgba.height)
    queue: deque[tuple[int, int]] = deque()

    def enqueue(x: int, y: int) -> None:
        if x < 0 or y < 0 or x >= rgba.width or y >= rgba.height:
            return
        index = y * rgba.width + x
        if visited[index]:
            return
        r, g, b, a = pixels[x, y]
        if a == 0 or is_green_candidate(r, g, b, key):
            visited[index] = 1
            queue.append((x, y))

    for x in range(rgba.width):
        enqueue(x, 0)
        enqueue(x, rgba.height - 1)
    for y in range(rgba.height):
        enqueue(0, y)
        enqueue(rgba.width - 1, y)

    while queue:
        x, y = queue.popleft()
        pixels[x, y] = (0, 0, 0, 0)
        enqueue(x + 1, y)
        enqueue(x - 1, y)
        enqueue(x, y + 1)
        enqueue(x, y - 1)

    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            green_score = g - max(r, b)
            if green_score > 10 and g > 55:
                pixels[x, y] = (r, min(g, max(r, b) + 2), b, a)
    return rgba


def alpha_bbox(img: Image.Image) -> tuple[int, int, int, int]:
    alpha = img.getchannel("A")
    mask = alpha.point(lambda p: 255 if p > 8 else 0)
    return mask.getbbox() or (0, 0, img.width, img.height)


def fit_canvas(img: Image.Image, size: tuple[int, int], anchor_y: float = 0.95) -> Image.Image:
    crop = img.crop(alpha_bbox(img))
    target_w, target_h = size
    scale = min(target_w / crop.width, target_h / crop.height)
    resized = crop.resize((max(1, int(crop.width * scale)), max(1, int(crop.height * scale))), Image.Resampling.NEAREST)
    out = Image.new("RGBA", size, (0, 0, 0, 0))
    x = (target_w - resized.width) // 2
    y = int(target_h * anchor_y - resized.height)
    y = max(0, min(target_h - resized.height, y))
    out.alpha_composite(resized, (x, y))
    return out


def harden_pixel(img: Image.Image, factor: int = 2) -> Image.Image:
    if factor <= 1:
        return img
    small = img.resize((max(1, img.width // factor), max(1, img.height // factor)), Image.Resampling.BOX)
    return small.resize(img.size, Image.Resampling.NEAREST)


def magenta_rect(img: Image.Image) -> tuple[int, int, int, int]:
    rgb = img.convert("RGBA")
    pix = rgb.load()
    min_x, min_y, max_x, max_y = rgb.width, rgb.height, -1, -1
    for y in range(rgb.height):
        for x in range(rgb.width):
            r, g, b, a = pix[x, y]
            if a > 0 and r > 180 and b > 150 and g < 90:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    if max_x < min_x or max_y < min_y:
        return (0, 0, 0, 0)
    return (min_x, min_y, max_x - min_x + 1, max_y - min_y + 1)


def punch_magenta(img: Image.Image, rect: tuple[int, int, int, int]) -> Image.Image:
    out = img.copy()
    pix = out.load()
    x, y, w, h = rect
    for py in range(y, y + h):
        for px in range(x, x + w):
            if 0 <= px < out.width and 0 <= py < out.height:
                r, g, b, a = pix[px, py]
                if a > 0 and r > 120 and b > 90 and g < 170:
                    pix[px, py] = (r, g, b, 0)
    return out


def process_background() -> None:
    src = Image.open(RAW / "empty-netbar-background-hard-pixel.png").convert("RGBA")
    out = src.resize((1536, 1024), Image.Resampling.BICUBIC)
    out.save(FINAL / "empty-netbar-background-hard-pixel.png")


def process_workstation() -> tuple[int, int, int, int]:
    src = Image.open(RAW / "single-crt-workstation-hard-pixel.png")
    transparent = harden_pixel(remove_green(src), 2)
    fitted = fit_canvas(transparent, (260, 210), anchor_y=0.98)
    screen = magenta_rect(fitted)
    punched = punch_magenta(fitted, screen)
    pix = punched.load()
    x, y, w, h = screen
    for py in range(y, y + h):
        for px in range(x, x + w):
            if 0 <= px < punched.width and 0 <= py < punched.height:
                r, g, b, a = pix[px, py]
                if a == 0:
                    pix[px, py] = (0, 0, 0, 0)
    punched.save(FINAL / "single-crt-workstation-hard-pixel.png")
    return screen


def process_horse_sheet() -> None:
    src = Image.open(RAW / "horse-working-sheet-hard-pixel.png")
    transparent = harden_pixel(remove_green_soft(src), 2)
    frames = []
    cell_w = transparent.width // 4
    for index in (0, 1, 2, 1):
        frame = transparent.crop((index * cell_w, 0, (index + 1) * cell_w, transparent.height))
        frame = frame.crop(alpha_bbox(frame))
        frames.append(fit_canvas(frame, (150, 120), anchor_y=0.98))
    sheet = Image.new("RGBA", (150 * 4, 120), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, (index * 150, 0))
    sheet.save(FINAL / "horse-working-sheet-hard-pixel.png")


def process_single_sprite(raw_name: str, out_name: str, size: tuple[int, int], anchor_y: float = 0.98) -> None:
    src = Image.open(RAW / raw_name)
    transparent = harden_pixel(remove_green_soft(src), 2)
    frame = transparent.crop(alpha_bbox(transparent))
    fit_canvas(frame, size, anchor_y=anchor_y).save(FINAL / out_name)


def remove_green_soft(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    pix = rgba.load()
    key = sample_key(rgba)
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pix[x, y]
            if a == 0:
                continue
            dist = max(abs(r - key[0]), abs(g - key[1]), abs(b - key[2]))
            green_score = g - max(r, b)
            if dist < 42 or (g > 95 and green_score > 28 and r < 185 and b < 150):
                pix[x, y] = (0, 0, 0, 0)
            elif green_score > 12 and g > 75:
                pix[x, y] = (r, min(g, max(r, b) + 4), b, a)
    return rgba


def main() -> None:
    FINAL.mkdir(parents=True, exist_ok=True)
    process_background()
    screen = process_workstation()
    process_horse_sheet()
    optional_sprites = [
        ("horse-gaming-single-hard-pixel.png", "horse-gaming-single-hard-pixel.png", (150, 120), 0.98),
        ("horse-sleep-single-hard-pixel.png", "horse-sleep-single-hard-pixel.png", (150, 120), 0.98),
        ("cow-boss-single-hard-pixel.png", "cow-boss-single-hard-pixel.png", (170, 145), 0.98),
    ]
    for raw_name, out_name, size, anchor in optional_sprites:
        if (RAW / raw_name).exists():
            process_single_sprite(raw_name, out_name, size, anchor)
    manifest = {
        "background": "empty-netbar-background-hard-pixel.png",
        "workstation": {
            "file": "single-crt-workstation-hard-pixel.png",
            "width": 260,
            "height": 210,
            "screenRect": {"x": screen[0], "y": screen[1], "width": screen[2], "height": screen[3]},
        },
        "horseWorking": {"file": "horse-working-sheet-hard-pixel.png", "frameWidth": 150, "frameHeight": 120, "frames": 4},
        "horseGaming": {"file": "horse-gaming-single-hard-pixel.png", "width": 150, "height": 120},
        "horseSleep": {"file": "horse-sleep-single-hard-pixel.png", "width": 150, "height": 120},
        "cowBoss": {"file": "cow-boss-single-hard-pixel.png", "width": 170, "height": 145},
    }
    (FINAL / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
