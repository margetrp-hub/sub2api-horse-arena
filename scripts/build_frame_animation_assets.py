from __future__ import annotations

from pathlib import Path
from math import cos, pi, sin
import random

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageSequence


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "frame-animation"
HORSE_SRC = ROOT / "assets" / "horse-motion-parts"
SCREEN_SRC = ROOT / "assets" / "reference-master" / "screens"
BOSS_SHEET = ROOT / "assets" / "reference-master" / "cow-boss-sheet.png"
HIT_SHEET = ROOT / "assets" / "reference-master" / "boss-hit-fx-sheet.png"

FRAME_COUNT = 12


SCREEN_THEMES = [
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


def composite_offset(src: Image.Image, dx: int = 0, dy: int = 0, alpha: float = 1.0) -> Image.Image:
    frame = Image.new("RGBA", src.size, (0, 0, 0, 0))
    layer = src.copy()
    if alpha < 1:
        a = layer.getchannel("A").point(lambda p: int(p * alpha))
        layer.putalpha(a)
    frame.alpha_composite(layer, (dx, dy))
    return frame


def save_frames_and_sheet(frames: list[Image.Image], frame_dir: Path, sheet_path: Path) -> None:
    frame_dir.mkdir(parents=True, exist_ok=True)
    width, height = frames[0].size
    sheet = Image.new("RGBA", (width * len(frames), height), (0, 0, 0, 0))
    for i, frame in enumerate(frames, start=1):
        frame.save(frame_dir / f"frame-{i:02d}.png")
        sheet.alpha_composite(frame, ((i - 1) * width, 0))
    sheet.save(sheet_path)


def draw_pixel_line(draw: ImageDraw.ImageDraw, start: tuple[int, int], end: tuple[int, int], fill: tuple[int, int, int, int], width: int = 1) -> None:
    draw.line((start, end), fill=fill, width=width)


def make_lamp_frames() -> None:
    frames: list[Image.Image] = []
    pulses = [34, 52, 44, 68, 38, 28, 58, 42, 74, 36, 48, 40]
    for i, pulse in enumerate(pulses):
        frame = Image.new("RGBA", (260, 92), (0, 0, 0, 0))
        draw = ImageDraw.Draw(frame, "RGBA")
        draw.rectangle((28, 12, 232, 24), fill=(255, 238, 164, 70 + pulse))
        draw.rectangle((44, 23, 216, 29), fill=(255, 248, 198, 34 + pulse))
        for y in range(32, 88, 7):
            alpha = max(0, 44 + pulse - y // 2)
            draw.rectangle((20 + (i % 2) * 2, y, 240 - (i % 3), y + 3), fill=(255, 216, 112, alpha))
        frames.append(frame)
    out_dir = OUT / "environment"
    save_frames_and_sheet(frames, out_dir / "lamp-glow", out_dir / "lamp-glow-sheet-12.png")


def make_fan_frames() -> None:
    frames: list[Image.Image] = []
    cx, cy = 88, 88
    for i in range(FRAME_COUNT):
        frame = Image.new("RGBA", (176, 176), (0, 0, 0, 0))
        draw = ImageDraw.Draw(frame, "RGBA")
        angle_offset = (i / FRAME_COUNT) * pi * 2
        for blade in range(4):
            angle = angle_offset + blade * pi / 2
            inner = 19
            outer = 74
            spread = 0.34
            pts = [
                (cx + int(cos(angle - spread) * inner), cy + int(sin(angle - spread) * inner)),
                (cx + int(cos(angle - spread * 0.25) * outer), cy + int(sin(angle - spread * 0.25) * outer)),
                (cx + int(cos(angle + spread * 0.25) * outer), cy + int(sin(angle + spread * 0.25) * outer)),
                (cx + int(cos(angle + spread) * inner), cy + int(sin(angle + spread) * inner)),
            ]
            draw.polygon(pts, fill=(26, 32, 30, 72))
            draw_pixel_line(
                draw,
                (cx, cy),
                (cx + int(cos(angle) * 78), cy + int(sin(angle) * 78)),
                (236, 224, 184, 34),
                width=2,
            )
        draw.ellipse((74, 74, 102, 102), fill=(232, 214, 170, 48))
        draw.ellipse((82, 82, 94, 94), fill=(42, 36, 30, 80))
        frames.append(frame)
    out_dir = OUT / "environment"
    save_frames_and_sheet(frames, out_dir / "fan-motion", out_dir / "fan-motion-sheet-12.png")


def make_sign_glint_frames() -> None:
    frames: list[Image.Image] = []
    for i in range(FRAME_COUNT):
        frame = Image.new("RGBA", (520, 112), (0, 0, 0, 0))
        draw = ImageDraw.Draw(frame, "RGBA")
        x = -90 + i * 55
        draw.polygon(
            [(x, 10), (x + 42, 10), (x + 132, 102), (x + 90, 102)],
            fill=(255, 248, 190, 38),
        )
        draw.rectangle((0, 96, 520, 101), fill=(255, 204, 86, 18 if i % 3 else 42))
        frames.append(frame)
    out_dir = OUT / "environment"
    save_frames_and_sheet(frames, out_dir / "sign-glint", out_dir / "sign-glint-sheet-12.png")


def make_door_strip_frames() -> None:
    frames: list[Image.Image] = []
    for i in range(FRAME_COUNT):
        frame = Image.new("RGBA", (190, 280), (0, 0, 0, 0))
        draw = ImageDraw.Draw(frame, "RGBA")
        for x in range(10, 181, 10):
            phase = (x // 10 + i) % 5
            alpha = 44 + phase * 18
            draw.rectangle((x, 4, x + 2, 268), fill=(62, 212, 238, alpha))
            for y in range((i * 8 + x) % 18, 270, 34):
                draw.rectangle((x - 1, y, x + 3, y + 8), fill=(132, 244, 255, alpha + 32))
        frames.append(frame)
    out_dir = OUT / "environment"
    save_frames_and_sheet(frames, out_dir / "door-strip", out_dir / "door-strip-sheet-12.png")


def make_dust_frames() -> None:
    rng = random.Random(1998)
    base_particles = [(rng.randrange(0, 512), rng.randrange(0, 288), rng.choice([1, 1, 2]), rng.randrange(18, 55)) for _ in range(88)]
    frames: list[Image.Image] = []
    for i in range(FRAME_COUNT):
        frame = Image.new("RGBA", (512, 288), (0, 0, 0, 0))
        draw = ImageDraw.Draw(frame, "RGBA")
        for x, y, size, alpha in base_particles:
            xx = (x + i * 2 + (y % 5)) % 512
            yy = (y + (i // 2)) % 288
            draw.rectangle((xx, yy, xx + size, yy + size), fill=(255, 230, 168, alpha))
        for puff in range(6):
            x = 96 + puff * 66 + (i % 3) * 2
            y = 232 - ((i + puff) % 4) * 3
            draw.rectangle((x, y, x + 18, y + 2), fill=(210, 190, 150, 18))
        frames.append(frame)
    out_dir = OUT / "environment"
    save_frames_and_sheet(frames, out_dir / "room-dust", out_dir / "room-dust-sheet-12.png")


def make_station_fx_frames() -> None:
    configs = {
        "working": {"colors": [(89, 231, 151, 150), (255, 218, 93, 120)], "speed": 1, "smoke": False},
        "overdrive": {"colors": [(255, 96, 64, 180), (255, 224, 92, 160), (255, 255, 255, 120)], "speed": 2, "smoke": True},
        "gaming": {"colors": [(84, 198, 255, 150), (255, 84, 190, 120), (255, 218, 93, 120)], "speed": 1, "smoke": False},
        "sleep": {"colors": [(226, 235, 255, 115), (143, 120, 255, 80)], "speed": 1, "smoke": False},
    }
    out_dir = OUT / "station-fx"
    for name, cfg in configs.items():
        frames: list[Image.Image] = []
        for i in range(FRAME_COUNT):
            frame = Image.new("RGBA", (128, 96), (0, 0, 0, 0))
            draw = ImageDraw.Draw(frame, "RGBA")
            if name == "sleep":
                for j in range(3):
                    x = 72 + j * 13 + ((i + j) % 2)
                    y = 16 + j * 10 - (i * 3 + j * 4) % 34
                    draw.ellipse((x, y, x + 9, y + 9), outline=cfg["colors"][0], width=2)
                    draw.rectangle((x + 3, y + 3, x + 5, y + 5), fill=cfg["colors"][1])
            else:
                for j in range(8 if name != "overdrive" else 15):
                    color = cfg["colors"][(j + i) % len(cfg["colors"])]
                    x = 14 + ((j * 17 + i * 5 * cfg["speed"]) % 96)
                    y = 50 + ((j * 11 + i * 3) % 30)
                    draw.rectangle((x, y, x + 3, y + 3), fill=color)
                bar_w = 28 + ((i * 7) % 70)
                draw.rectangle((14, 78, 14 + bar_w, 81), fill=cfg["colors"][0])
                if cfg["smoke"]:
                    for j in range(5):
                        x = 48 + j * 9 + (i % 2)
                        y = 54 - ((i * 4 + j * 7) % 30)
                        draw.rectangle((x, y, x + 6, y + 3), fill=(255, 225, 180, 58))
            frames.append(frame)
        save_frames_and_sheet(frames, out_dir / f"fx-{name}", out_dir / f"fx-{name}-sheet-12.png")


def make_environment_frames() -> None:
    make_lamp_frames()
    make_fan_frames()
    make_sign_glint_frames()
    make_door_strip_frames()
    make_dust_frames()
    make_station_fx_frames()


def make_horse_frames() -> None:
    out_dir = OUT / "horses"
    offsets = [
        (0, 0), (1, 0), (1, -1), (0, -1), (-1, -1), (-1, 0),
        (0, 0), (1, 1), (0, 1), (-1, 1), (0, 0), (1, 0),
    ]
    brightness = [1.00, 1.03, 1.05, 1.03, 1.00, 0.98, 1.00, 1.04, 1.02, 0.99, 1.00, 1.03]
    for src_path in sorted(HORSE_SRC.glob("station-*-horse-motion.png")):
        src = Image.open(src_path).convert("RGBA")
        frames: list[Image.Image] = []
        for i, (dx, dy) in enumerate(offsets):
            frame = composite_offset(src, dx=dx, dy=dy)
            frame = ImageEnhance.Brightness(frame).enhance(brightness[i])
            # A tiny hand-tap glint gives the frame sequence a deliberate arcade feel.
            draw = ImageDraw.Draw(frame, "RGBA")
            if i in {2, 3, 8}:
                draw.rectangle((int(src.width * 0.58), int(src.height * 0.39), int(src.width * 0.61), int(src.height * 0.40)), fill=(255, 220, 120, 48))
            frames.append(frame)
        stem = src_path.stem.replace("-horse-motion", "")
        save_frames_and_sheet(frames, out_dir / stem, out_dir / f"{stem}-horse-sheet.png")


def load_gif_frames(path: Path) -> list[Image.Image]:
    gif = Image.open(path)
    frames = [frame.convert("RGBA").resize((160, 96), Image.Resampling.NEAREST) for frame in ImageSequence.Iterator(gif)]
    if not frames:
        raise RuntimeError(f"no frames in {path}")
    while len(frames) < FRAME_COUNT:
        frames.extend([f.copy() for f in frames])
    return frames[:FRAME_COUNT]


def make_screen_frames() -> None:
    out_dir = OUT / "screens"
    for index, theme in enumerate(SCREEN_THEMES, start=1):
        src_path = SCREEN_SRC / f"screen-{index:02d}-{theme}.gif"
        base_frames = load_gif_frames(src_path)
        frames: list[Image.Image] = []
        for i, base in enumerate(base_frames):
            frame = ImageChops.offset(base, (i % 4) - 1, 0)
            draw = ImageDraw.Draw(frame, "RGBA")
            for y in range((i * 3) % 8, frame.height, 8):
                draw.rectangle((0, y, frame.width, y), fill=(255, 255, 255, 22))
            if theme in {"dashboard", "api", "rank", "download"}:
                draw.rectangle((8, frame.height - 8, 8 + (i + 1) * 11, frame.height - 5), fill=(73, 236, 150, 120))
            if theme in {"moba", "shooter", "fishing"}:
                draw.ellipse((frame.width - 28 - i, 10 + (i % 3), frame.width - 21 - i, 17 + (i % 3)), fill=(255, 217, 80, 140))
            frames.append(ImageEnhance.Brightness(frame).enhance(0.92 + (i % 3) * 0.05))
        save_frames_and_sheet(frames, out_dir / f"screen-{index:02d}-{theme}", out_dir / f"screen-{index:02d}-{theme}-sheet.png")


def extract_sheet_frames(path: Path, frame_count: int, frame_size: tuple[int, int]) -> list[Image.Image]:
    sheet = Image.open(path).convert("RGBA")
    frame_w, frame_h = frame_size
    return [sheet.crop((i * frame_w, 0, (i + 1) * frame_w, frame_h)) for i in range(frame_count)]


def make_boss_frames() -> None:
    out_dir = OUT / "boss"
    boss_base = extract_sheet_frames(BOSS_SHEET, 4, (168, 156))
    boss_order = [0, 1, 2, 1, 0, 1, 2, 3, 2, 1, 0, 3]
    boss_frames = []
    for i, src_i in enumerate(boss_order):
        frame = composite_offset(boss_base[src_i], dx=0, dy=-1 if i in {2, 3, 7} else 0)
        boss_frames.append(ImageEnhance.Brightness(frame).enhance(1.0 + (0.04 if i in {2, 7} else 0)))
    save_frames_and_sheet(boss_frames, out_dir / "cow-boss", out_dir / "cow-boss-sheet-12.png")

    hit_base = extract_sheet_frames(HIT_SHEET, 4, (72, 72))
    hit_order = [0, 1, 2, 3, 2, 1, 3, 2, 1, 0, 3, 0]
    hit_frames = []
    for i, src_i in enumerate(hit_order):
        alpha = 1.0 if i < 8 else 0.55
        hit_frames.append(composite_offset(hit_base[src_i], dx=(i % 3) - 1, dy=0, alpha=alpha))
    save_frames_and_sheet(hit_frames, out_dir / "boss-hit-fx", out_dir / "boss-hit-fx-sheet-12.png")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    make_horse_frames()
    make_screen_frames()
    make_boss_frames()
    make_environment_frames()
    print(f"wrote 12-frame animation assets to {OUT}")


if __name__ == "__main__":
    main()
