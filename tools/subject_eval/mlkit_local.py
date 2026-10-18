"""Run ML Kit's own image labeller on the laptop, over the local set.

    python -I mlkit_local.py <model.tflite>

The phone uses com.google.mlkit:image-labeling 17.0.9, whose AAR ships the
base labeller as a plain TFLite file (assets/mlkit_label_default_model/
mobile_ica_8bit_with_metadata_tflite). Its metadata zip carries the label
names and ML Kit's per-label score calibration. This runs that file with
LiteRT, calibrates as the TFLite Task Library does (sigmoid; an empty line or
a raw score under the line's minimum scores 0), keeps labels at or above the
patched floor of 0.15, and writes them into manifest.jsonl as the phone would
record them. evaluate.py then scores every pair with phone_rules, exactly as
subject.ts does.

Same model, not the same code path: ML Kit's own resize of the photo to
224x224 is not published, so a label's confidence can differ a little from
the phone's. The manifest keeps a .bak of what it replaced.
"""

from __future__ import annotations

import io
import json
import math
import sys
import zipfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import data_dir  # noqa: E402
from phone_rules import photo_passes, score_subject  # noqa: E402

LABEL_FLOOR = 0.15  # SUBJECT_LABEL_FLOOR, the patched setConfidenceThreshold


class Labeller:
    def __init__(self, path: Path):
        from ai_edge_litert.interpreter import Interpreter

        self.it = Interpreter(model_path=str(path))
        self.it.allocate_tensors()
        self.inp = self.it.get_input_details()[0]
        self.out = self.it.get_output_details()[0]
        meta = zipfile.ZipFile(io.BytesIO(path.read_bytes()))
        self.names = meta.read("0-labels-en.txt").decode("utf-8").split("\n")
        self.cal = []
        for line in meta.read("0-score-calibration.txt").decode("utf-8").split("\n"):
            parts = [float(x) for x in line.split(",")] if line.strip() else None
            self.cal.append(parts)
        n = int(self.out["shape"][-1])
        if len(self.names) != n or len(self.cal) != n:
            raise SystemExit(f"model has {n} outputs, {len(self.names)} names, {len(self.cal)} calibrations")

    def label(self, img: Image.Image) -> list[tuple[str, float]]:
        _, h, w, _ = self.inp["shape"]
        x = np.asarray(img.convert("RGB").resize((w, h), Image.BILINEAR), dtype=np.uint8)[None]
        self.it.set_tensor(self.inp["index"], x)
        self.it.invoke()
        q = self.it.get_tensor(self.out["index"]).reshape(-1).astype(np.float32)
        scale, zero = self.out["quantization"]
        raw = (q - zero) * scale
        out = []
        for name, r, c in zip(self.names, raw, self.cal):
            if c is None or (len(c) > 3 and r < c[3]):
                continue
            s = c[0] / (1 + math.exp(-(c[1] * r + c[2])))
            if s >= LABEL_FLOOR:
                out.append((name, float(s)))
        return sorted(out, key=lambda l: -l[1])


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    labeller = Labeller(Path(sys.argv[1]))
    root = data_dir()
    manifest = root / "manifest.jsonl"
    rows = [json.loads(ln) for ln in manifest.read_text(encoding="utf-8").splitlines() if ln]
    cache: dict[str, list[tuple[str, float]]] = {}
    for r in rows:
        if r["kind"] != "photo":
            continue
        f = r["file"]
        if f not in cache:
            cache[f] = labeller.label(ImageOps.exif_transpose(Image.open(root / "files" / f)))
        labels = cache[f]
        s = score_subject(labels, r["subject"])
        r["mlkit"] = {
            # the shape the phone uploads (subject_measured), plus every label
            # so evaluate.py can score this photo against another task's subject
            "measured": {"score": round(s.score, 3), "forbidden": round(s.forbidden, 3), "labels": s.seen,
                         "hit": s.hit, "veto": s.veto, "all": [[n, round(c, 4)] for n, c in labels]},
            "warned": not photo_passes(s.score),
            "forbidden_warned": False,
            "unscored": None,
            "source": "laptop",
        }
    bak = manifest.with_suffix(".jsonl.bak")
    if not bak.exists():
        bak.write_text(manifest.read_text(encoding="utf-8"), encoding="utf-8")
    manifest.write_text("\n".join(json.dumps(r) for r in rows) + "\n", encoding="utf-8")
    print(f"labelled {len(cache)} photos -> {manifest}")


if __name__ == "__main__":
    main()
