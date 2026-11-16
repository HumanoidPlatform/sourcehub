// The phone's de-identification: faces and text found, then pixelated or
// filled, in photos and clips, before a capture leaves the phone. Android only
// (Kotlin, android/); null on iOS and on any build before 0.5.0, which is how
// the capture pipeline knows a privacy task cannot be captured here
// (qa_pipeline/privacy/deidentify.ts).
//
// Boxes are pixels of the UPRIGHT picture: a photo with its EXIF rotation
// applied, a clip with its rotation metadata applied.

import { NativeModule, requireOptionalNativeModule } from "expo";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A line of text the reader found, with the block it belongs to. */
export interface TextLine {
  text: string;
  box: Box;
  block: number;
}

export interface Region {
  box: Box;
  /** pixelate: a coarse mosaic (faces); fill: solid black (plates) */
  style: "pixelate" | "fill";
}

/** A stretch of a clip, by presentation time, and what to cover in it. */
export interface Span {
  fromMs: number;
  toMs: number;
  regions: Region[];
}

export interface Picture {
  width: number;
  height: number;
  faces: Box[];
  lines: TextLine[];
}

export interface Sample {
  tMs: number;
  faces: Box[];
  lines: TextLine[];
}

export interface Clip {
  width: number;
  height: number;
  durationMs: number;
  /** HDR or Dolby Vision: refused, since its colours cannot be kept */
  hdr: boolean;
  samples: Sample[];
}

export interface Written {
  uri: string;
  width: number;
  height: number;
  bytes: number;
  durationMs?: number;
}

type Events = {
  onProgress: (e: { job: string; done: number; total: number }) => void;
};

declare class DeidentifyModule extends NativeModule<Events> {
  /** the module's own version, sent with every capture it cleaned */
  readonly version: number;
  analyzeImage(uri: string, faces: boolean, text: boolean): Promise<Picture>;
  /** a new JPEG at `out`: covers drawn, no EXIF but the orientation */
  redactImage(uri: string, regions: Region[], out: string, quality: number): Promise<Written>;
  analyzeVideo(
    uri: string,
    faceEveryMs: number,
    textEveryMs: number,
    faces: boolean,
    text: boolean,
    job: string,
  ): Promise<Clip>;
  /** a new H.264 MP4 at `out`: covers drawn by time, no location or XMP */
  redactVideo(uri: string, spans: Span[], out: string, maxLines: number, job: string): Promise<Written>;
  /** the same clip at `out` with every metadata entry dropped */
  remuxVideo(uri: string, out: string): Promise<Written>;
}

export const Deidentify = requireOptionalNativeModule<DeidentifyModule>("Deidentify");
