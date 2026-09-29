/**
 * On-device code reading for Return Wallet. Images never leave the browser.
 * jsQR handles QR codes everywhere (including iPhone Safari); BarcodeDetector, where the
 * browser has it, adds 1D barcodes such as Code 128.
 */
import jsQR from "jsqr";

export type DecodedCode = { text: string; kind: "qr" | "number"; format?: string };

type Detector = { detect(source: CanvasImageSource): Promise<{ rawValue: string; format: string }[]> };
type DetectorConstructor = new (options?: { formats: string[] }) => Detector;

const linearFormats = ["code_128", "code_39", "code_93", "ean_13", "ean_8", "itf", "upc_a", "upc_e", "codabar", "pdf417", "data_matrix", "aztec"];

/** Decode RGBA pixels. Exported for tests. */
export function decodePixels(data: Uint8ClampedArray, width: number, height: number): DecodedCode | null {
  const result = jsQR(data, width, height, { inversionAttempts: "attemptBoth" });
  if (!result) return null;
  const text = textFromQr(result.data, result.binaryData);
  return text ? { text, kind: "qr" } : null;
}

/** Prefer jsQR's decoded text; fall back to UTF-8 bytes when it returned nothing printable. */
export function textFromQr(data: string, bytes: number[]): string | null {
  if (data && data.trim()) return data;
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bytes));
    return text.trim() ? text : null;
  } catch { return null; }
}

function canvasFor(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("This browser cannot read images.");
  return [canvas, context];
}

export async function loadImage(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image, such as a screenshot of the return QR.");
  if (file.size > 25 * 1024 * 1024) throw new Error("That image is larger than 25 MB. Take a screenshot instead.");
  if (typeof createImageBitmap === "function") {
    try { return await createImageBitmap(file); } catch { /* fall through to <img> for HEIC and older Safari */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    return image;
  } catch {
    throw new Error("This image format could not be opened. Take a regular screenshot (PNG or JPEG).");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function sizeOf(image: ImageBitmap | HTMLImageElement): [number, number] {
  return image instanceof HTMLImageElement ? [image.naturalWidth, image.naturalHeight] : [image.width, image.height];
}

function scanAt(image: CanvasImageSource, width: number, height: number, max: number): DecodedCode | null {
  const scale = Math.min(1, max / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale)), h = Math.max(1, Math.round(height * scale));
  const [, context] = canvasFor(w, h);
  context.imageSmoothingEnabled = true;
  context.drawImage(image, 0, 0, w, h);
  return decodePixels(context.getImageData(0, 0, w, h).data, w, h);
}

async function detectLinear(image: CanvasImageSource): Promise<DecodedCode | null> {
  const Ctor = (globalThis as { BarcodeDetector?: DetectorConstructor }).BarcodeDetector;
  if (!Ctor) return null;
  try {
    const found = await new Ctor({ formats: ["qr_code", ...linearFormats] }).detect(image);
    const hit = found.find(code => code.rawValue && code.rawValue.trim());
    if (!hit) return null;
    return hit.format === "qr_code" ? { text: hit.rawValue, kind: "qr" } : { text: hit.rawValue, kind: "number", format: hit.format };
  } catch { return null; }
}

/** Screenshot → code. Tries several scales because email screenshots vary from tiny to 4K. */
export async function decodeImageFile(file: Blob): Promise<DecodedCode | null> {
  const image = await loadImage(file);
  const [width, height] = sizeOf(image);
  for (const max of [1400, 900, 2200, 600]) {
    const result = scanAt(image, width, height, max);
    if (result) return result;
  }
  return detectLinear(image);
}

/** Downscaled copy of the original screenshot, kept locally so a barcode can still be shown. */
export async function shrinkImage(file: Blob, max = 1600): Promise<Blob> {
  const image = await loadImage(file);
  const [width, height] = sizeOf(image);
  const scale = Math.min(1, max / Math.max(width, height));
  const [canvas, context] = canvasFor(Math.round(width * scale), Math.round(height * scale));
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const toBlob = (type: string, quality?: number) => new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality));
  const png = await toBlob("image/png");
  if (png && png.size < 1_500_000) return png;
  const jpeg = await toBlob("image/jpeg", 0.9);
  if (!jpeg) throw new Error("Could not keep a copy of this image.");
  return jpeg;
}

/** Continuous camera scanning. Returns a stop function. */
export async function startCameraScan(video: HTMLVideoElement, onCode: (code: DecodedCode) => void): Promise<() => void> {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera scanning is not available in this browser. Use a screenshot instead.");
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } }, audio: false });
  video.srcObject = stream;
  video.setAttribute("playsinline", "true");
  video.muted = true;
  await video.play();
  let stopped = false;
  let timer = 0;
  const stop = () => {
    stopped = true;
    window.clearTimeout(timer);
    stream.getTracks().forEach(track => track.stop());
    video.srcObject = null;
  };
  const tick = () => {
    if (stopped) return;
    const w = video.videoWidth, h = video.videoHeight;
    if (w && h) {
      const result = scanAt(video, w, h, 720);
      if (result) { stop(); onCode(result); return; }
    }
    timer = window.setTimeout(tick, 180);
  };
  tick();
  return stop;
}
