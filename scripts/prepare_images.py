#!/usr/bin/env python3
"""Télécharge les illustrations Pexels, les convertit en WebP, et génère les cadres de chantiers."""

import json
import subprocess
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path("/workspace")
ILLU = ROOT / "assets/images/illustrations"
CHANTIERS = ROOT / "assets/images/chantiers"
TMP = Path("/tmp/cth-src")
TMP.mkdir(parents=True, exist_ok=True)

# (fichier, id pexels, auteur, alt, crop ffmpeg ou None)
PHOTOS = [
    (
        "hero-accueil",
        17986547,
        "Dušan Cvetanović",
        "Illustration : rue européenne, toitures en tuiles et volets. Photo libre de droits, pas un chantier CTH.",
        None,
    ),
    (
        "toiture",
        17314421,
        "Benjamin Kupke",
        "Illustration : toiture en tuiles et volets roulants. Photo libre de droits, pas un chantier CTH.",
        None,
    ),
    (
        "facade",
        39634958,
        "Tori D",
        "Illustration : façade enduite claire et toiture en tuiles. Photo libre de droits, pas un chantier CTH.",
        None,
    ),
    (
        "ravalement",
        1115804,
        "Pexels",
        "Illustration : volumes enduits clairs et chemin dallé. Photo libre de droits, pas un chantier CTH.",
        None,
    ),
    (
        "isolation",
        4482829,
        "Pexels",
        "Illustration : fenêtre de toit vue depuis des combles. Photo libre de droits, pas un chantier CTH.",
        "crop=iw*0.62:ih*0.72:iw*0.34:ih*0.14",
    ),
    (
        "menuiserie",
        27575957,
        "AXP Photography",
        "Illustration : façade, fenêtres et volets d'une maison à pans de bois. Photo libre de droits, pas un chantier CTH.",
        None,
    ),
    (
        "portail",
        8134821,
        "Max Vakhtbovych",
        "Illustration : entrée de maison, piliers et cour dallée. Photo libre de droits, pas un chantier CTH.",
        None,
    ),
    (
        "fenetres",
        5691516,
        "Pexels",
        "Illustration : pose d'un vitrage. Photo libre de droits, ce n'est pas une équipe CTH.",
        None,
    ),
    (
        "volets",
        17745879,
        "Sofía Nuñez",
        "Illustration : fenêtre et volets sur une façade. Photo libre de droits, pas un chantier CTH.",
        None,
    ),
    (
        "allees",
        33453262,
        "Bas Linders",
        "Illustration : chemin menant à une maison de village. Photo libre de droits, pas un chantier CTH.",
        None,
    ),
    (
        "interieurs",
        1571460,
        "Pexels",
        "Illustration : pièce de vie lumineuse. Photo libre de droits, pas un chantier CTH.",
        None,
    ),
    (
        "ventilation",
        259962,
        "Pexels",
        "Illustration : pièce claire et ouverte. Photo libre de droits, pas une installation CTH.",
        None,
    ),
    (
        "contact",
        32289743,
        "Ryan Klaus",
        "Illustration : maison en pierre dans un jardin. Photo libre de droits, pas un chantier CTH.",
        None,
    ),
]

STAGES = ("avant", "pendant", "apres")
STAGE_LABEL = {"avant": "AVANT", "pendant": "PENDANT", "apres": "APRÈS"}
STAGE_COLOR = {"avant": (214, 206, 194), "pendant": (196, 188, 174), "apres": (214, 224, 208)}
CHANTIER_SLUGS = [
    "toiture",
    "facade",
    "ravalement",
    "isolation",
    "menuiserie",
    "portail",
    "fenetres",
    "volets",
    "allees",
    "interieurs",
    "ventilation",
]


def download(pid: int) -> Path:
    dest = TMP / f"{pid}.jpg"
    if dest.exists() and dest.stat().st_size > 20000:
        return dest
    url = f"https://images.pexels.com/photos/{pid}/pexels-photo-{pid}.jpeg?auto=compress&cs=tinysrgb&w=2000"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as res:
        dest.write_bytes(res.read())
    return dest


def to_webp(src: Path, dest: Path, width: int, crop: str | None) -> tuple[int, int]:
    dest.parent.mkdir(parents=True, exist_ok=True)
    vf = []
    if crop:
        vf.append(crop)
    vf.append(f"scale={width}:{width}:force_original_aspect_ratio=decrease")
    subprocess.check_call(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(src),
            "-vf",
            ",".join(vf),
            "-c:v",
            "libwebp",
            "-quality",
            "72",
            str(dest),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    with Image.open(dest) as im:
        return im.size


def placeholder(path: Path, stage: str, slug: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    w, h = 1600, 1000
    im = Image.new("RGB", (w, h), STAGE_COLOR[stage])
    draw = ImageDraw.Draw(im)
    # grain léger
    px = im.load()
    import random

    rng = random.Random(slug + stage)
    for _ in range(4000):
        x, y = rng.randrange(w), rng.randrange(h)
        delta = rng.choice((-10, -6, 6, 10))
        r, g, b = px[x, y]
        px[x, y] = (max(0, min(255, r + delta)), max(0, min(255, g + delta)), max(0, min(255, b + delta)))
    draw = ImageDraw.Draw(im)
    margin = 48
    draw.rectangle((margin, margin, w - margin, h - margin), outline=(22, 22, 22), width=2)
    if stage == "apres":
        draw.rectangle((margin, h - margin - 10, w - margin, h - margin), fill=(106, 170, 56))
    font_big = ImageFont.truetype("/usr/share/fonts/truetype/noto/NotoSerif-Bold.ttf", 92)
    font_mid = ImageFont.truetype("/usr/share/fonts/truetype/macos/Inter-Medium.ttf", 32)
    font_small = ImageFont.truetype("/usr/share/fonts/truetype/macos/Inter-Regular.ttf", 24)
    label = STAGE_LABEL[stage]
    bbox = draw.textbbox((0, 0), label, font=font_big)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((w - tw) / 2, (h - th) / 2 - 40), label, fill=(22, 22, 22), font=font_big)
    sub = "Photo de chantier à venir"
    bbox = draw.textbbox((0, 0), sub, font=font_mid)
    sw = bbox[2] - bbox[0]
    draw.text(((w - sw) / 2, (h - th) / 2 + 80), sub, fill=(50, 50, 50), font=font_mid)
    file_line = f"chantiers/{slug}/{stage}.webp"
    draw.text((margin + 24, h - margin - 56), file_line, fill=(50, 50, 50), font=font_small)
    draw.text((w - margin - 90, margin + 20), "CTH", fill=(22, 22, 22), font=font_mid)
    im.save(path, "WEBP", quality=70, method=4)


def og_image() -> None:
    w, h = 1200, 630
    im = Image.new("RGB", (w, h), (243, 241, 235))
    draw = ImageDraw.Draw(im)
    draw.rectangle((0, 0, 16, h), fill=(106, 170, 56))
    font_k = ImageFont.truetype("/usr/share/fonts/truetype/macos/Inter-SemiBold.ttf", 22)
    font_b = ImageFont.truetype("/usr/share/fonts/truetype/noto/NotoSerif-Bold.ttf", 68)
    font_s = ImageFont.truetype("/usr/share/fonts/truetype/macos/Inter-Regular.ttf", 28)
    draw.text((72, 150), "CTH  ·  SAINT-JEAN-DE-BRAYE", fill=(78, 140, 42), font=font_k)
    draw.text((72, 210), "L'artisanat au service", fill=(22, 22, 22), font=font_b)
    draw.text((72, 290), "de votre habitat", fill=(22, 22, 22), font=font_b)
    draw.text((72, 430), "Toiture, façade, isolation, menuiserie.", fill=(50, 50, 50), font=font_s)
    draw.text((72, 472), "Orléans et le Loiret.", fill=(50, 50, 50), font=font_s)
    dest = ROOT / "assets/images/og.jpg"
    im.save(dest, "JPEG", quality=82, optimize=True)


def main() -> None:
    previous = json.loads((ROOT / "assets/images/manifest.json").read_text(encoding="utf-8"))
    manifest = {"illustrations": {}, "chantiers": {}}
    lines = [
        "Illustrations du site CTH",
        "Licence Pexels : https://www.pexels.com/license/",
        "Utilisation gratuite, y compris commerciale. Attribution non obligatoire.",
        "Ces images sont des photos d'illustration. Ce ne sont pas des réalisations CTH.",
        "",
    ]
    for name, pid, author, alt, crop in PHOTOS:
        src = download(pid)
        d1600 = ILLU / f"{name}-1600.webp"
        d800 = ILLU / f"{name}-800.webp"
        w, h = to_webp(src, d1600, 1600, crop)
        to_webp(src, d800, 800, crop)
        page = f"https://www.pexels.com/photo/{pid}/"
        manifest["illustrations"][name] = {
            "src": f"images/illustrations/{name}-1600.webp",
            "srcset": f"images/illustrations/{name}-800.webp 800w, images/illustrations/{name}-1600.webp 1600w",
            "width": w,
            "height": h,
            "alt": alt,
        }
        who = author if author and author != "Pexels" else "auteur : voir la page Pexels"
        lines.append(f"{name}-1600.webp / {name}-800.webp")
        lines.append(f"  Page : {page}")
        lines.append(f"  Auteur : {who}")
        lines.append("  Licence : Pexels License")
        lines.append("")
        print(f"illu {name} {w}x{h}")

    for slug in CHANTIER_SLUGS:
        kept = previous.get("chantiers", {}).get(slug)
        if kept and kept.get("real"):
            manifest["chantiers"][slug] = kept
            print("conserve", slug)
            continue
        manifest["chantiers"][slug] = {}
        for stage in STAGES:
            rel = f"images/chantiers/{slug}/{stage}.webp"
            placeholder(ROOT / "assets" / rel, stage, slug)
            manifest["chantiers"][slug][stage] = {
                "src": rel,
                "width": 1600,
                "height": 1000,
                "alt": f"Emplacement {STAGE_LABEL[stage].lower()} du chantier {slug}, photo à venir.",
            }
        print("chantier", slug)

    og_image()
    (ROOT / "assets/images/manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    lines.append("Les photos de chantiers marquées « real » dans manifest.json sont des clichés de CTH.")
    lines.append("Elles ne sont pas sous licence Pexels. Visages, plaques et numéros de rue lisibles ont été masqués.")
    lines.append("Les autres fichiers images/chantiers/ sont des cadres générés pour ce site (pas des photos tierces).")
    (ROOT / "assets/images/LICENSES.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("done")


if __name__ == "__main__":
    main()
