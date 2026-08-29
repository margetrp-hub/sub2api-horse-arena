from __future__ import annotations

import argparse
import json
from pathlib import Path
import shutil

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "assets" / "station-prototype" / "raw"
OUT = ROOT / "public" / "assets" / "station-prototype"
MASTER_V3_OUT = ROOT / "public" / "assets" / "station-master-v3"


def remove_connected_green(image: Image.Image, preserve_isolated_green: bool = True) -> Image.Image:
    rgb = np.asarray(image.convert("RGB"), dtype=np.int16)
    red, green, blue = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    green_candidate = (green > 45) & (green - red > 30) & (green - blue > 30)

    flood_map = Image.fromarray(np.where(green_candidate, 255, 0).astype(np.uint8), mode="L")
    draw = ImageDraw.Draw(flood_map)
    width, height = flood_map.size
    seeds = [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]
    for seed in seeds:
        if flood_map.getpixel(seed) == 255:
            ImageDraw.floodfill(flood_map, seed, 128, thresh=0)

    background = np.asarray(flood_map) == 128
    if not preserve_isolated_green:
        background |= green_candidate

    adjacent_to_background = np.zeros(background.shape, dtype=bool)
    adjacent_to_background[1:] |= background[:-1]
    adjacent_to_background[:-1] |= background[1:]
    adjacent_to_background[:, 1:] |= background[:, :-1]
    adjacent_to_background[:, :-1] |= background[:, 1:]
    visible_spill = (~background) & adjacent_to_background & (green > np.maximum(red, blue) + 8)
    cleaned_rgb = rgb.copy()
    cleaned_rgb[..., 1][visible_spill] = np.maximum(red, blue)[visible_spill]

    alpha = np.full(background.shape, 255, dtype=np.uint8)
    alpha[background] = 0
    rgba = np.dstack((cleaned_rgb.astype(np.uint8), alpha))
    return Image.fromarray(rgba, mode="RGBA")


def find_screen_mask(image: Image.Image) -> np.ndarray:
    rgb = np.asarray(image.convert("RGB"), dtype=np.int16)
    red, green, blue = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    return (red > 145) & (blue > 145) & (green < 105) & (red + blue - green * 2 > 220)


def quad_from_mask(mask: np.ndarray) -> list[list[int]]:
    ys, xs = np.nonzero(mask)
    if len(xs) < 100:
        raise RuntimeError("Could not find the CRT magenta screen region.")
    points = np.column_stack((xs, ys))
    sums = xs + ys
    differences = xs - ys
    return [
        points[np.argmin(sums)].tolist(),
        points[np.argmax(differences)].tolist(),
        points[np.argmax(sums)].tolist(),
        points[np.argmin(differences)].tolist(),
    ]


def alpha_bounds(image: Image.Image) -> list[int]:
    alpha = image.getchannel("A")
    bounds = alpha.getbbox()
    if bounds is None:
        raise RuntimeError("Processed asset is fully transparent.")
    return list(bounds)


def true_runs(values: np.ndarray) -> list[tuple[int, int]]:
    transitions = np.diff(np.pad(values.astype(np.int8), (1, 1)))
    starts = np.flatnonzero(transitions == 1)
    ends = np.flatnonzero(transitions == -1)
    return list(zip(starts.tolist(), ends.tolist()))


def clear_transparent_rgb(image: Image.Image) -> Image.Image:
    rgba = np.asarray(image.convert("RGBA")).copy()
    rgba[rgba[..., 3] == 0, :3] = 0
    return Image.fromarray(rgba, mode="RGBA")


def process_workstation(
    source_name: str = "workstation-empty-chroma.png",
    output_dir: Path = OUT,
    url_prefix: str = "/assets/station-prototype",
) -> dict:
    source_path = RAW / source_name
    source = Image.open(source_path).convert("RGB")
    screen_mask = find_screen_mask(source)
    screen_quad = quad_from_mask(screen_mask)

    processed = remove_connected_green(source)
    rgba = np.asarray(processed).copy()
    rgba[screen_mask, 3] = 0
    processed = clear_transparent_rgb(Image.fromarray(rgba, mode="RGBA"))

    output_path = output_dir / "workstation-frame.png"
    processed.save(output_path, optimize=True)
    Image.fromarray(np.where(screen_mask, 255, 0).astype(np.uint8), mode="L").save(
        output_dir / "screen-hole-mask.png",
        optimize=True,
    )
    return {
        "image": f"{url_prefix}/workstation-frame.png",
        "size": list(processed.size),
        "bounds": alpha_bounds(processed),
        "screenQuad": screen_quad,
    }


def process_character_sheet(
    source_name: str,
    output_name: str,
    output_dir: Path = OUT,
    url_prefix: str = "/assets/station-prototype",
    frame_size: int = 448,
    anchor_y: int = 424,
) -> dict:
    source = Image.open(RAW / source_name).convert("RGB")
    keyed_sheet = remove_connected_green(source, preserve_isolated_green=False)
    alpha = np.asarray(keyed_sheet.getchannel("A")) > 0
    row_runs = true_runs(alpha.any(axis=1))
    if len(row_runs) != 2:
        raise RuntimeError(f"Expected two horse rows, found {len(row_runs)}: {row_runs}")

    object_boxes: list[tuple[int, int, int, int]] = []
    for top, bottom in row_runs:
        column_runs = [
            (left, right)
            for left, right in true_runs(alpha[top:bottom].any(axis=0))
            if right - left >= 64
        ]
        if len(column_runs) != 4:
            raise RuntimeError(f"Expected four horses in row {top}:{bottom}, found {column_runs}")
        object_boxes.extend((left, top, right, bottom) for left, right in column_runs)

    frames: list[Image.Image] = []
    frame_bounds: list[list[int]] = []

    for left, top, right, bottom in object_boxes:
        padding = 12
        crop_box = (
            max(0, left - padding),
            max(0, top - padding),
            min(source.width, right + padding),
            min(source.height, bottom + padding),
        )
        crop = keyed_sheet.crop(crop_box)
        bottom_band = alpha[max(top, bottom - 44) : bottom, left:right]
        bottom_xs = np.nonzero(bottom_band)[1]
        anchor_x = left + int(np.median(bottom_xs)) if len(bottom_xs) else (left + right) // 2
        offset = (frame_size // 2 - (anchor_x - crop_box[0]), anchor_y - (bottom - crop_box[1]))

        frame = Image.new("RGBA", (frame_size, frame_size))
        frame.alpha_composite(crop, offset)
        frame = clear_transparent_rgb(frame)
        frame_bounds.append(alpha_bounds(frame))
        frame.save(output_dir / f"{output_name}-{len(frames):02d}.png", optimize=True)
        frames.append(frame)

    strip = Image.new("RGBA", (frame_size * len(frames), frame_size))
    for index, frame in enumerate(frames):
        strip.alpha_composite(frame, (index * frame_size, 0))
    strip_path = output_dir / f"{output_name}-strip.png"
    strip.save(strip_path, optimize=True)

    animation_order = [0, 4, 1, 5, 2, 6, 3, 7, 3, 6, 2, 5, 1, 4]
    gif_frames = [frames[index] for index in animation_order]
    gif_frames[0].save(
        output_dir / f"{output_name}-preview.gif",
        save_all=True,
        append_images=gif_frames[1:],
        duration=200,
        loop=0,
        disposal=2,
        transparency=0,
    )

    return {
        "image": f"{url_prefix}/{output_name}-strip.png",
        "frameSize": [frame_size, frame_size],
        "frames": len(frames),
        "fps": 8,
        "preview": f"{url_prefix}/{output_name}-preview.gif",
        "bounds": frame_bounds,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Process layered OH! horse workstation assets.")
    parser.add_argument("--profile", choices=("legacy", "master-v3"), default="legacy")
    args = parser.parse_args()

    is_master_v3 = args.profile == "master-v3"
    output_dir = MASTER_V3_OUT if is_master_v3 else OUT
    url_prefix = "/assets/station-master-v3" if is_master_v3 else "/assets/station-prototype"
    output_dir.mkdir(parents=True, exist_ok=True)

    if is_master_v3:
        shutil.copy2(RAW / "arena-empty-room-master-v3-clean.png", output_dir / "netbar-background-empty.png")
        workstation_source = "workstation-empty-master-v3-chroma.png"
        working_source = "horse-working-master-v3-8frame-chroma.png"
        gaming_source = RAW / "horse-gaming-master-v3-8frame-chroma.png"
        sleeping_source = RAW / "horse-sleeping-master-v3-8frame-chroma.png"
        frame_size = 576
        anchor_y = 560
    else:
        shutil.copy2(
            ROOT / "assets" / "api-game-kit-v2" / "raw" / "background-netbar-empty.png",
            output_dir / "netbar-background-empty.png",
        )
        workstation_source = "workstation-empty-chroma.png"
        working_source = "horse-working-8frame-chroma.png"
        gaming_source = RAW / "horse-gaming-8frame-chroma.png"
        sleeping_source = RAW / "horse-sleeping-8frame-chroma.png"
        frame_size = 448
        anchor_y = 424

    working = process_character_sheet(
        working_source,
        "horse-working",
        output_dir,
        url_prefix,
        frame_size,
        anchor_y,
    )
    horses = {"working": working}
    if gaming_source.exists():
        horses["gaming"] = process_character_sheet(
            gaming_source.name,
            "horse-gaming",
            output_dir,
            url_prefix,
            frame_size,
            anchor_y,
        )
    if sleeping_source.exists():
        horses["sleep"] = process_character_sheet(
            sleeping_source.name,
            "horse-sleeping",
            output_dir,
            url_prefix,
            frame_size,
            anchor_y,
        )
    boss_source = RAW / "cow-boss-8frame-chroma.png"
    boss = (
        process_character_sheet(boss_source.name, "cow-boss", output_dir, url_prefix)
        if boss_source.exists()
        else None
    )

    manifest = {
        "background": f"{url_prefix}/netbar-background-empty.png",
        "workstation": process_workstation(workstation_source, output_dir, url_prefix),
        "horse": working,
        "horses": horses,
        "boss": boss,
    }
    (output_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
