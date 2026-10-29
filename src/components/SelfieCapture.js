"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, ScanFace, Upload, X } from "lucide-react";

/**
 * Live selfie capture for identity verification (spec Part 13).
 *
 * The camera path is preferred because the photo is taken here and now rather
 * than chosen from a gallery. It is not liveness detection — defeating it only
 * takes holding up a photograph — so the result records which path was used
 * and the admin weighs it alongside the ID document.
 *
 * @param {object} props
 *   - onCapture({ dataUrl, source })  called with the captured image
 *   - value        the already-captured { dataUrl, source }, if any
 *   - onClear()
 */
export default function SelfieCapture({ onCapture, value, onClear }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStreaming(false);
  }, []);

  // Always release the camera when this component goes away.
  useEffect(() => () => stopCamera(), [stopCamera]);

  async function startCamera() {
    setError("");
    setStarting(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser cannot open the camera. Upload a photo instead.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
    } catch (err) {
      const name = err?.name;
      setError(
        name === "NotAllowedError"
          ? "Camera access was blocked. Allow it in your browser, or upload a photo instead."
          : name === "NotFoundError"
            ? "No camera was found on this device. Upload a photo instead."
            : err.message || "The camera could not be opened."
      );
    } finally {
      setStarting(false);
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    // Square crop from the centre, which is what a face check wants.
    const size = Math.min(video.videoWidth, video.videoHeight);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(
      video,
      (video.videoWidth - size) / 2,
      (video.videoHeight - size) / 2,
      size,
      size,
      0,
      0,
      size,
      size
    );
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    stopCamera();
    onCapture({ dataUrl, source: "camera" });
  }

  function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onCapture({ dataUrl: String(reader.result), source: "upload" });
    reader.onerror = () => setError("That file could not be read.");
    reader.readAsDataURL(file);
  }

  if (value?.dataUrl) {
    return (
      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value.dataUrl}
            alt="Your captured selfie"
            className="h-28 w-28 shrink-0 rounded-xl object-cover ring-2 ring-brand/30"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink">Selfie ready</p>
            <p className="mt-0.5 text-xs font-semibold text-ink-faint">
              {value.source === "camera"
                ? "Taken with your camera just now."
                : "Chosen from your device. A camera photo is preferred."}
            </p>
            <p className="mt-1 text-xs font-semibold text-ink-faint">
              Only our review team sees this. It is never shown to buyers.
            </p>
          </div>
          <button type="button" onClick={onClear} className="btn-outline !min-h-9 !py-1.5 !text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Retake
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      {streaming ? (
        <div className="grid gap-3">
          <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-xl bg-ink">
            {/* Mirrored so it behaves like a mirror while framing. */}
            <video ref={videoRef} playsInline muted className="h-full w-full -scale-x-100 object-cover" />
            <div className="pointer-events-none absolute inset-6 rounded-full border-2 border-dashed border-white/60" />
          </div>
          <p className="text-center text-xs font-semibold text-ink-faint">
            Face the camera in good light, with your whole face inside the circle.
          </p>
          <div className="flex justify-center gap-2">
            <button type="button" onClick={capture} className="btn-primary">
              <Camera className="h-4 w-4" /> Take photo
            </button>
            <button type="button" onClick={stopCamera} className="btn-outline">
              <X className="h-4 w-4" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">
              <ScanFace className="h-[18px] w-[18px]" />
            </span>
            <div>
              <p className="text-sm font-bold text-ink">Live selfie</p>
              <p className="text-xs font-semibold leading-5 text-ink-faint">
                We compare this against your ID document to confirm the person listing the
                property is the person on the document. Admin-only — buyers never see it.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={startCamera} disabled={starting} className="btn-primary">
              <Camera className="h-4 w-4" /> {starting ? "Opening camera…" : "Open camera"}
            </button>
            <label className="btn-outline cursor-pointer">
              <Upload className="h-4 w-4" /> Upload a photo
              <input type="file" accept="image/*" capture="user" onChange={onFile} className="sr-only" />
            </label>
          </div>

          {error && (
            <p role="alert" className="text-xs font-semibold text-red-700">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
