from __future__ import annotations

from pathlib import Path
import shutil

from PIL import Image, ImageChops, ImageDraw, ImageEnhance


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "reference-master"
SCREENS = OUT / "screens"

MASTER = ROOT / "art" / "full-design" / "sub2api-horse-netbar-full-design-v3-signs.png"
ATLAS = ROOT / "art" / "screens" / "crt-screen-content-atlas-v1.png"
BOSS = ROOT / "assets" / "generated-animation" / "cow-boss-spritesheet-v1.png"
HIT_FX = ROOT / "assets" / "generated-animation" / "boss-impact-fx-spritesheet-v1.png"


THEMES = [
    ("dashboard", 0),
    ("api", 1),
    ("moba", 3),
    ("shooter", 4),
    ("video", 5),
    ("download", 30),
    ("rank", 2),
    ("card", 34),
    ("afk", 35),
    ("fishing", 36),
]


def alpha_bbox(img: Image.Image, threshold: int = 8) -> tuple[int, int, int, int]:
    alpha = img.getchannel("A")
    mask = alpha.point(lambda p: 255 if p >= threshold else 0)
    return mask.getbbox() or (0, 0, img.width, img.height)


def fit_to_canvas(img: Image.Image, size: tuple[int, int], pad: int = 0) -> Image.Image:
    crop = img.crop(alpha_bbox(img))
    target_w, target_h = size
    scale = min((target_w - pad * 2) / crop.width, (target_h - pad * 2) / crop.height)
    new_size = (max(1, int(crop.width * scale)), max(1, int(crop.height * scale)))
    resized = crop.resize(new_size, Image.Resampling.LANCZOS)
    out = Image.new("RGBA", size, (0, 0, 0, 0))
    out.alpha_composite(resized, ((target_w - new_size[0]) // 2, target_h - new_size[1] - pad))
    return out


def crop_atlas_tile(atlas: Image.Image, tile_index: int) -> Image.Image:
    cols = 6
    rows = 8
    margin_x = 24
    margin_y = 22
    gap_x = 18
    gap_y = 18
    tile_w = (atlas.width - margin_x * 2 - gap_x * (cols - 1)) // cols
    tile_h = (atlas.height - margin_y * 2 - gap_y * (rows - 1)) // rows
    row = tile_index // cols
    col = tile_index % cols
    x = margin_x + col * (tile_w + gap_x)
    y = margin_y + row * (tile_h + gap_y)
    return atlas.crop((x, y, x + tile_w, y + tile_h))


def make_screen_gifs() -> None:
    atlas = Image.open(ATLAS).convert("RGB")
    SCREENS.mkdir(parents=True, exist_ok=True)
    for index, (theme, tile_index) in enumerate(THEMES, start=1):
        base = crop_atlas_tile(atlas, tile_index).resize((160, 96), Image.Resampling.BICUBIC)
        frames: list[Image.Image] = []
        for frame in range(8):
            shifted = ImageChops.offset(base, (frame % 3) - 1, 0)
            draw = ImageDraw.Draw(shifted, "RGBA")
            for y in range((frame * 2) % 6, shifted.height, 6):
                draw.rectangle((0, y, shifted.width, y + 1), fill=(255, 255, 255, 24))
            if theme in {"dashboard", "api", "rank", "download"}:
                pulse_w = 14 + frame * 9
                draw.rectangle((10, shifted.height - 10, min(shifted.width - 10, pulse_w), shifted.height - 7), fill=(69, 238, 143, 135))
            if theme in {"moba", "shooter", "fishing"}:
                draw.ellipse((shifted.width - 24 - frame * 2, 11, shifted.width - 18 - frame * 2, 17), fill=(255, 211, 70, 160))
            frames.append(ImageEnhance.Brightness(shifted).enhance(0.92 + (frame % 2) * 0.12))
        frames[0].save(
            SCREENS / f"screen-{index:02d}-{theme}.gif",
            save_all=True,
            append_images=frames[1:],
            duration=130,
            loop=0,
            optimize=False,
        )


def make_boss_sheet() -> None:
    source = Image.open(BOSS).convert("RGBA")
    frame_w = source.width // 4
    frame_h = source.height // 2
    out_frame = (168, 156)
    sheet = Image.new("RGBA", (out_frame[0] * 4, out_frame[1]), (0, 0, 0, 0))
    for i in range(4):
        frame = source.crop((i * frame_w, 0, (i + 1) * frame_w, frame_h))
        sheet.alpha_composite(fit_to_canvas(frame, out_frame, pad=0), (i * out_frame[0], 0))
    sheet.save(OUT / "cow-boss-sheet.png")


def make_hit_fx() -> None:
    source = Image.open(HIT_FX).convert("RGBA")
    frame_w = source.width // 3
    frame_h = source.height // 3
    out_frame = (72, 72)
    sheet = Image.new("RGBA", (out_frame[0] * 4, out_frame[1]), (0, 0, 0, 0))
    for i in range(4):
        src_i = [0, 1, 3, 4][i]
        sx = (src_i % 3) * frame_w
        sy = (src_i // 3) * frame_h
        frame = source.crop((sx, sy, sx + frame_w, sy + frame_h))
        sheet.alpha_composite(fit_to_canvas(frame, out_frame, pad=2), (i * out_frame[0], 0))
    sheet.save(OUT / "boss-hit-fx-sheet.png")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(MASTER, OUT / "netbar-master.png")
    make_screen_gifs()
    make_boss_sheet()
    make_hit_fx()
    print(f"wrote reference-master assets to {OUT}")


if __name__ == "__main__":
    main()
