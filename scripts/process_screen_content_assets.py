from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "assets" / "station-prototype" / "raw"
OUT = ROOT / "public" / "assets" / "screen-real-v4"

SCREENS = [
    "dashboard",
    "api",
    "moba",
    "shooter",
    "video",
    "download",
    "rank",
    "card",
    "afk",
    "fishing",
]


def content_bounds(image: Image.Image) -> tuple[int, int, int, int]:
    rgb = np.asarray(image.convert("RGB"), dtype=np.int16)
    brightness = rgb.max(axis=2)
    row_activity = (brightness > 24).mean(axis=1)
    column_activity = (brightness > 24).mean(axis=0)
    rows = np.flatnonzero(row_activity > 0.025)
    columns = np.flatnonzero(column_activity > 0.025)
    if len(rows) == 0 or len(columns) == 0:
        return (0, 0, image.width, image.height)
    padding = 4
    return (
        max(0, int(columns[0]) - padding),
        max(0, int(rows[0]) - padding),
        min(image.width, int(columns[-1]) + padding + 1),
        min(image.height, int(rows[-1]) + padding + 1),
    )


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, str] = {}
    previews: list[tuple[str, Image.Image]] = []

    for name in SCREENS:
        source_path = RAW / f"screen-real-{name}-v4.png"
        if not source_path.exists():
            raise RuntimeError(f"Missing generated screen: {source_path}")
        source = Image.open(source_path).convert("RGB")
        bounds = content_bounds(source)
        cropped = source.crop(bounds)
        output = cropped.resize((320, 240), Image.Resampling.LANCZOS)
        brightness = 1.08 if name in {"shooter", "video", "card", "fishing"} else 1.18
        output = ImageEnhance.Brightness(output).enhance(brightness)
        output = ImageEnhance.Contrast(output).enhance(1.1)
        output = ImageEnhance.Color(output).enhance(1.08)
        output = output.filter(ImageFilter.UnsharpMask(radius=1, percent=135, threshold=2))
        output = output.resize((640, 480), Image.Resampling.NEAREST)
        output_path = OUT / f"{name}.png"
        output.save(output_path, optimize=True)
        webp_path = OUT / f"{name}.webp"
        output.save(webp_path, format="WEBP", lossless=True, method=6)
        manifest[name] = f"/assets/screen-real-v4/{name}.webp"
        previews.append((name, output.resize((320, 240), Image.Resampling.NEAREST)))
        print(f"{name}: {source.size} crop={bounds} -> {output.size}")

    sheet = Image.new("RGB", (960, 960), "#050608")
    draw = ImageDraw.Draw(sheet)
    for index, (name, preview) in enumerate(previews):
        column = index % 3
        row = index // 3
        x = column * 320
        y = row * 240
        sheet.paste(preview, (x, y))
        draw.rectangle((x + 4, y + 4, x + 122, y + 23), fill="#080b0e")
        draw.text((x + 9, y + 8), name.upper(), fill="#f3b43f")
    sheet.save(OUT / "contact-sheet.png", optimize=True)
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
