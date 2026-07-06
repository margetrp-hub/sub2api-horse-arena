from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageSequence


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "assets" / "image-master-v3" / "raw"
FINAL = ROOT / "assets" / "image-master-v3" / "final"
SCREEN_SRC = ROOT / "assets" / "reference-master" / "screens"

FRAME_COUNT = 4
STATION_FRAME = (320, 260)
BOSS_FRAME = (260, 156)
WORLD = (1536, 864)


def alpha_bbox(img: Image.Image, threshold: int = 8) -> tuple[int, int, int, int]:
    alpha = img.getchannel("A")
    mask = alpha.point(lambda p: 255 if p >= threshold else 0)
    return mask.getbbox() or (0, 0, img.width, img.height)


def remove_green(img: Image.Image) -> Image.Image:
    out = img.convert("RGBA")
    pix = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = pix[x, y]
            if a == 0:
                continue
            green_score = g - max(r, b)
            if g > 115 and green_score > 24 and g > r * 1.10 and g > b * 1.08:
                pix[x, y] = (r, g, b, 0)
            elif g > 105 and green_score > 10:
                pix[x, y] = (r, min(g, max(r, b) + 10), b, a)
    return out


def magenta_bbox(img: Image.Image) -> tuple[int, int, int, int]:
    rgba = img.convert("RGBA")
    pix = rgba.load()
    xs: list[int] = []
    ys: list[int] = []
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pix[x, y]
            if a > 0 and r > 170 and b > 135 and g < 115 and r > g * 1.5 and b > g * 1.3:
                xs.append(x)
                ys.append(y)
    if not xs:
        return (0, 0, 1, 1)
    return (min(xs), min(ys), max(xs) + 1, max(ys) + 1)


def punch_magenta(img: Image.Image) -> tuple[Image.Image, tuple[int, int, int, int]]:
    out = img.convert("RGBA")
    bbox = magenta_bbox(out)
    pix = out.load()
    x0, y0, x1, y1 = bbox
    for y in range(max(0, y0 - 1), min(out.height, y1 + 1)):
        for x in range(max(0, x0 - 1), min(out.width, x1 + 1)):
            r, g, b, a = pix[x, y]
            if a > 0 and r > 135 and b > 105 and g < 135 and r > g * 1.2 and b > g * 1.05:
                pix[x, y] = (r, g, b, 0)
    return out, bbox


def fit_canvas(img: Image.Image, size: tuple[int, int], anchor_y: float = 0.94) -> tuple[Image.Image, tuple[int, int]]:
    crop_box = alpha_bbox(img)
    crop = img.crop(crop_box)
    tw, th = size
    scale = min(tw / crop.width, th / crop.height)
    resized = crop.resize((max(1, int(crop.width * scale)), max(1, int(crop.height * scale))), Image.Resampling.NEAREST)
    out = Image.new("RGBA", size, (0, 0, 0, 0))
    x = (tw - resized.width) // 2
    y = int(th * anchor_y - resized.height)
    y = max(0, min(th - resized.height, y))
    out.alpha_composite(resized, (x, y))
    return out, (x - int(crop_box[0] * scale), y - int(crop_box[1] * scale))


def transform_rect(rect: tuple[int, int, int, int], offset: tuple[int, int], source_size: tuple[int, int], final_size: tuple[int, int], crop_box: tuple[int, int, int, int]) -> tuple[int, int, int, int]:
    crop_w = crop_box[2] - crop_box[0]
    crop_h = crop_box[3] - crop_box[1]
    scale = min(final_size[0] / crop_w, final_size[1] / crop_h)
    x0, y0, x1, y1 = rect
    ox, oy = offset
    return (
        int(round(x0 * scale + ox)),
        int(round(y0 * scale + oy)),
        max(1, int(round((x1 - x0) * scale))),
        max(1, int(round((y1 - y0) * scale))),
    )


def process_station_sheet(name: str) -> dict:
    src = Image.open(RAW / f"station-{name}-sheet-v3.png").convert("RGBA")
    frame_w = src.width // FRAME_COUNT
    frames: list[Image.Image] = []
    rects: list[tuple[int, int, int, int]] = []
    for i in range(FRAME_COUNT):
        frame = src.crop((i * frame_w, 0, (i + 1) * frame_w, src.height))
        frame = remove_green(frame)
        punched, magenta = punch_magenta(frame)
        crop_box = alpha_bbox(punched)
        fitted, offset = fit_canvas(punched, STATION_FRAME)
        rects.append(transform_rect(magenta, offset, frame.size, STATION_FRAME, crop_box))
        frames.append(fitted)

    sheet = Image.new("RGBA", (STATION_FRAME[0] * FRAME_COUNT, STATION_FRAME[1]), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        sheet.alpha_composite(frame, (i * STATION_FRAME[0], 0))
    out = FINAL / f"station-{name}-sheet.png"
    sheet.save(out)

    # Use the median-ish first frame rect; all frames are intentionally kept close by the prompt.
    x = round(sum(r[0] for r in rects) / len(rects))
    y = round(sum(r[1] for r in rects) / len(rects))
    w = round(sum(r[2] for r in rects) / len(rects))
    h = round(sum(r[3] for r in rects) / len(rects))
    return {"name": name, "sheet": str(out.relative_to(ROOT)), "frame": STATION_FRAME, "frames": FRAME_COUNT, "screen": {"x": x, "y": y, "w": w, "h": h}, "rects": rects}


def process_boss() -> dict:
    src = Image.open(RAW / "cow-boss-counter-sheet-v3.png").convert("RGBA")
    frame_w = src.width // FRAME_COUNT
    frames: list[Image.Image] = []
    for i in range(FRAME_COUNT):
        frame = src.crop((i * frame_w, 0, (i + 1) * frame_w, src.height))
        frame = remove_green(frame)
        fitted, _ = fit_canvas(frame, BOSS_FRAME, anchor_y=0.98)
        frames.append(ImageEnhance.Contrast(fitted).enhance(1.04))
    sheet = Image.new("RGBA", (BOSS_FRAME[0] * FRAME_COUNT, BOSS_FRAME[1]), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        sheet.alpha_composite(frame, (i * BOSS_FRAME[0], 0))
    out = FINAL / "cow-boss-counter-sheet.png"
    sheet.save(out)
    return {"sheet": str(out.relative_to(ROOT)), "frame": BOSS_FRAME, "frames": FRAME_COUNT}


def crop_screen_to_fit(img: Image.Image, target: tuple[int, int]) -> Image.Image:
    aspect = target[0] / target[1]
    w, h = img.size
    current = w / h
    if current > aspect:
        nw = int(h * aspect)
        left = (w - nw) // 2
        img = img.crop((left, 0, left + nw, h))
    else:
        nh = int(w / aspect)
        top = (h - nh) // 2
        img = img.crop((0, top, w, top + nh))
    return img.resize(target, Image.Resampling.NEAREST)


def build_screens(screen_size: tuple[int, int]) -> list[dict]:
    out_dir = FINAL / "screens"
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest: list[dict] = []
    for source in sorted(SCREEN_SRC.glob("screen-*.gif")):
        image = Image.open(source)
        frames: list[Image.Image] = []
        durations: list[int] = []
        for frame in ImageSequence.Iterator(image):
            resized = crop_screen_to_fit(frame.convert("RGBA"), screen_size).convert("P", palette=Image.Palette.ADAPTIVE)
            frames.append(resized)
            durations.append(frame.info.get("duration", 130))
        if not frames:
            continue
        out = out_dir / source.name
        frames[0].save(out, save_all=True, append_images=frames[1:], duration=durations, loop=0, optimize=False)
        manifest.append({"file": str(out.relative_to(ROOT)), "size": screen_size})
    return manifest


def process_background() -> dict:
    bg = Image.open(RAW / "background-empty-v3.png").convert("RGBA")
    bg = bg.resize(WORLD, Image.Resampling.BICUBIC)
    bg = ImageEnhance.Color(bg).enhance(0.92)
    bg = ImageEnhance.Contrast(bg).enhance(1.04)
    out = FINAL / "background-empty-v3.png"
    bg.save(out)
    return {"file": str(out.relative_to(ROOT)), "size": WORLD}


def main() -> None:
    FINAL.mkdir(parents=True, exist_ok=True)
    stations = [process_station_sheet(name) for name in ("working", "gaming", "sleep")]
    screen_size = (stations[0]["screen"]["w"], stations[0]["screen"]["h"])
    manifest = {
        "source": "image-master-v3 raw assets generated with the Image API, chroma keyed and normalized locally",
        "background": process_background(),
        "stations": stations,
        "boss": process_boss(),
        "screens": build_screens(screen_size),
    }
    (FINAL / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
