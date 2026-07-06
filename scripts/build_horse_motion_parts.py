from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "generated-horse-foregrounds"
OUT = ROOT / "assets" / "horse-motion-parts"


def is_horse_pixel(r: int, g: int, b: int, a: int) -> bool:
    if a < 12:
        return False
    mx = max(r, g, b)
    mn = min(r, g, b)
    sat = 0 if mx == 0 else (mx - mn) / mx

    horse_brown = (
        r > 62
        and 18 < g < 132
        and b < 116
        and r > g + 14
        and r > b + 28
        and sat > 0.26
    )
    dark_mane = (
        r > 24
        and g > 14
        and g < 88
        and b < 78
        and r >= b + 2
        and sat > 0.32
    )
    return horse_brown or dark_mane


def connected_components(mask: list[list[bool]]) -> list[list[tuple[int, int]]]:
    height = len(mask)
    width = len(mask[0])
    seen = [[False] * width for _ in range(height)]
    components: list[list[tuple[int, int]]] = []
    for y in range(height):
        for x in range(width):
            if seen[y][x] or not mask[y][x]:
                continue
            seen[y][x] = True
            queue: deque[tuple[int, int]] = deque([(x, y)])
            comp: list[tuple[int, int]] = []
            while queue:
                cx, cy = queue.popleft()
                comp.append((cx, cy))
                for ny in range(max(0, cy - 1), min(height, cy + 2)):
                    for nx in range(max(0, cx - 1), min(width, cx + 2)):
                        if seen[ny][nx] or not mask[ny][nx]:
                            continue
                        seen[ny][nx] = True
                        queue.append((nx, ny))
            components.append(comp)
    return components


def keep_component(comp: list[tuple[int, int]], width: int, height: int) -> bool:
    area = len(comp)
    if area < 22:
        return False
    xs = [p[0] for p in comp]
    ys = [p[1] for p in comp]
    left, right = min(xs), max(xs)
    top, bottom = min(ys), max(ys)
    box_w = right - left + 1
    box_h = bottom - top + 1
    cx = sum(xs) / area
    cy = sum(ys) / area

    # Keep the animal, not the desk: keyboard and screen highlights live mostly
    # in the left/middle strip and created the "whole image drifting" look.
    if right < width * 0.58:
        return False
    if cx < width * 0.54 and cy < height * 0.68:
        return False
    if bottom < height * 0.2:
        return False
    if box_w > width * 0.32 and box_h < height * 0.09:
        return False
    if top < height * 0.12 and box_h < height * 0.12:
        return False
    if cx < width * 0.34 and right < width * 0.62:
        return False
    if cy < height * 0.22 and right < width * 0.72:
        return False
    if box_w > width * 0.45 and box_h < height * 0.18:
        return False
    return True


def dilate(points: set[tuple[int, int]], width: int, height: int) -> set[tuple[int, int]]:
    out: set[tuple[int, int]] = set()
    for x, y in points:
        for ny in range(max(0, y - 1), min(height, y + 2)):
            for nx in range(max(0, x - 1), min(width, x + 2)):
                out.add((nx, ny))
    return out


def make_motion_part(src_path: Path, out_path: Path) -> None:
    img = Image.open(src_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    mask = [
        [is_horse_pixel(*pixels[x, y]) for x in range(width)]
        for y in range(height)
    ]
    kept: set[tuple[int, int]] = set()
    for comp in connected_components(mask):
        if keep_component(comp, width, height):
            kept.update(comp)
    kept = dilate(kept, width, height)

    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out_pixels = out.load()
    for x, y in kept:
        r, g, b, a = pixels[x, y]
        if a:
            out_pixels[x, y] = (r, g, b, min(240, int(a * 0.94)))
    out.save(out_path)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for src_path in sorted(SRC.glob("station-*-horse-foreground.png")):
        out_name = src_path.name.replace("-horse-foreground", "-horse-motion")
        make_motion_part(src_path, OUT / out_name)
    print(f"wrote horse motion parts to {OUT}")


if __name__ == "__main__":
    main()
