#!/usr/bin/env python3
"""Exporte les photos de chantiers CTH en WebP, sans EXIF ni GPS.

Les originaux ne sont pas dans le dépôt (archive remise à part).
Le script floute les visages, les plaques et les numéros de rue lisibles,
puis écrit une variante 1600 px et une variante 800 px.

Usage : python3 scripts/prepare_chantiers.py /chemin/vers/les/jpg
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "images" / "chantiers"
MANIFEST = ROOT / "assets" / "images" / "manifest.json"

# Boîtes (x, y, largeur, hauteur) en fraction de l'image.
REDACT = {
    "ravalement-ch33-pendant.jpg": [
        (0.428, 0.228, 0.048, 0.042),
        (0.555, 0.755, 0.055, 0.070),
    ],
    "toiture-facade-ch14-toiture.jpg": [
        (0.548, 0.848, 0.110, 0.115),
    ],
    "toiture-facade-ch14-facade.jpg": [
        (0.145, 0.905, 0.165, 0.070),
        (0.518, 0.774, 0.115, 0.080),
    ],
    "facade-ch90-avant.jpg": [
        (0.372, 0.628, 0.048, 0.045),
    ],
    "facade-ch90-apres.jpg": [
        (0.458, 0.578, 0.048, 0.050),
    ],
    # Visage caché par la capuche, regard vers le bas : le rectangle de ciel
    # raté attirait plus l'œil que la silhouette. Rien de lisible, donc rien à masquer.
}


def load(path: Path) -> Image.Image:
    im = ImageOps.exif_transpose(Image.open(path))
    return im.convert("RGB")


def redact(im: Image.Image, boxes: list[tuple[float, float, float, float]]) -> Image.Image:
    im = im.copy()
    width, height = im.size
    for x, y, w, h in boxes:
        left = max(0, int(x * width))
        top = max(0, int(y * height))
        right = min(width, int((x + w) * width))
        bottom = min(height, int((y + h) * height))
        if right - left < 6 or bottom - top < 6:
            continue
        region = im.crop((left, top, right, bottom))
        tiny = region.resize(
            (max(1, region.width // 30), max(1, region.height // 30)),
            Image.Resampling.BILINEAR,
        )
        region = tiny.resize(region.size, Image.Resampling.BILINEAR)
        region = region.filter(ImageFilter.GaussianBlur(radius=max(10, min(region.size) // 4)))
        im.paste(region, (left, top))
    return im


def fit_width(im: Image.Image, max_width: int) -> Image.Image:
    width, height = im.size
    if width <= max_width:
        target_w = width - (width % 2)
        target_h = height - (height % 2)
        if (target_w, target_h) != im.size:
            im = im.crop((0, 0, target_w, target_h))
        return im
    target_w = max_width - (max_width % 2)
    target_h = round(height * target_w / width)
    target_h -= target_h % 2
    return im.resize((target_w, target_h), Image.Resampling.LANCZOS)


def save_webp(im: Image.Image, dest: Path, quality: int) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "WEBP", quality=quality, method=6)
    # Un second passage si le fichier dépasse le budget d'une image hors écran.
    if dest.stat().st_size > 220_000 and quality > 60:
        im.save(dest, "WEBP", quality=quality - 10, method=6)


def export_pair(im: Image.Image, folder: Path, stem: str) -> tuple[int, int, int, int]:
    large = fit_width(im, 1600)
    small = fit_width(im, 800)
    save_webp(large, folder / f"{stem}-1600.webp", 74)
    save_webp(small, folder / f"{stem}-800.webp", 70)
    return (*large.size, *small.size)


def entry(slug: str, stem: str, width: int, height: int, alt: str) -> dict:
    base = f"images/chantiers/{slug}/{stem}"
    return {
        "src": f"{base}-1600.webp",
        "srcset": f"{base}-800.webp 800w, {base}-1600.webp 1600w",
        "width": width,
        "height": height,
        "alt": alt,
    }


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit("usage: prepare_chantiers.py DOSSIER_JPG")
    source = Path(sys.argv[1])
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))

    jobs = {
        "ravalement": {
            "legend": "Ravalement de façade — avant / après, chantier CTH",
            "aspect": "3 / 4",
            "stages": [
                ("avant", "ravalement-ch33-avant.jpg", "Ravalement de façade — avant, chantier CTH"),
                ("pendant", "ravalement-ch33-pendant.jpg", "Ravalement de façade — pendant, chantier CTH"),
                ("apres", "ravalement-ch33-apres.jpg", "Ravalement de façade — après, chantier CTH"),
            ],
        },
        "toiture": {
            "legend": "Traitement de toiture — avant / après, chantier CTH",
            "aspect": "16 / 9",
            "stages": [
                ("avant", "toiture-ch01-avant.jpg", "Traitement de toiture — avant, chantier CTH"),
                ("pendant", "toiture-ch01-pendant.jpg", "Traitement de toiture — pendant, chantier CTH"),
                ("apres", "toiture-ch01-apres.jpg", "Traitement de toiture — après, chantier CTH"),
            ],
            "extra": [
                ("realisation-toiture", "toiture-facade-ch14-toiture.jpg", "Toiture — chantier CTH"),
                ("realisation-facade", "toiture-facade-ch14-facade.jpg", "Façade — chantier CTH"),
            ],
        },
        "facade": {
            "legend": "Façade — habillage d'étage, avant / après, chantier CTH",
            "aspect": "4 / 3",
            "stages": [
                ("avant", "facade-ch90-avant.jpg", "Façade — habillage d'étage, avant, chantier CTH"),
                ("apres", "facade-ch90-apres.jpg", "Façade — habillage d'étage, après, chantier CTH"),
            ],
        },
        "isolation": {
            "legend": "Isolation des combles — avant / après, chantier CTH",
            "aspect": "3 / 4",
            "stages": [
                ("avant", "combles-ch47-avant.jpg", "Isolation des combles — avant, chantier CTH"),
                ("apres", "combles-ch47-apres.jpg", "Isolation des combles — après, chantier CTH"),
            ],
        },
        "volets": {
            "legend": "Volets roulants — avant / après, chantier CTH",
            "aspect": "4 / 5",
            "stages": [
                ("avant", "volets-roulants-ch39-avant.jpg", "Volets roulants — avant, chantier CTH"),
                ("apres", "volets-roulants-ch39-apres.jpg", "Volets roulants — après, chantier CTH"),
            ],
        },
    }

    for slug, spec in jobs.items():
        folder = OUT / slug
        folder.mkdir(parents=True, exist_ok=True)
        for stale in folder.glob("*.webp"):
            stale.unlink()
        block = {
            "real": True,
            "legend": spec["legend"],
            "aspect": spec["aspect"],
        }
        for stem, filename, alt in spec["stages"]:
            im = redact(load(source / filename), REDACT.get(filename, []))
            width, height, _, _ = export_pair(im, folder, stem)
            block[stem] = entry(slug, stem, width, height, alt)
            print(f"{slug}/{stem} {width}x{height} {(folder / (stem + '-1600.webp')).stat().st_size // 1024} Ko")
        if spec.get("extra"):
            block["extra"] = []
            for stem, filename, alt in spec["extra"]:
                im = redact(load(source / filename), REDACT.get(filename, []))
                width, height, _, _ = export_pair(im, folder, stem)
                item = entry(slug, stem, width, height, alt)
                item["caption"] = alt
                block["extra"].append(item)
                print(f"{slug}/{stem} {width}x{height} {(folder / (stem + '-1600.webp')).stat().st_size // 1024} Ko")
        manifest["chantiers"][slug] = block

    accueil = OUT / "accueil"
    if accueil.exists():
        for stale in accueil.glob("*"):
            stale.unlink()
        accueil.rmdir()
    manifest["chantiers"].pop("accueil", None)

    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("manifest mis à jour")


if __name__ == "__main__":
    main()
