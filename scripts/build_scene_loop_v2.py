from __future__ import annotations

import math
from pathlib import Path
from random import Random

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "video"
OUT.mkdir(parents=True, exist_ok=True)

WIDTH = 1024
HEIGHT = 576
FPS = 12
FRAME_COUNT = 72


def load_master() -> Image.Image:
    image = Image.open(ROOT / "assets" / "reference-master" / "netbar-master.png").convert("RGBA")
    image = image.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
    image = ImageEnhance.Color(image).enhance(0.95)
    image = ImageEnhance.Contrast(image).enhance(1.04)
    image = ImageEnhance.Brightness(image).enhance(0.94)
    return image


def make_soft_mask(size: tuple[int, int], shape: str = "ellipse") -> Image.Image:
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    if shape == "rect":
        draw.rounded_rectangle((2, 2, size[0] - 3, size[1] - 3), radius=max(3, min(size) // 8), fill=210)
    else:
        draw.ellipse((2, 2, size[0] - 3, size[1] - 3), fill=210)
    return mask.filter(ImageFilter.GaussianBlur(1.1))


def paste_shifted(base: Image.Image, source: Image.Image, box: tuple[int, int, int, int], dx: int, dy: int, shape: str = "ellipse") -> None:
    x1, y1, x2, y2 = box
    if x2 <= x1 or y2 <= y1:
        return
    patch = source.crop(box)
    mask = make_soft_mask(patch.size, shape)
    base.paste(patch, (x1 + dx, y1 + dy), mask)


def draw_screen_overlay(frame: Image.Image, box: tuple[int, int, int, int], index: int, t: float, phase: float) -> None:
    x1, y1, x2, y2 = box
    w = x2 - x1
    h = y2 - y1
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    draw.rectangle((0, 0, w, h), fill=(0, 18, 15, 14))
    for yy in range(0, h, 3):
        draw.line((0, yy, w, yy), fill=(160, 255, 210, 22))

    rng = Random(index * 9001)
    color_a = [(80, 230, 190, 120), (80, 180, 255, 120), (255, 214, 80, 120), (255, 96, 88, 110)][index % 4]
    color_b = [(40, 120, 100, 100), (40, 86, 140, 90), (140, 100, 30, 90), (120, 50, 50, 90)][index % 4]

    if index in (0, 6):
        points = []
        for n in range(8):
            px = int(6 + n * (w - 12) / 7)
            py = int(h - 8 - (math.sin(t * 2.2 + n * 0.8 + index) * 0.5 + 0.5) * (h - 18))
            points.append((px, py))
            draw.rectangle((px - 1, py, px + 1, h - 7), fill=color_b)
        draw.line(points, fill=color_a, width=1)
    elif index in (1, 5):
        for row in range(6):
            y = 7 + row * 7
            offset = int((t * 18 + row * 9) % (w + 30)) - 30
            left = max(6, offset)
            right = min(w - 6, offset + rng.randint(24, 52))
            if right > left:
                draw.rectangle((left, y, right, y + 1), fill=color_a)
            draw.rectangle((6, y + 3, 6 + rng.randint(24, max(25, w - 16)), y + 3), fill=color_b)
    elif index == 2:
        draw.rectangle((8, 7, w - 9, h - 8), outline=(73, 190, 92, 42), width=1)
        for n in range(10):
            px = int(10 + ((n * 19 + t * 18) % max(1, w - 20)))
            py = int(12 + ((n * 11 + math.sin(t + n) * 10) % max(1, h - 24)))
            draw.ellipse((px - 1, py - 1, px + 1, py + 1), fill=(88, 230, 112, 88))
        draw.line((w // 2, h // 2, w // 2 + int(math.sin(t) * 18), h // 2 + int(math.cos(t * 1.4) * 12)), fill=(255, 96, 80, 88), width=1)
    elif index == 3:
        cx = w // 2 + int(math.sin(t * 1.7) * 9)
        cy = h // 2 + int(math.cos(t * 1.4) * 7)
        draw.line((cx - 14, cy, cx + 14, cy), fill=(255, 222, 90, 110), width=1)
        draw.line((cx, cy - 11, cx, cy + 11), fill=(255, 222, 90, 110), width=1)
        draw.rectangle((8, h - 10, 8 + int((0.5 + 0.5 * math.sin(t * 2.3)) * (w - 18)), h - 8), fill=(72, 210, 180, 90))
    elif index == 4:
        draw.rectangle((7, 7, w - 8, h - 15), outline=(230, 80, 72, 54), width=1)
        draw.polygon(((w // 2 - 5, h // 2 - 7), (w // 2 - 5, h // 2 + 7), (w // 2 + 8, h // 2)), fill=(255, 250, 205, 64))
        draw.rectangle((9, h - 10, w - 10, h - 7), fill=(32, 44, 54, 180))
        draw.rectangle((9, h - 10, 9 + int((t * 12 % 1) * (w - 19)), h - 8), fill=(255, 92, 70, 88))
    elif index == 7:
        for n in range(4):
            px = 9 + n * 17 + int(math.sin(t * 2 + n) * 2)
            draw.rectangle((px, 10, px + 13, 25), outline=color_a, width=1)
        draw.rectangle((8, h - 15, w - 9, h - 10), fill=(40, 90, 80, 82))
    elif index == 8:
        alpha = int(80 + 45 * (0.5 + 0.5 * math.sin(t * 2.8)))
        draw.text((w // 2 - 19, h // 2 - 11), "AFK", fill=(76, 255, 92, min(alpha, 90)))
        draw.arc((w // 2 - 28, h // 2 - 23, w // 2 + 28, h // 2 + 33), 200, 340, fill=(80, 210, 100, 38), width=1)
    else:
        water_y = h - 18
        for n in range(4):
            y = water_y + int(math.sin(t * 2 + n) * 2)
            draw.line((8, y + n * 3, w - 8, y + n * 3), fill=(75, 190, 230, 58), width=1)
        bob_x = int(w // 2 + math.sin(t * 1.8) * 16)
        bob_y = int(water_y + math.cos(t * 1.8) * 3)
        draw.line((bob_x - 12, 12, bob_x, bob_y), fill=(255, 238, 180, 62), width=1)
        draw.ellipse((bob_x - 1, bob_y - 1, bob_x + 1, bob_y + 1), fill=(255, 70, 62, 92))

    # Glass frame and breathing glow stay inside each original CRT region.
    glow = int(25 + 12 * math.sin(phase + index))
    draw.rectangle((1, 1, w - 2, h - 2), outline=(80, 240, 190, 18 + glow), width=1)
    draw.rectangle((0, 0, w - 1, h - 1), outline=(0, 0, 0, 78), width=3)
    frame.alpha_composite(overlay, (x1, y1))


def make_crt_mask(size: tuple[int, int]) -> Image.Image:
    w, h = size
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.polygon(((2, 2), (w - 3, 2), (w - 2, h - 4), (3, h - 3)), fill=238)
    draw.rectangle((0, 0, w - 1, h - 1), outline=0, width=2)
    return mask


PIXEL_FONT = ImageFont.load_default()


def draw_label(draw: ImageDraw.ImageDraw, text: str, x: int, y: int, fill: tuple[int, int, int, int]) -> None:
    draw.text((x + 1, y + 1), text, font=PIXEL_FONT, fill=(0, 0, 0, 190))
    draw.text((x, y), text, font=PIXEL_FONT, fill=fill)


def draw_pixel_screen(frame: Image.Image, box: tuple[int, int, int, int], index: int, t: float) -> None:
    x1, y1, x2, y2 = box
    w = x2 - x1
    h = y2 - y1
    if w <= 0 or h <= 0:
        return

    glass = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(glass)

    draw.rectangle((0, 0, w, h), fill=(8, 20, 19, 238))
    draw.rectangle((4, 4, w - 5, h - 5), outline=(74, 220, 178, 105), width=1)

    if index == 0:
        draw_label(draw, "SUB2", 7, 6, (245, 255, 206, 235))
        draw_label(draw, "API", 7, 17, (88, 242, 184, 230))
        for n in range(5):
            x = 8 + n * max(10, (w - 18) // 5)
            bar_h = int(8 + (math.sin(t * 2 + n) * 0.5 + 0.5) * (h - 34))
            draw.rectangle((x, h - 8 - bar_h, x + 5, h - 8), fill=(55, 202, 170, 210))
        points = [(8 + n * (w - 18) // 6, h - 12 - int((math.sin(t * 2.5 + n) * 0.5 + 0.5) * (h - 36))) for n in range(7)]
        draw.line(points, fill=(255, 204, 72, 230), width=2)
    elif index == 1:
        draw_label(draw, "LOG", 7, 6, (99, 236, 154, 235))
        for row in range(5):
            y = 20 + row * 8
            draw_label(draw, "OK", 8, y - 2, (95, 226, 146, 210))
            width = 26 + int((math.sin(t * 2.2 + row) * 0.5 + 0.5) * max(18, w - 62))
            draw.rectangle((27, y, 27 + width, y + 3), fill=(63, 174, 130, 180))
        cursor_x = 8 + int((t * 36) % max(1, w - 18))
        draw.rectangle((cursor_x, h - 10, cursor_x + 5, h - 7), fill=(255, 218, 86, 235))
    elif index == 2:
        draw_label(draw, "LOL", 7, 6, (255, 226, 92, 235))
        draw.rectangle((7, 18, w - 8, h - 8), fill=(24, 82, 57, 230), outline=(107, 220, 112, 150))
        lane = [(10, h - 11), (w // 2, h // 2), (w - 11, 21)]
        draw.line(lane, fill=(150, 222, 104, 180), width=2)
        for n in range(8):
            px = int(12 + ((n * 17 + t * 18) % max(1, w - 24)))
            py = int(23 + ((n * 11 + math.sin(t + n) * 8) % max(1, h - 36)))
            draw.rectangle((px - 2, py - 2, px + 2, py + 2), fill=(80, 190, 255, 220) if n % 2 else (255, 82, 70, 220))
    elif index == 3:
        draw_label(draw, "CS2", 7, 6, (255, 213, 78, 240))
        cx = w // 2 + int(math.sin(t * 1.8) * 10)
        cy = h // 2 + int(math.cos(t * 1.3) * 7)
        draw.rectangle((7, 18, w - 8, h - 14), fill=(31, 42, 37, 230))
        draw.line((cx - 18, cy, cx + 18, cy), fill=(255, 70, 62, 230), width=1)
        draw.line((cx, cy - 14, cx, cy + 14), fill=(255, 70, 62, 230), width=1)
        draw.rectangle((9, h - 11, w - 9, h - 7), fill=(48, 70, 64, 220))
        draw.rectangle((9, h - 11, 9 + int((0.6 + 0.25 * math.sin(t * 2.4)) * (w - 18)), h - 7), fill=(84, 230, 172, 230))
    elif index == 4:
        draw_label(draw, "VID", 7, 6, (255, 226, 206, 235))
        draw.rectangle((8, 18, w - 9, h - 13), fill=(22, 24, 27, 238), outline=(220, 72, 65, 170))
        draw.ellipse((w // 2 - 11, h // 2 - 12, w // 2 + 11, h // 2 + 10), fill=(220, 166, 135, 170))
        draw.polygon(((w // 2 - 4, h // 2 - 7), (w // 2 - 4, h // 2 + 8), (w // 2 + 9, h // 2)), fill=(255, 244, 190, 220))
        draw.rectangle((10, h - 9, w - 11, h - 6), fill=(56, 54, 58, 230))
        draw.rectangle((10, h - 9, 10 + int((t * 0.7 % 1) * (w - 21)), h - 7), fill=(255, 82, 66, 230))
    elif index == 5:
        draw_label(draw, "CODE", 7, 6, (105, 238, 140, 235))
        for row in range(6):
            y = 20 + row * 7
            draw.text((8, y - 3), ">", font=PIXEL_FONT, fill=(255, 96, 86, 220))
            line_w = 22 + ((row * 13 + int(t * 21)) % max(24, w - 42))
            draw.rectangle((18, y, min(w - 10, 18 + line_w), y + 2), fill=(74, 224, 144, 205))
        draw.rectangle((w - 18, h - 13, w - 12, h - 8), fill=(255, 212, 72, 230))
    elif index == 6:
        draw_label(draw, "TOP", 7, 6, (255, 228, 88, 240))
        medals = [(1, (255, 210, 78, 235)), (2, (196, 210, 224, 220)), (3, (214, 136, 72, 220))]
        for row, (num, fill) in enumerate(medals):
            y = 20 + row * 12
            draw.rectangle((8, y, 20, y + 9), fill=fill, outline=(0, 0, 0, 180))
            draw.text((11, y - 1), str(num), font=PIXEL_FONT, fill=(20, 14, 8, 235))
            draw.rectangle((25, y + 2, w - 12 - row * 8, y + 5), fill=(80, 208, 160, 185))
        points = [(w - 36 + n * 5, h - 14 - int((math.sin(t * 2 + n) * 0.5 + 0.5) * 18)) for n in range(6)]
        draw.line(points, fill=(82, 204, 255, 210), width=1)
    elif index == 7:
        draw_label(draw, "CARD", 7, 6, (255, 218, 86, 235))
        suits = [(12, 22, (255, 86, 72, 230)), (32, 22, (90, 218, 255, 230)), (52, 22, (255, 220, 90, 230)), (72, 22, (105, 238, 152, 230))]
        for n, (x, y, fill) in enumerate(suits):
            bob = int(math.sin(t * 2.5 + n) * 2)
            draw.rectangle((x, y + bob, x + 12, y + 18 + bob), fill=(236, 230, 198, 225), outline=(15, 12, 10, 180))
            draw.ellipse((x + 4, y + 5 + bob, x + 8, y + 9 + bob), fill=fill)
        draw.rectangle((8, h - 13, w - 9, h - 9), fill=(52, 98, 90, 160))
    elif index == 8:
        alpha = int(170 + 60 * (0.5 + 0.5 * math.sin(t * 2.6)))
        draw_label(draw, "AFK", max(7, w // 2 - 12), max(7, h // 2 - 12), (94, 255, 90, alpha))
        draw.arc((w // 2 - 27, h // 2 - 22, w // 2 + 27, h // 2 + 31), 200, 342, fill=(82, 220, 112, 135), width=2)
        draw.text((8, 12), "Zzz", font=PIXEL_FONT, fill=(230, 255, 210, 180))
        draw.rectangle((8, h - 12, w - 9, h - 9), fill=(52, 92, 56, 150))
    else:
        draw_label(draw, "FISH", 7, 6, (210, 246, 255, 235))
        draw.rectangle((0, 19, w, h), fill=(21, 104, 128, 232))
        water_y = h - 22
        for n in range(4):
            y = water_y + n * 5 + int(math.sin(t * 2 + n) * 2)
            draw.line((6, y, w - 7, y), fill=(116, 232, 248, 155), width=1)
        bob_x = int(w // 2 + math.sin(t * 1.8) * max(9, w // 6))
        bob_y = int(water_y + math.cos(t * 1.8) * 3)
        draw.line((bob_x - 16, 18, bob_x, bob_y), fill=(255, 240, 182, 155), width=1)
        draw.ellipse((bob_x - 2, bob_y - 2, bob_x + 2, bob_y + 2), fill=(255, 72, 62, 230))

    for yy in range(2, h, 8):
        draw.line((1, yy, w - 2, yy), fill=(255, 255, 220, 10))

    glow = int(20 + 10 * math.sin(t + index * 0.7))
    draw.rectangle((0, 0, w - 1, h - 1), outline=(0, 0, 0, 190), width=3)
    draw.rectangle((3, 3, w - 4, h - 4), outline=(105, 245, 195, 24 + glow), width=1)
    draw.rectangle((5, 5, max(5, w // 2), 7), fill=(255, 255, 210, 18))

    mask = make_crt_mask((w, h))
    frame.paste(glass, (x1, y1), mask)


# True CRT glass rectangles measured from netbar-master.png at 1024x576.
# The browser renders this GIF at 2x, so these are the single source of truth.
SCREEN_BOXES = [
    (66, 203, 148, 269),
    (259, 203, 346, 269),
    (446, 204, 536, 269),
    (632, 204, 718, 269),
    (819, 204, 912, 269),
    (49, 354, 146, 431),
    (253, 354, 346, 431),
    (448, 354, 532, 431),
    (632, 354, 716, 431),
    (819, 354, 925, 431),
]

HORSES = [
    {"body": (86, 202, 178, 337), "head": (103, 187, 166, 247), "hands": (72, 255, 145, 303), "phase": 0.0, "mode": "work"},
    {"body": (283, 202, 375, 337), "head": (300, 187, 363, 247), "hands": (270, 255, 342, 303), "phase": 0.5, "mode": "work"},
    {"body": (477, 202, 569, 337), "head": (494, 187, 558, 247), "hands": (464, 255, 536, 303), "phase": 1.0, "mode": "game"},
    {"body": (672, 202, 764, 337), "head": (689, 187, 753, 247), "hands": (659, 255, 731, 303), "phase": 1.5, "mode": "game"},
    {"body": (866, 202, 960, 337), "head": (883, 187, 947, 247), "hands": (853, 255, 925, 303), "phase": 2.0, "mode": "game"},
    {"body": (84, 392, 180, 560), "head": (101, 380, 168, 448), "hands": (70, 447, 146, 502), "phase": 2.5, "mode": "work"},
    {"body": (283, 392, 384, 560), "head": (300, 380, 367, 448), "hands": (270, 447, 348, 502), "phase": 3.0, "mode": "work"},
    {"body": (478, 392, 575, 560), "head": (495, 380, 562, 448), "hands": (464, 447, 542, 502), "phase": 3.5, "mode": "game"},
    {"body": (675, 383, 775, 548), "head": (690, 373, 759, 440), "hands": (662, 430, 748, 489), "phase": 4.0, "mode": "sleep"},
    {"body": (875, 392, 980, 560), "head": (892, 380, 964, 448), "hands": (858, 447, 944, 502), "phase": 4.5, "mode": "sleep"},
]


def animate_horses(frame: Image.Image, master: Image.Image, t: float) -> None:
    for horse in HORSES:
        phase = t + horse["phase"]
        if horse["mode"] == "sleep":
            body_dy = int(round(math.sin(phase * 0.75) * 2))
            head_dx = int(round(math.sin(phase * 0.6) * 1))
            paste_shifted(frame, master, horse["body"], 0, body_dy, "ellipse")
            paste_shifted(frame, master, horse["head"], head_dx, body_dy, "ellipse")
        else:
            body_dy = int(round(math.sin(phase * 1.55) * 2))
            head_dx = int(round(math.sin(phase * 1.2) * 2))
            hand_dx = int(round(math.sin(phase * 4.2) * 3))
            hand_dy = int(round(math.cos(phase * 4.2) * 1))
            paste_shifted(frame, master, horse["body"], 0, body_dy, "ellipse")
            paste_shifted(frame, master, horse["head"], head_dx, body_dy - 1, "ellipse")
            paste_shifted(frame, master, horse["hands"], hand_dx, hand_dy, "rect")


def draw_environment(frame: Image.Image, index: int, t: float) -> None:
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    lamp_boxes = [(12, 13, 137, 34), (242, 12, 372, 35), (651, 12, 778, 35), (916, 12, 1020, 36)]
    lamp_alpha = int(12 + 18 * (0.5 + 0.5 * math.sin(t * 2)))
    for box in lamp_boxes:
        draw.rounded_rectangle(box, radius=4, fill=(255, 224, 112, lamp_alpha))
        draw.rectangle((box[0], box[3], box[2], box[3] + 3), fill=(255, 240, 150, lamp_alpha // 2))

    fan_center = (178, 91)
    fx, fy = fan_center
    for blade in range(3):
        angle = t * 4.0 + blade * math.tau / 3
        x = fx + math.cos(angle) * 34
        y = fy + math.sin(angle) * 34
        draw.line((fx, fy, x, y), fill=(210, 230, 190, 70), width=5)

    for n in range(8):
        x = 763 + n * 7
        alpha = int(28 + 42 * (0.5 + 0.5 * math.sin(t * 4 + n)))
        draw.line((x, 78, x, 173), fill=(78, 214, 255, alpha), width=2)

    rng = Random(404)
    for p in range(28):
        x = int((rng.randrange(0, WIDTH) + index * (1 + p % 3) * 2) % WIDTH)
        y = int(70 + ((p * 47 + index * 3) % 420))
        alpha = int(12 + 16 * math.sin(t + p))
        draw.point((x, y), fill=(255, 220, 130, max(0, alpha)))

    for y in range(0, HEIGHT, 4):
        draw.line((0, y, WIDTH, y), fill=(255, 255, 255, 9), width=1)
    draw.rectangle((0, 0, WIDTH - 1, HEIGHT - 1), outline=(0, 0, 0, 96), width=10)
    frame.alpha_composite(overlay)


def main() -> None:
    master = load_master()
    frames: list[Image.Image] = []
    for i in range(FRAME_COUNT):
        t = math.tau * i / FRAME_COUNT
        frame = master.copy()
        for screen_index, box in enumerate(SCREEN_BOXES):
            draw_pixel_screen(frame, box, screen_index, t)
        animate_horses(frame, master, t)
        draw_environment(frame, i, t)
        frames.append(frame.convert("P", palette=Image.Palette.ADAPTIVE, colors=192))

    debug = frames[0].convert("RGBA")
    debug_draw = ImageDraw.Draw(debug)
    for index, box in enumerate(SCREEN_BOXES, 1):
        debug_draw.rectangle(box, outline=(255, 0, 0, 255), width=2)
        debug_draw.text((box[0] + 2, box[1] + 2), str(index), fill=(255, 255, 0, 255))
    debug.save(ROOT / "tmp" / "screen-render-debug-v6.png")

    gif_path = OUT / "scene-loop-v6.gif"
    poster_path = OUT / "scene-loop-v6-poster.png"
    frames[0].save(
        gif_path,
        save_all=True,
        append_images=frames[1:],
        duration=int(1000 / FPS),
        loop=0,
        optimize=True,
        disposal=2,
    )
    frames[0].convert("RGBA").save(poster_path)
    print(gif_path)
    print(gif_path.stat().st_size)
    print(poster_path)


if __name__ == "__main__":
    main()
