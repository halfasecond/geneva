#!/usr/bin/env python3
"""Generate VECH / Elite favicon PNGs and ICO from the solar-system glyph."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "public" / "elite"
BG = (5, 14, 21, 255)
BLUE = (102, 170, 255, 255)
BLUE_DIM = (102, 170, 255, 90)


def draw_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), BG)
    draw = ImageDraw.Draw(img)
    cx = cy = size / 2
    scale = size / 32

    def ring(r: float, width: float = 1) -> None:
        rr = r * scale
        draw.ellipse(
            (cx - rr, cy - rr, cx + rr, cy + rr),
            outline=BLUE,
            width=max(1, round(width * scale)),
        )

    def dot(x: float, y: float, r: float, fill: tuple[int, int, int, int] = BLUE) -> None:
        px = cx + x * scale
        py = cy + y * scale
        rr = r * scale
        draw.ellipse((px - rr, py - rr, px + rr, py + rr), fill=fill)

    ring(5.2, 0.9)
    ring(9.2, 0.9)
    dot(0, 0, 2.4, BLUE_DIM)
    dot(0, 0, 1.5)
    dot(3.8, -3.4, 0.95)
    dot(-4.8, 3.4, 1.05)
    dot(6.4, 2.1, 0.85)
    return img


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    sizes = {
        "favicon-16x16.png": 16,
        "favicon-32x32.png": 32,
        "favicon-96x96.png": 96,
        "apple-touch-icon.png": 180,
        "web-app-manifest-192x192.png": 192,
        "web-app-manifest-512x512.png": 512,
    }
    icons: list[Image.Image] = []
    for name, size in sizes.items():
        img = draw_icon(size)
        img.save(OUT / name, format="PNG")
        if size in (16, 32, 48):
            icons.append(img)
    ico_sizes = [draw_icon(s) for s in (16, 32, 48)]
    ico_sizes[0].save(
        OUT / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
        append_images=ico_sizes[1:],
    )
    print(f"Wrote elite favicons to {OUT}")


if __name__ == "__main__":
    main()