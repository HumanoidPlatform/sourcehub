"""Embed every exported capture and every task subject with one CLIP-style model.

    python score_clip.py --model clip-b32        (then pe-core-s16, siglip2-b16)

Writes out/<model>/embeddings.npz: per capture file, an array (frames, views, dim)
of unit vectors — views are the whole frame, a 2x2 grid and a centre crop; a
photo is one frame, a clip the frames the phone would sample (phone_rules.
frame_times) — and per task the subject's text vector, plus the negatives'.
evaluate.py pairs them up; nothing is decided here.

Prompts follow the research: several phrasings per phrase, averaged; the
subject is its labels when the task lists them, else its domain and must_show,
exactly the phrases the phone matches today. Never a negation in a prompt.
"""

from __future__ import annotations

import argparse
import io
import json
import sys
from pathlib import Path

import numpy as np
import torch
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import data_dir  # noqa: E402
from phone_rules import frame_times  # noqa: E402

MODELS = {
    # the model react-native-executorch ships today
    "clip-b32": ("ViT-B-32", "openai"),
    # the upgrades the research names; both Apache-2.0
    "pe-core-s16": ("PE-Core-S-16-384", "meta"),
    "siglip2-b16": ("ViT-B-16-SigLIP2", "webli"),
}

TEMPLATES = [
    "a photo of {}.",
    "a photo showing {}.",
    "a close-up photo of {}.",
    "a wide photo of {}.",
    "a phone photo of {}.",
    "{}",
]

HERE = Path(__file__).resolve().parent


def subject_phrases(subject: dict) -> list[str]:
    labels = [p for p in (subject.get("labels") or []) if p.strip()]
    if labels:
        return labels
    return [p for p in [subject.get("domain", ""), *(subject.get("must_show") or [])] if p.strip()]


def negatives() -> list[str]:
    lines = (HERE / "negatives.txt").read_text(encoding="utf-8").splitlines()
    return [ln.strip() for ln in lines if ln.strip() and not ln.startswith("#")]


def views(img: Image.Image) -> list[Image.Image]:
    """Whole frame, the four quarters, the centre 60%."""
    w, h = img.size
    out = [img]
    for x in (0, w // 2):
        for y in (0, h // 2):
            out.append(img.crop((x, y, x + w // 2, y + h // 2)))
    out.append(img.crop((int(w * 0.2), int(h * 0.2), int(w * 0.8), int(h * 0.8))))
    return out


def photo_frames(path: Path) -> list[Image.Image]:
    if path.suffix.lower() == ".heic":
        import pillow_heif

        pillow_heif.register_heif_opener()
    img = Image.open(path)
    from PIL import ImageOps

    return [ImageOps.exif_transpose(img).convert("RGB")]


def clip_frames(path: Path, duration_s: float | None) -> list[Image.Image]:
    """The frames the phone would label, re-encoded as it does (JPEG q60)."""
    import av

    out = []
    with av.open(str(path)) as c:
        stream = c.streams.video[0]
        d = duration_s or (float(stream.duration * stream.time_base) if stream.duration else
                           c.duration / 1_000_000 if c.duration else 0)
        for t in frame_times(d):
            c.seek(int(t / stream.time_base), stream=stream, any_frame=False, backward=True)
            frame = None
            for f in c.decode(stream):
                frame = f
                if f.time is not None and f.time >= t:
                    break
            if frame is None:
                continue
            buf = io.BytesIO()
            frame.to_image().save(buf, "JPEG", quality=60)
            out.append(Image.open(io.BytesIO(buf.getvalue())).convert("RGB"))
    return out


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--model", choices=MODELS, default="clip-b32")
    p.add_argument("--batch", type=int, default=64)
    args = p.parse_args()

    import open_clip

    name, pretrained = MODELS[args.model]
    model, _, preprocess = open_clip.create_model_and_transforms(name, pretrained=pretrained)
    tokenizer = open_clip.get_tokenizer(name)
    model.eval()
    torch.set_grad_enabled(False)

    root = data_dir()
    rows = [json.loads(ln) for ln in (root / "manifest.jsonl").read_text(encoding="utf-8").splitlines() if ln]
    out = root / "out" / args.model
    out.mkdir(parents=True, exist_ok=True)

    def embed_text(phrases: list[str]) -> np.ndarray:
        """One unit vector per phrase: its templates, averaged."""
        vecs = []
        for ph in phrases:
            t = model.encode_text(tokenizer([tpl.format(ph) for tpl in TEMPLATES]))
            t = torch.nn.functional.normalize(t, dim=-1).mean(0)
            vecs.append(torch.nn.functional.normalize(t, dim=-1).numpy())
        return np.stack(vecs)

    def embed_images(imgs: list[Image.Image]) -> np.ndarray:
        vecs = []
        for i in range(0, len(imgs), args.batch):
            x = torch.stack([preprocess(im) for im in imgs[i : i + args.batch]])
            vecs.append(torch.nn.functional.normalize(model.encode_image(x), dim=-1).numpy())
        return np.concatenate(vecs)

    arrays: dict[str, np.ndarray] = {}
    tasks: dict[str, dict] = {}
    for n, r in enumerate(rows, 1):
        tasks[r["task_id"]] = r["subject"]
        # keyed by file: the local set pairs one mistake photo with every scenario
        if "img:" + r["file"] in arrays:
            continue
        path = root / "files" / r["file"]
        try:
            frames = photo_frames(path) if r["kind"] == "photo" else clip_frames(path, r["duration_s"])
        except Exception as e:  # noqa: BLE001
            print(f"  {r['file']}: unreadable ({type(e).__name__}: {e})")
            continue
        if not frames:
            print(f"  {r['file']}: no frames")
            continue
        per_frame = [views(f) for f in frames]
        flat = embed_images([v for vs in per_frame for v in vs])
        arrays["img:" + r["file"]] = flat.reshape(len(frames), len(per_frame[0]), -1).astype(np.float16)
        if n % 25 == 0:
            print(f"  {n}/{len(rows)} captures")

    for task_id, subject in tasks.items():
        arrays["txt:" + task_id] = embed_text(subject_phrases(subject))
    neg = negatives()
    arrays["neg"] = embed_text(neg)
    arrays["logit_scale"] = np.array(float(model.logit_scale.exp()))
    np.savez_compressed(out / "embeddings.npz", **arrays)
    (out / "negatives_used.json").write_text(json.dumps(neg, indent=1), encoding="utf-8")
    print(f"{args.model}: {sum(k.startswith('img:') for k in arrays)} captures, {len(tasks)} subjects -> {out}")


if __name__ == "__main__":
    main()
