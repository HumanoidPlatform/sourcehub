// An organisation's logo: showing one, and uploading one.
//
// Platform storage is private, and an <img> cannot send the bearer token, so
// the image is loaded the way captured photos are (AssetGallery's useAssetUrl):
// ask the API for a short-lived signed URL, then point the <img> at it. The
// query is keyed on logo_version as well as the organisation, so replacing the
// logo asks for a new URL instead of showing the old picture for 13 minutes.
//
// Uploading reuses the attachment presign. The key it hands back is staged
// under the uploader's own organisation; the server moves it into the logo
// folder when the save names it (PUT /organisations/{id}/logo, or approval of
// an onboarding request).

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { get, post, putFile } from "@api/client";
import { Button } from "@ds/primitives";

export const LOGO_MAX_BYTES = 2 * 1024 * 1024;
// Mirrors the server (modules/attachments/service.py _LOGO_TYPES). No SVG: it
// can carry script. No GIF: a logo that moves is a distraction on every page.
export const LOGO_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};
const ACCEPT = Object.keys(LOGO_TYPES).map((e) => "." + e).join(",");

interface SignedUrl {
  url: string;
  expires_in: number;
}

// A signed URL lives 15 minutes; refetch a little before it dies.
const URL_STALE = 13 * 60 * 1000;

export function useOrgLogo(orgId: string | null | undefined, version: string | null | undefined) {
  return useQuery({
    queryKey: ["org-logo", orgId, version],
    queryFn: () => get<SignedUrl>(`/organisations/${orgId}/logo-url`),
    enabled: !!orgId && !!version,
    staleTime: URL_STALE,
    retry: false,
  });
}

/** The logo a pending onboarding request carries, before it has an owner.
 *  Keyed on the staged file as well as the request: a request resubmitted
 *  with another logo must not show the old one from cache for 13 minutes. */
export function useStagedLogo(requestId: string | null | undefined, stagingKey: string | null | undefined) {
  return useQuery({
    queryKey: ["onboarding-logo", requestId, stagingKey],
    queryFn: () => get<SignedUrl>(`/onboarding/${requestId}/logo-url`),
    enabled: !!requestId && !!stagingKey,
    staleTime: URL_STALE,
    retry: false,
  });
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return words
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

/** A logo image, or the organisation's initials where there is none. */
export function LogoImage({ url, name, size = 40 }: { url?: string | null; name: string; size?: number }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [url]);
  const box = { width: size, height: size };
  if (url && !broken) {
    return (
      <img
        className="orglogo"
        src={url}
        alt={`${name} logo`}
        style={box}
        // an expired URL or a deleted file: fall back rather than show a
        // broken-image icon on someone's profile
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <span className="orglogo orglogo-initials" style={{ ...box, fontSize: Math.round(size * 0.38) }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export function OrgLogo({
  orgId,
  version,
  name,
  size,
}: {
  orgId: string | null | undefined;
  version: string | null | undefined;
  name: string;
  size?: number;
}) {
  const logo = useOrgLogo(orgId, version);
  return <LogoImage url={logo.data?.url} name={name} size={size} />;
}

export interface LogoUpload {
  name: string;
  /** An object URL of the picked file, for the preview. */
  preview: string;
  /** The staged storage key; empty until the upload lands. */
  key: string;
  status: "uploading" | "done" | "error";
}

/** Why a file cannot be a logo, or null if it can. */
export function logoProblem(file: File): string | null {
  const ext = (file.name.includes(".") ? file.name.split(".").pop() ?? "" : "").toLowerCase();
  if (!LOGO_TYPES[ext]) return "Choose a PNG, JPEG or WebP image.";
  if (file.size > LOGO_MAX_BYTES) return "The logo must be 2 MB or smaller.";
  return null;
}

async function uploadLogo(file: File): Promise<string> {
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const pre = await post<{ storage_key: string; url: string; headers: Record<string, string> }>(
    "/attachments/presign",
    {
      filename: file.name,
      // The type storage will serve it with, which the server checks against
      // the extension. A browser that leaves file.type blank still gets it right.
      content_type: file.type || LOGO_TYPES[ext],
      size_bytes: file.size,
    },
  );
  await putFile(pre.url, file, pre.headers);
  return pre.storage_key;
}

/** Pick one image, upload it straight away, and preview it. */
export function LogoPicker({
  value,
  onChange,
  label = "Choose image",
}: {
  value: LogoUpload | null;
  onChange: (next: LogoUpload | null) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  // Latest onChange without re-running the upload effect when the parent
  // re-renders with a new closure.
  const change = useRef(onChange);
  change.current = onChange;

  // Which pick is current. An upload that lands after the person removed it,
  // or picked another, must not put it back.
  const active = useRef<string | null>(value?.preview ?? null);

  // An object URL holds the file in memory until revoked. It is revoked when
  // the preview is REPLACED or REMOVED, never when this picker unmounts: the
  // onboarding form unmounts it on every step change and shows the same
  // preview again on Review, where a revoked URL is a broken image. What is
  // left when the form itself goes is one small blob, freed with the page.
  const release = () => {
    if (value?.preview) URL.revokeObjectURL(value.preview);
  };

  const pick = (file: File) => {
    setError(null);
    const problem = logoProblem(file);
    if (problem) {
      setError(problem);
      return;
    }
    release();
    const draft: LogoUpload = {
      name: file.name,
      preview: URL.createObjectURL(file),
      key: "",
      status: "uploading",
    };
    active.current = draft.preview;
    change.current(draft);
    uploadLogo(file).then(
      (key) => {
        if (active.current === draft.preview) change.current({ ...draft, key, status: "done" });
      },
      (e: unknown) => {
        if (active.current !== draft.preview) return;
        change.current({ ...draft, status: "error" });
        setError(e instanceof Error ? e.message : "The upload failed; try the image again.");
      },
    );
  };

  const remove = () => {
    release();
    active.current = null;
    setError(null);
    onChange(null);
  };

  return (
    <div className="logopicker">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        hidden
        aria-label="Logo image"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) pick(file);
          e.target.value = ""; // allow re-picking the same file
        }}
      />
      {value && <LogoImage url={value.preview} name={value.name} size={56} />}
      <div className="logopicker-body">
        <div className="btnrow">
          <Button size="sm" onClick={() => inputRef.current?.click()} disabled={value?.status === "uploading"}>
            {value ? "Choose another" : label}
          </Button>
          {value && (
            <Button size="sm" variant="quiet" onClick={remove}>
              Remove
            </Button>
          )}
        </div>
        {/* Own classes, not .hint/.err: inside a Field, .err is hidden until the
            FIELD is invalid, and this error belongs to the picker. */}
        <span className="logopicker-note">
          {value?.status === "uploading"
            ? "Uploading…"
            : value?.status === "error"
              ? "Upload failed."
              : value
                ? value.name
                : "PNG, JPEG or WebP, up to 2 MB. A square image works best."}
        </span>
        {error && <span className="logopicker-err" role="alert">{error}</span>}
      </div>
    </div>
  );
}
