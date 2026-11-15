export interface EncodedMedia {
  base64: string;
  mimeType: string;
  dataUrl: string;
}

export async function fileToBase64Resized(
  file: File,
  maxDimension = 1280
): Promise<EncodedMedia> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Could not load selected image."));
      image.src = objectUrl;
    });

    const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas context unavailable.");
    }
    ctx.drawImage(img, 0, 0, width, height);

    const mimeType = "image/jpeg";
    const dataUrl = canvas.toDataURL(mimeType, 0.86);
    const base64 = dataUrl.split(",")[1] ?? "";
    return { base64, mimeType, dataUrl };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function urlToBase64(imageUrl: string): Promise<EncodedMedia> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error("Unable to load sample crop image.");
  }
  const blob = await response.blob();
  const mimeType = blob.type || "image/jpeg";
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read sample image."));
    reader.readAsDataURL(blob);
  });
  const base64 = dataUrl.split(",")[1] ?? "";
  return { base64, mimeType, dataUrl };
}

export async function blobToBase64(
  blob: Blob
): Promise<{ base64: string; mimeType: string }> {
  const mimeType = blob.type || "audio/webm";
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read recorded audio."));
    reader.readAsDataURL(blob);
  });
  const base64 = dataUrl.split(",")[1] ?? "";
  return { base64, mimeType };
}
