from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageEnhance, ImageSequence


ROOT = Path(__file__).resolve().parents[1]
SPLIT = ROOT / "assets" / "image-split-assets" / "final"
REFERENCE_SCREENS = ROOT / "assets" / "reference-master" / "screens"
OUT = ROOT / "assets" / "image-layered" / "generated"
SCREEN_OUT = OUT / "screens"

HORSE_SIZE = (150, 120)
SCREEN_SIZE = (45, 42)


def crop_to_aspect(img: Image.Image, aspect: float) -> Image.Image:
    width, height = img.size
    current = width / height
    if abs(current - aspect) < 0.02:
        return img
    if current > aspect:
        new_width = max(1, int(height * aspect))
        left = (width - new_width) // 2
        return img.crop((left, 0, left + new_width, height))
    new_height = max(1, int(width / aspect))
    top = (height - new_height) // 2
    return img.crop((0, top, width, top + new_height))


def transparent_offset(src: Image.Image, dx: int, dy: int, brightness: float = 1.0) -> Image.Image:
    canvas = Image.new("RGBA", HORSE_SIZE, (0, 0, 0, 0))
    frame = src.convert("RGBA")
    if brightness != 1.0:
        frame = ImageEnhance.Brightness(frame).enhance(brightness)
    canvas.alpha_composite(frame, (dx, dy))
    return canvas


def save_sheet(frames: list[Image.Image], out_path: Path) -> None:
    sheet = Image.new("RGBA", (HORSE_SIZE[0] * len(frames), HORSE_SIZE[1]), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, (HORSE_SIZE[0] * index, 0))
    sheet.save(out_path)


def build_horse_sheets() -> None:
    working = Image.open(SPLIT / "horse-working-sheet-hard-pixel.png").convert("RGBA")
    working.save(OUT / "horse-working-sheet.png")

    gaming = Image.open(SPLIT / "horse-gaming-single-hard-pixel.png").convert("RGBA")
    save_sheet(
        [
            transparent_offset(gaming, 0, 0, 1.00),
            transparent_offset(gaming, 1, -1, 1.05),
            transparent_offset(gaming, 0, 0, 1.02),
            transparent_offset(gaming, -1, 1, 0.98),
        ],
        OUT / "horse-gaming-sheet.png",
    )

    sleep = Image.open(SPLIT / "horse-sleep-single-hard-pixel.png").convert("RGBA")
    save_sheet(
        [
            transparent_offset(sleep, 0, 0, 1.00),
            transparent_offset(sleep, 0, 1, 0.98),
            transparent_offset(sleep, 1, 1, 0.96),
            transparent_offset(sleep, 0, 0, 1.00),
        ],
        OUT / "horse-sleep-sheet.png",
    )


def build_boss_sheet() -> None:
    boss = Image.open(SPLIT / "cow-boss-single-hard-pixel.png").convert("RGBA")
    size = boss.size
    frames = []
    for dx, dy, brightness in [(0, 0, 1.00), (1, -1, 1.04), (0, 0, 1.02), (-1, 1, 0.98)]:
        canvas = Image.new("RGBA", size, (0, 0, 0, 0))
        frame = boss
        if brightness != 1.0:
            frame = ImageEnhance.Brightness(boss).enhance(brightness)
        canvas.alpha_composite(frame, (dx, dy))
        frames.append(canvas)
    sheet = Image.new("RGBA", (size[0] * len(frames), size[1]), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, (index * size[0], 0))
    sheet.save(OUT / "cow-boss-sheet.png")


def build_screen_gifs() -> list[dict]:
    SCREEN_OUT.mkdir(parents=True, exist_ok=True)
    aspect = SCREEN_SIZE[0] / SCREEN_SIZE[1]
    manifest: list[dict] = []
    for source in sorted(REFERENCE_SCREENS.glob("screen-*.gif")):
        image = Image.open(source)
        frames = []
        durations = []
        for frame in ImageSequence.Iterator(image):
            rgba = frame.convert("RGBA")
            cropped = crop_to_aspect(rgba, aspect)
            resized = cropped.resize(SCREEN_SIZE, Image.Resampling.NEAREST).convert("P", palette=Image.Palette.ADAPTIVE)
            frames.append(resized)
            durations.append(frame.info.get("duration", 130))
        if not frames:
            continue
        out_path = SCREEN_OUT / source.name
        frames[0].save(
            out_path,
            save_all=True,
            append_images=frames[1:],
            duration=durations,
            loop=0,
            optimize=False,
        )
        manifest.append({"source": str(source.relative_to(ROOT)), "file": str(out_path.relative_to(ROOT)), "size": SCREEN_SIZE})
    return manifest


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    build_horse_sheets()
    build_boss_sheet()
    screens = build_screen_gifs()
    manifest = {
        "source": "Image API-generated sprites normalized for image-layered.html",
        "horseFrame": {"width": HORSE_SIZE[0], "height": HORSE_SIZE[1], "frames": 4},
        "bossFrame": {"width": 170, "height": 145, "frames": 4},
        "screen": {"width": SCREEN_SIZE[0], "height": SCREEN_SIZE[1]},
        "screens": screens,
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
