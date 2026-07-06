from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
FINAL = ROOT / "assets" / "image-split-assets" / "final"
OUT = ROOT / "assets" / "image-split-assets" / "preview"


def make_screen_frame(index: int, size: tuple[int, int]) -> Image.Image:
    w, h = size
    img = Image.new("RGBA", size, (6, 14, 18, 255))
    draw = ImageDraw.Draw(img)
    for y in range(2 + index % 3, h, 6):
        draw.line((0, y, w, y), fill=(18, 52, 49, 255))
    colors = [(69, 224, 127), (238, 194, 70), (86, 172, 239), (226, 70, 78)]
    if index % 5 == 0:
        for i in range(5):
            bar = 7 + ((index + i) * 5) % max(8, h - 10)
            x = 5 + i * max(5, w // 7)
            draw.rectangle((x, h - 4 - bar, x + 4, h - 4), fill=colors[i % len(colors)])
    elif index % 5 == 1:
        for i in range(5):
            draw.text((4, 3 + i * 8), ["GET", "TOK", "RUN", "200", "API"][(i + index) % 5], fill=(74, 232, 134, 255))
    elif index % 5 == 2:
        draw.rectangle((5, 5, w - 6, h - 6), outline=(74, 232, 134, 255))
        draw.line((6, h - 8, w - 8, 7), fill=(235, 198, 75, 255))
        for i in range(4):
            draw.rectangle((8 + i * 10, 10 + ((index + i) % 3) * 8, 10 + i * 10, 12 + ((index + i) % 3) * 8), fill=colors[i])
    elif index % 5 == 3:
        cx, cy = w // 2, h // 2
        draw.line((cx - 12, cy, cx + 12, cy), fill=(74, 232, 134, 255))
        draw.line((cx, cy - 12, cx, cy + 12), fill=(74, 232, 134, 255))
    else:
        draw.text((8, 16), "AFK", fill=(238, 194, 70, 255))
    draw.rectangle((2, 2, w - 3, h - 3), outline=(66, 234, 149, 255))
    return img


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    bg = Image.open(FINAL / "empty-netbar-background-hard-pixel.png").convert("RGBA")
    station = Image.open(FINAL / "single-crt-workstation-hard-pixel.png").convert("RGBA")
    horse_sheet = Image.open(FINAL / "horse-working-sheet-hard-pixel.png").convert("RGBA")
    horse_work = horse_sheet.crop((0, 0, 150, 120))
    horse_game = Image.open(FINAL / "horse-gaming-single-hard-pixel.png").convert("RGBA") if (FINAL / "horse-gaming-single-hard-pixel.png").exists() else horse_work
    horse_sleep = Image.open(FINAL / "horse-sleep-single-hard-pixel.png").convert("RGBA") if (FINAL / "horse-sleep-single-hard-pixel.png").exists() else horse_work
    cow = Image.open(FINAL / "cow-boss-single-hard-pixel.png").convert("RGBA") if (FINAL / "cow-boss-single-hard-pixel.png").exists() else None

    preview = bg.copy()
    station_pos = (500, 560)
    screen_rect = (93, 19, 46, 42)
    screen = make_screen_frame(0, (screen_rect[2], screen_rect[3]))
    preview.alpha_composite(screen, (station_pos[0] + screen_rect[0], station_pos[1] + screen_rect[1]))
    preview.alpha_composite(station, station_pos)
    preview.alpha_composite(horse_work, (station_pos[0] + 52, station_pos[1] + 68))
    preview.save(OUT / "single-station-layer-test.png")

    full = bg.copy()
    if cow:
        full.alpha_composite(cow, (705, 285))
    positions = [
        (115, 490), (390, 490), (665, 490), (940, 490), (1215, 490),
        (115, 705), (390, 705), (665, 705), (940, 705), (1215, 705),
    ]
    horses = [horse_work, horse_work, horse_game, horse_game, horse_sleep, horse_work, horse_game, horse_work, horse_sleep, horse_game]
    for index, (x, y) in enumerate(positions):
        screen = make_screen_frame(index, (screen_rect[2], screen_rect[3]))
        full.alpha_composite(screen, (x + screen_rect[0], y + screen_rect[1]))
        full.alpha_composite(station, (x, y))
        full.alpha_composite(horses[index], (x + 52, y + 68))
    full.save(OUT / "ten-station-layer-test.png")


if __name__ == "__main__":
    main()
