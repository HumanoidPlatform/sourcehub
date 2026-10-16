# Research: On-device alternatives to ML Kit image labelling for capture subject checks
**Generated**: 2026-10-16T21:18:45+05:30
**Duration**: ~6m 43s research run (312 sources consulted); ~13 min end-to-end including submission and extraction
**Source**: Claude.ai Research Feature
**Query**: We run a React Native (Expo, dev builds, Android first, iOS later) data-capture app where crowd workers take photos and short videos for tasks. On the phone, before upload, we check whether a capture shows the task's subject. The subject is free text typed by a client, e.g. "supermarket shelf with price tags", "a person operating a laptop", "street-level shop fronts", plus optional must_show and must_not_show phrases. Today we use Google ML Kit on-device image labelling (@react-native-ml-kit/image-labeling, fixed ~400-label vocabulary, confidence floor patched to 0.15) and match the returned label words against the subject words; for videos we score sampled frames. We get many wrong detections: false "wrong subject" warnings and false passes, because the vocabulary is closed, labels are generic (room, product, furniture), and matching is by word rather than meaning.

Requirement: EVERYTHING MUST RUN ON THE PHONE, offline. No server or cloud inference.

Please research and compare on-device alternatives and pipelines for this "does this image/frame show <free-text subject>, and does it show any <forbidden thing>" check:
- Open-vocabulary image-text embedding models: MobileCLIP / MobileCLIP2 (Apple), SigLIP / SigLIP2 small variants, TinyCLIP, EfficientCLIP etc. — zero-shot scoring of an image against text prompts, prompt ensembling, negative prompts.
- Open-vocabulary detectors: YOLO-World (and its mobile/TFLite exports), YOLOE, OWL-ViT/OWLv2, Grounding DINO tiny, NanoOWL — feasibility on phones.
- Small on-device vision-language models: SmolVLM, Moondream, Gemma 3n via MediaPipe LLM Inference / LiteRT, Qwen2.5-VL small, PaliGemma — yes/no answering about a subject; realistic latency and memory on mid-range Android.
- Classic options: ML Kit custom TFLite models, ML Kit Object Detection, MediaPipe Image Classifier / Image Embedder / Object Detector, fine-tuned classifiers.
- Runtimes and React Native integration: react-native-fast-tflite, LiteRT (TFLite) with GPU/NNAPI delegates, ONNX Runtime React Native, ExecuTorch / react-native-executorch, MediaPipe; Expo config-plugin / dev-build implications; model download size and over-the-air model delivery.
For each: accuracy on free-text subjects (any benchmarks), model size, inference time on mid-range Android (e.g. Snapdragon 6/7-series, 4–6 GB RAM), memory, licence (commercial use), maturity, and integration effort in React Native/Expo.
Also cover: how to calibrate thresholds for zero-shot scores (e.g. per-task relative scoring vs. a set of generic negative prompts, softmax over prompt sets, temperature), handling "subject present among other things" vs dominance, video frame sampling strategies, combining a cheap detector with a heavier verifier, and how to evaluate offline against a labelled set of real accepted/rejected captures.
End with a clear ranked recommendation and a migration path from our current ML Kit label-word matching.

---

> Citation markers like `[7]` refer to the numbered list under "Sources Referenced". Source chips that the report showed inside table cells without a resolvable link are kept as plain text in parentheses (e.g. "(github, github)").

# On-Device "Does This Capture Show <Subject>?" Checks for an Expo/React Native App: Models, Runtimes, Scoring and a Migration Plan (October 2026)

Replace ML Kit label-word matching with an open-vocabulary image–text embedding model (a CLIP-family dual encoder) running fully on the phone. Score each capture against an ensemble of subject prompts and a bank of generic and hard-negative prompts, using a temperature and bias calibrated on your own labelled captures. Ship it first with react-native-executorch's built-in CLIP ViT-B/32. Then move to a commercially licensed, stronger encoder: Meta's PE-Core-S/T or Google's SigLIP2-B/16, both Apache-2.0. Do not use Apple's MobileCLIP/MobileCLIP2: the weights are research-only. Open-vocabulary detectors and small VLMs are the wrong primary tool on 4–6 GB mid-range Android. Use fixed detectors only for specific forbidden items such as faces and people. A VLM verifier is optional and only for high-RAM devices.

## TL;DR

- **Best fit:** a CLIP-style dual encoder (start with OpenAI CLIP ViT-B/32 via react-native-executorch, then move to PE-Core-S/16 or SigLIP2-B/16, both Apache-2.0). Score each capture with prompt ensembles, a negative-prompt bank and multi-crop max-pooling, and convert scores to decisions with a temperature and bias fitted on your own accepted/rejected captures. This fixes your closed vocabulary and word-matching problems and needs well under 1 GB of RAM.
- **Avoid as primary checks:** MobileCLIP/MobileCLIP2 weights are licensed "exclusively for Research Purposes", so commercial use is excluded. YOLO-World is GPL-3.0 and YOLOE is AGPL-3.0, and YOLOE bakes prompts into the exported model, so free text can't be changed per task. OWLv2/NanoOWL are built for TensorRT on Jetson. Gemma 3n E2B needs about 2.7 GB of peak RAM and takes 6.7 s to the first token on a flagship CPU. None of these fits Snapdragon 6/7-series phones with 4–6 GB.
- **Migration:** run the new scorer in shadow mode next to ML Kit, collect labelled disagreements, fit thresholds per task type with bootstrapped confidence intervals, then switch the user-facing warning. Keep ML Kit's dedicated face detection (and similar fixed detectors) for must_not_show people/faces/plates. Keep a CLIP-only check where compositional subjects ("a person operating a laptop") are handled by decomposing them into concept checks.

## Key Findings

### 1. Why the current pipeline fails, and what fixes it

Your failure modes are structural. ML Kit's base labeller has a fixed vocabulary: Google's ML Kit documentation says the default model "supports 400+ different labels", trained "to recognize 400 categories that describe the most commonly-found objects in photos". Its labels are generic, and matching by word ignores meaning. A dual encoder embeds the image and arbitrary text into one space, so "supermarket shelf with price tags" is compared by meaning, not by words. This removes the vocabulary problem entirely. The remaining problems are calibration, multi-object scenes and compositional phrasing, and each has a known mitigation (sections 4–6).

### 2. Open-vocabulary embedding models (primary candidates)

| Model | Params (image + text) | Zero-shot IN-1k | Licence (weights) | Verdict for you |
| --- | --- | --- | --- | --- |
| MobileCLIP2-S0 [1] | 11.4M + 63.4M | 71.5% | Apple ML Research Model licence, research-only | Best accuracy per ms, but not usable commercially |
| MobileCLIP2-S2 | 35.7M + 63.4M | 77.2% | same | same |
| MobileCLIP2-B | 86.3M + 63.4M | 79.4% | same | same |
| MobileCLIP2-S4 | 321.6M + 123.6M | 81.9% | same | same, and too big |
| OpenAI CLIP ViT-B/32 (react-native-executorch build) | ~88M image tower; 352 MB model file (fp32) | 63.2% (Radford et al. 2021; OpenCLIP's LAION-400M replication: 62.96%) | MIT (OpenAI CLIP release) | Fastest path to production: built into react-native-executorch with image and text hooks |
| PE-Core-T/16 @384 (Meta) | 0.01B vision + 0.04B text | 62.1% | Apache-2.0 | Tiny towers, commercially clean. Similar accuracy to CLIP-B/32; validate on your data (github [2], github [3]) |
| PE-Core-S/16 @384 (Meta) | 0.02B vision + 0.04B text | 72.7% (ObjectNet 60.0, COCO T2I 42.6) | Apache-2.0 | Recommended upgrade target: best accuracy-per-size with a commercial licence (github [2]) |
| SigLIP2-B/16 (Google) | ~86M vision; HF lists ~0.4B total (large multilingual text tower) | 79.1% reported for B/16@256 | Apache-2.0 | Most accurate permissive option. Heavy text tower; preprocessing gotcha (see below) (huggingface [4] +2) |
| TinyCLIP ViT-8M/16 (Microsoft) | 8M + 3M (23.4M total) | 41.1% | MIT | Too weak for free-text subjects (promptlayer [5], arxiv [6]) |

Notes on the table:

- **Apple's licence is the deciding factor for MobileCLIP.** The model terms grant use "exclusively for Research Purposes" and state that "Research Purposes" excludes "any commercial exploitation, product development or use in any commercial product or service". [7] This applies to MobileCLIP, MobileCLIP2 and FastVLM. [8] The repository code is MIT, but the weights are not. [9] An Ultralytics fork of MobileCLIP exists under AGPL-3.0; it does not change the Apple weight terms. [10] Treat MobileCLIP as a benchmark reference only, unless Apple grants you a commercial licence.
- **SigLIP2 preprocessing gotcha.** A Hugging Face forum user measured 70.6% for siglip2-base-patch16-256 against a reported 79.1%. The cause was ImageNet mean/std normalisation instead of SigLIP's [0.5, 0.5, 0.5]. [11] Your mobile preprocessing must match the training preprocessing exactly, or accuracy silently drops by points. Check this before blaming the model.
- **Compute is driven by token count, not just parameter count.** PE-Core-S/16 at 384 px processes 576 patches; CLIP-B/32 at 224 px processes 49. Per-image compute is therefore comparable despite the 4× parameter gap. Exporting PE at 224–256 px is an option, but evaluate the accuracy loss first.
- **Text tower size matters for an on-device text encoder.** PE-Core's text tower is 0.04B parameters, roughly 40 MB at int8. [2] SigLIP2's multilingual text tower dominates its ~0.4B total. Pre-embedding prompts (section 7) avoids shipping it.

### 3. Open-vocabulary detectors: not the primary tool

| Model | Licence | On-phone feasibility | Problem |
| --- | --- | --- | --- |
| YOLO-World v2 (Tencent) | GPL-3.0 (commercial licence on request) | Exportable, but the text encoder must be on-device or the vocabulary is baked in | Copyleft risk for a closed-source app (github [12]) |
| YOLOE / YOLOE-26 (Ultralytics) | AGPL-3.0 (Enterprise licence for closed source) | TFLite/ONNX export works | "YOLOE bakes the prompted classes into the weights at export time, so a loaded export rejects both set_classes() and visual_prompts=". Per-task free text would need a new export per task, or custom surgery to feed prompt embeddings at runtime. Text-prompt setup downloads a ~254 MB text encoder. YOLOE-26x reaches 40.6 AP on LVIS minival (ultralytics [13], arxiv [14]) |
| OWL-ViT / OWLv2 / NanoOWL | Apache-2.0 | NanoOWL targets NVIDIA Jetson with TensorRT (github [15]) | One Jetson AGX Orin user measured ~40–60 ms (OWL-ViT B/32) and ~400 ms for OWLv2-B/16 at 960 px (nvidia [16]). A phone CPU/GPU would be far slower |
| Grounding DINO tiny / 1.5–1.6 Edge | Original is Apache-2.0; the 1.5/1.6 Edge models have been offered via API rather than as open weights (verify current status) | Swin-T plus BERT text branch, too heavy for 4–6 GB Android | Not a phone model |

Conclusion: for "does the scene show X", a detector adds cost, licensing risk and per-task export complexity without solving scene-level subjects ("street-level shop fronts"). Use detectors only where you need **localisation or recall of small forbidden objects**. Prefer permissively licensed fixed-class detectors for those: ML Kit face detection, MediaPipe BlazeFace, or RF-DETR / SSDLite (both shipped in react-native-executorch). Note that react-native-executorch also ships YOLO26, which is Ultralytics AGPL-3.0, so check the licence before using it. [17]

### 4. Small on-device VLMs: a high-end-only verifier at best

| Model | Size / memory | Measured speed | Licence | Fit |
| --- | --- | --- | --- | --- |
| Gemma 3n E2B (LiteRT) | 2,991 MB file; 2,704 MB peak RSS (CPU) | S25 Ultra: CPU time to first token 6.7 s, GPU 12.7 s (vision encoder on GPU, 512×512) | Gemma Terms of Use | Too heavy for 4–6 GB devices (huggingface [18], b-lab [19]) |
| Gemma 4 E2B (LiteRT-LM) | 2,583 MB file; 1,733 MB CPU memory (CPU backend), 676 MB (GPU backend) | S26 Ultra: GPU time to first token 0.3 s; CPU 1.8 s (huggingface [20]) | Gemma terms | Only plausible VLM verifier, and only on 8 GB+ flagships. Also shipped in react-native-executorch as gemma4_e2b_multimodal (swmansion [21]) |
| SmolVLM2-500M | ~1 GB at FP16 | On a low-end Vivo Y27 via llama.cpp, INT8: ~29.9 s latency, 762 MB peak DRAM | Apache-2.0 | Too slow for a pre-upload gate (emergentmind [22], forasoft [23]) |
| Moondream 2 0.5B | 479 MiB download / 996 MiB RAM (int8) | Vendor says out-of-the-box accuracy is limited; meant as a fine-tuning base (moondream [24]) | Moondream Model License 1.0 (on-device commercial use allowed) (moondream [25]) | Only if fine-tuned |
| Moondream 3 / 3.1 | 9B total / 2B active MoE | — | BSL 1.1 → Moondream Model License 1.0 | Not a phone model (moondream [26], orcarouter [27]) |
| LFM2.5-VL 450M / 1.6B | — | — | Liquid AI licence (check terms) | Shipped in react-native-executorch; an easy experiment (swmansion [21]) |
| Qwen2.5-VL-3B / PaliGemma 2 / FastVLM | ≥3B or research-licensed | — | Qwen-3B has historically carried a non-Apache research licence (verify); PaliGemma uses Gemma terms; FastVLM is Apple research-only | Not recommended |

Interpretation: VLMs handle relational subjects ("a person *operating* a laptop") much better than CLIP. But even the best mobile VLM in 2026 needs 0.7–2.7 GB of RAM and seconds of latency outside flagships. On your 4–6 GB Snapdragon 6/7-series target, a VLM would risk out-of-memory kills alongside the camera. Use it only as an opt-in borderline verifier on devices with RAM ≥ 8 GB, and never as the gate.

### 5. Classic options

- **ML Kit custom TFLite model / MediaPipe Image Classifier:** a fixed-class classifier fine-tuned on your task types would be accurate for recurring subjects, but cannot handle arbitrary client text. It is useful later as a per-category specialist.
- **MediaPipe Image Embedder:** image-only embeddings with no text tower, so it cannot do text matching. It is useful for near-duplicate and quality checks.
- **ML Kit Object Detection:** coarse classes. Keep **ML Kit face detection** for must_not_show "faces/people", because it is a dedicated detector, unlike CLIP's weak small-object recall.

### 6. Runtimes and React Native/Expo integration

| Runtime / package | Status (Oct 2026) | Expo | Acceleration | Best use |
| --- | --- | --- | --- | --- |
| react-native-executorch (Software Mansion), v0.10.0 | Hooks include useImageEmbeddings/useTextEmbeddings (CLIP ViT-B/32 image and text, plus a quantized image variant), object detection (SSDLite, YOLO26, RF-DETR), VLMs via useLLM (LFM2.5-VL, Gemma 4 E2B), VisionCamera v5 frame worklets, and custom .pte models (swmansion [17], swmansion [21], github [28]) | @react-native-executorch/expo-resource-fetcher (model download/caching); dev build required | XNNPACK, Vulkan (Android), Core ML / MLX (iOS) | Recommended: CLIP out of the box, and same API on iOS |
| react-native-fast-tflite (Margelo) | Nitro Modules, zero-copy buffers; Expo config plugin with enableAndroidGpuLibraries; Core ML delegate on iOS | Config plugin + prebuild | GPU delegate; NNAPI deprecated on Android 15 | Good if you export to LiteRT/TFLite yourself (github +2) |
| onnxruntime-react-native | Expo config plugin; npx expo prebuild; some users needed a custom plugin to register the Android package | Plugin + dev build | NNAPI, XNNPACK, Core ML, QNN | Easiest export path from PyTorch/HF (ONNX); also a Nitro wrapper (react-native-nitro-onnxruntime) (github [29] +3) |
| MediaPipe Tasks / LiteRT-LM | Native Android/iOS SDKs; RN wrappers are community-maintained | Custom native module | GPU/NPU | Only if you adopt a Gemma VLM verifier |

Measured CLIP ViT-B/32 numbers from react-native-executorch:

- Inference: about 55–58 ms on a OnePlus 12 and 66 ms on a Galaxy S24 (XNNPACK, older docs). [30][31]
- Peak memory increase: about 345–350 MB on Android (XNNPACK FP32). [32][33]
- Galaxy S26 Ultra (v0.10 harness): 17.4 ms with Vulkan fp16 versus 24.6 ms with XNNPACK fp32. [34]
- iPhone 16: Core ML fp16 takes 3.48 ms versus 67.2 ms on XNNPACK fp32 (a 19.3× speed-up), and cuts peak memory from 432 MB to 242 MB. [35]
- A maintainer issue reports that "24 of 42 comparable model/backend pairs are slower on 0.10", so benchmark the exact version you ship. [36]

**Mid-range Android is the evidence gap.** No published TFLite, ONNX or ExecuTorch numbers exist for MobileCLIP, SigLIP2 or PE-Core image encoders on Snapdragon 6/7-series or Pixel a-series phones. The only citable mid-range figure is from Qualcomm AI Hub, for OpenAI CLIP ViT-B/16 (image + text, 150M parameters, w8a16):

- Snapdragon 7 Gen 4 NPU: 37–41 ms.
- Dragonwing Q-6690 (6-class): 270–400 ms.
- CPU-only TFLite float on 7-class automotive SoCs: 520–750 ms. [37]

Our extrapolation, not a measurement: expect B/32-class encoders to take roughly 100–250 ms per image on a Snapdragon 7-series CPU with XNNPACK, and less with a working GPU/Vulkan path. Measure this on your own reference devices in week 1.

### 7. Text encoder and prompt delivery

A CLIP pipeline needs the tokenizer and text tower on the phone if subjects are embedded on the device. Two compliant patterns:

1. **On-device text encoding (strictly offline):** encode the subject, must_show and must_not_show prompts once when the task is downloaded, then cache the vectors. With CLIP-B/32 or PE-Core (text ~0.04B parameters) this is a one-off cost of tens to hundreds of milliseconds per prompt.
2. **Pre-embedded vectors shipped with the task:** compute 512-dimensional vectors when the client creates the task and ship them as task data. Image inference still runs on the phone. If "no server inference" is a hard policy, use pattern 1. Pattern 2 is still the right choice for SigLIP2, whose text tower is large.

Either way, **pin the model version to the vectors**: store `model_id` + `prompt_version` with each embedding, and re-embed when the model changes.

## Details

### Scoring and calibration recipe (CLIP-family)

1. **Prompt ensembling:** expand each subject into 4–8 templates ("a photo of {s}", "a phone photo of {s}", "a close-up photo of {s}", "{s}", "a blurry photo of {s}"). Average the L2-normalised text embeddings, as in the CLIP ImageNet recipe.
2. **Negative bank:**
   - **Generic negatives** (~20–40, fixed): "a photo of a floor", "a blank wall", "the inside of a pocket", "a blurry photo", "a screenshot", "a person's face", "a room", "a ceiling", "darkness", "a finger covering the lens", and so on.
   - **Task-adjacent hard negatives:** auto-generate siblings of the subject, e.g. "an empty supermarket shelf", "a shelf without price tags", "a warehouse shelf". This is where most false passes are prevented.
3. **Score features:**
   - `s_pos` = cosine to the subject ensemble.
   - `margin` = `s_pos − max(s_neg)`.
   - `p_softmax` = softmax over [subject, negatives] at CLIP's logit scale of 100 (equivalent to τ = 0.01). [38]
   - Rank of the subject among the bank.
   - For SigLIP-family models, the pairwise sigmoid with its learned bias is natively a presence score and needs no competition.
4. **Calibration:** zero-shot CLIP is miscalibrated. LeVine et al. (arXiv:2303.12748) found that "the optimal temperature T across prompts and inference datasets are approximately the same", but that T "needs to be trained per architecture/pre-training dataset pair" (about 1.55 vs 1.35 in their Fig. 2). Tu, Deng & Gedeon ("A Closer Look at the Robustness of CLIP", arXiv:2402.07410, §6.2) found that "after temperature scaling, for models with similar image classification accuracy, zero-shot CLIP models achieve better calibration performance compared to other models, including their fine-tuned counterparts". They also caution that CLIP models "are not consistently more calibrated than other ImageNet models". In practice, fit a **logistic regression on (margin, s_pos, crop-max, rank)** per model on your labelled captures. That gives you temperature and bias in one step, and you can add a per-task-type offset when you have enough data per type. Prefer relative (margin-based) features over raw cosine: raw cosine levels drift with prompt length and wording, so a fixed raw threshold such as 0.25 across tasks will fail.
5. **must_not_show:** score each forbidden phrase against its own small contrast set ("{x}" vs "no {x}"-style background prompts are weak, because CLIP handles negation poorly). [39] Use **max over crops** to detect presence. For faces, people and licence plates, rely on a dedicated detector, not CLIP.

### Presence among other things vs dominance

A global embedding reflects the dominant content, so a subject occupying 15% of the frame can lose to "a room". Use **multi-crop tiling**: the global view, a 2×2 grid and a centre crop (6 forward passes; batch them). Presence = max over crops of the calibrated subject probability. Dominance = global-view probability. Report both to the client if must_show requires prominence. Detector-guided crops are better quality but bring the licence and export problems in section 3.

### Compositional subjects and CLIP failure modes

- CLIP behaves like a bag of words for relations. On ARO, CLIP scored 56% on spatial relations and 61% on verbs, and only 62% on another relation split where other models reached 87%. [40] On Winoground (Thrush et al., CVPR 2022, Table 3), CLIP ViT-B/32 scores 30.75 (text), 10.50 (image) and 8.00 (group), against chance levels of 25/25/16.67 and human scores of 89.5/88.5/85.5. That puts it below chance on the image and group scores.
- Negation accuracy in a 2026 benchmark suite was 26–37%. [41]
- So "a person operating a laptop" will also match "a laptop next to a person". Decompose relational subjects into concept checks ("person" AND "laptop" AND "hands on keyboard") with a min-combination.
- Accept that true relation checking needs a VLM verifier or human review.
- Never put negation inside a CLIP prompt. Model "must_not_show X" as detecting X.

### Video frame sampling

- **Sampling:** about 1 frame/s, capped at 8–16 frames, plus scene-change keyframes (histogram difference). Drop blurry frames using Laplacian variance below a threshold calibrated on your captures.
- **Aggregation:** subject presence = mean of the top-k frames (k = 2–3; more robust than the max of one lucky frame). Forbidden items = max over frames (one clear frame is enough to reject).
- **Early stopping:** stop once the subject is confidently present in k frames and no forbidden item was found in the frames scored so far, or after the cap.
- **Cost:** 16 frames × (1 global + optional crops) at an estimated 100–250 ms each on a 7-series CPU is 2–4 s for global-only scoring. Do crops only on frames near the decision boundary.

### Cascade design

1. **Gate (always):** global CLIP-family embedding + calibrated score, under ~250 ms target per photo on a mid-range phone.
2. **Borderline only:** multi-crop rescoring (+5 passes) and the fixed face/person detector when the task has a people-related must_not_show.
3. **Optional, high-RAM devices only:** VLM yes/no prompt ("Answer yes or no: does this photo show {subject}?"). Gemma 4 E2B on a flagship GPU has a 0.3 s time to first token. [20]
4. **Otherwise:** soft-warn and let upload proceed with a "needs review" flag. A false "wrong subject" block costs worker trust; a soft warning plus server-side review costs little.

### Model delivery

- Keep models out of the base APK/AAB. Download on first run via expo-file-system or react-native-executorch's Expo resource fetcher, verify a SHA-256, and store the model with a version.
- Play Asset Delivery is the Play-native alternative for large assets.
- Firebase ML custom model hosting only serves TFLite.
- Size budget: a CLIP-B/32 image encoder is 352 MB at fp32 in react-native-executorch, [42] and an int8/fp16 export roughly halves or quarters that. PE-Core-T/S is far smaller.

### Offline evaluation harness

1. **Dataset:** export real captures with their final human accept/reject decision, the task subject text, must_show and must_not_show, and task type. Stratify by task type, and oversample hard negatives (right place, wrong subject; subject partially visible; blur; dark).
2. **Same model on desktop:** run the identical exported artifact (`.pte` / `.tflite` / `.onnx`) in Python with byte-identical preprocessing (resize, crop, normalisation). Unit-test the parity of phone and desktop embeddings (cosine > 0.999).
3. **Metrics:**
   - ROC-AUC and PR-AUC overall and per task type.
   - At the operating point: false-warning rate (good captures flagged) and false-pass rate (bad captures accepted).
   - Choose the threshold by cost ratio, not by accuracy.
4. **Uncertainty:** use a bootstrap by task (resample tasks, not images) to get 95% confidence intervals on both error rates, and only ship thresholds whose upper bound beats the ML Kit baseline.
5. **Ablations:** prompt templates, negative bank size, crops, model (B/32 vs PE-S vs SigLIP2-B), quantisation (fp32 vs fp16/int8 drift).
6. **Shadow mode in production:** log the scores and features for the new model next to the ML Kit decision, without changing the user experience, then compare against downstream reviewer outcomes.

## Recommendations (ranked)

1. **Primary: CLIP-family dual encoder + calibrated margin scoring + multi-crop, on react-native-executorch.**
   - Phase A: the built-in CLIP ViT-B/32 (MIT weights, image and text hooks, Expo resource fetcher). Zero export work.
   - Phase B: export **PE-Core-S/16** (Apache-2.0, 72.7% IN-1k) and **SigLIP2-B/16** (Apache-2.0) to `.pte` (or `.tflite` via fast-tflite), and pick whichever wins on your eval at acceptable mid-range latency.
   - Same stack on iOS later, where Core ML makes CLIP about 19× faster than XNNPACK. [35]
2. **Forbidden people/faces/plates:** keep ML Kit face detection, or use BlazeFace/RF-DETR. Use CLIP must_not_show scoring for other forbidden concepts.
3. **Optional verifier:** Gemma 4 E2B or LFM2.5-VL via react-native-executorch `useLLM`, behind a device-RAM gate (≥8 GB) and only for borderline scores. [21]
4. **Do not adopt:** MobileCLIP/MobileCLIP2 or FastVLM (research-only licence); YOLO-World (GPL-3.0) or YOLOE (AGPL-3.0, prompts baked at export) unless you buy a licence; [43] OWLv2, Grounding DINO or Moondream 3 (too heavy); TinyCLIP (too inaccurate).

### Migration path from ML Kit label-word matching

1. **Week 0–1, baseline and devices:**
   - Pick 3 reference phones (e.g. a Snapdragon 6-series 4 GB phone, a 7-series 6 GB phone, and a Pixel a-series).
   - Add react-native-executorch to your dev build (Expo config and resource fetcher) and measure CLIP-B/32 latency and memory with the camera active.
2. **Week 1–2, eval set:** assemble 2–5k labelled historical captures across task types, and compute ML Kit's current false-warning and false-pass rates as the baseline.
3. **Week 2–3, offline tuning:**
   - Build the desktop harness.
   - Tune prompt templates, the negative bank, crops and video aggregation.
   - Fit the logistic calibrator and thresholds per task type, with bootstrapped confidence intervals.
4. **Week 3–5, shadow mode:**
   - Ship the scorer silently. Log features, both decisions, the model version and the device model.
   - Keep ML Kit driving the UI.
   - Review disagreements weekly and add them to the hard-negative set.
5. **Week 5–6, flip to the new scorer:**
   - Run an A/B test on the user-facing warning. Primary metric: reviewer-rejected uploads. Guardrail: worker complaints/overrides.
   - Keep the soft-warning UX.
6. **Week 6+, upgrade the model:** swap in PE-Core-S/16 or SigLIP2-B/16 via over-the-air model download with versioned prompt embeddings, re-run the eval, and re-fit calibration (calibration is per model).
7. **Keep from the current pipeline:**
   - Frame sampling scaffolding.
   - The ML Kit dependency for face detection.
   - Your must_show/must_not_show data model.
   - The 0.15-floor ML Kit labels as one extra logged feature during shadow mode, then retire label-word matching.

## Caveats

- Mid-range Android latency for every candidate encoder is extrapolated, not measured. Qualcomm AI Hub's 7 Gen 4 NPU figures (37–41 ms, ViT-B/16, w8a16) [37] assume a QNN/NPU path that react-native-executorch and fast-tflite may not use.
- ImageNet zero-shot accuracy is a weak proxy for "supermarket shelf with price tags". Your own eval decides the model.
- The licence summaries are not legal advice. Re-check the LICENSE files of the exact checkpoints you ship (Gemma terms, the Qwen per-size licences, LFM terms).
- Some figures come from vendor pages (Moondream, Google model cards) or single-source reports (a Jetson forum post, a Vivo Y27 study). Treat them as indicative.

---

## Sources Referenced

Query strings were stripped from URLs during extraction. The report said it consulted 312 sources in total; these are the 43 it linked inline.

1. https://huggingface.co/ermcy/MobileCLIP2-S0/blob/main/README.md
2. https://github.com/facebookresearch/perception_models/blob/main/apps/pe/README.md
3. https://github.com/facebookresearch/perception_models
4. https://huggingface.co/Ambarella/SigLIP2
5. https://www.promptlayer.com/models/tinyclip-vit-8m-16-text-3m-yfcc15m/
6. https://arxiv.org/pdf/2309.12314
7. https://huggingface.co/apple/MobileCLIP2-S0/blame/main/LICENSE
8. https://huggingface.co/apple/FastVLM-1.5B-int8/commit/cc7866fd7159ab4f5e39849ef41e163babd7a0bc
9. https://github.com/apple/ml-mobileclip
10. https://github.com/ultralytics/mobileclip
11. https://discuss.huggingface.co/t/siglip-2-models-show-lower-zero-shot-accuracy-than-reported/166735
12. https://github.com/AILab-CVC/YOLO-World/blob/master/README.md
13. https://docs.ultralytics.com/models/yoloe
14. https://arxiv.org/pdf/2606.03748
15. https://github.com/NVIDIA-AI-IOT/ROS2-NanoOWL
16. https://forums.developer.nvidia.com/t/nanoowl-inference-takes-more-time-than-nanoowl-official-github-shows/293051
17. https://docs.swmansion.com/react-native-executorch/docs/category/computer-vision
18. https://huggingface.co/google/gemma-3n-E2B-it-litert-preview
19. https://b-lab.team/en/content/c0232ff5-4af0-4702-809f-e163b7406430
20. https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm
21. https://docs.swmansion.com/react-native-executorch/docs/hooks/natural-language-processing/useLLM
22. https://www.emergentmind.com/topics/smolvlm2
23. https://www.forasoft.com/learn/ai-for-video-engineering/articles-ai/depth-anything-smolvlm-small-on-device-cv
24. https://moondream.ai/models
25. https://moondream.ai/licenses/model/1.0
26. https://moondream.ai/models/moondream_3-1_9B_A2B
27. https://www.orcarouter.ai/blog/moondream-3-preview-endpoint-shutdown
28. https://github.com/software-mansion/react-native-executorch
29. https://github.com/ronickg/react-native-nitro-onnxruntime
30. https://docs.swmansion.com/react-native-executorch/docs/0.5.x/benchmarks/inference-time
31. https://docs.swmansion.com/react-native-executorch/docs/0.6.x/hooks/computer-vision/useImageEmbeddings
32. https://docs.swmansion.com/react-native-executorch/docs/0.5.x/benchmarks/memory-usage
33. https://docs.swmansion.com/react-native-executorch/docs/benchmarks/memory-usage
34. https://github.com/software-mansion/react-native-executorch/pull/1363
35. https://github.com/software-mansion/react-native-executorch/pull/1457
36. https://github.com/software-mansion/react-native-executorch/issues/1462
37. https://huggingface.co/qualcomm/OpenAI-Clip
38. https://arxiv.org/pdf/2609.17386
39. https://arxiv.org/pdf/2511.04247
40. https://arxiv.org/pdf/2210.01936
41. https://arxiv.org/html/2602.23906
42. https://docs.swmansion.com/react-native-executorch/docs/0.6.x/benchmarks/model-size
43. https://www.libreyolo.com/articles/yolo-licenses-explained
