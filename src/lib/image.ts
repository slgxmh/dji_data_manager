import { PREVIEW_MAX_SIZE, isTiffFile } from "./const";
import {
  centerCropWindow,
  CropSpec,
  readTiffCropGray,
  readTiffPreviewImage,
} from "./geotiff";
import { encodeGrayPng } from "./png";

/** 生成预览图的 Blob URL（WebP），JPG 与 TIF 均可 */
export async function createPreviewUrl(file: File): Promise<string> {
  const canvas = new OffscreenCanvas(1, 1);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("无法创建画布上下文");

  if (isTiffFile(file.name)) {
    const image = await readTiffPreviewImage(file, PREVIEW_MAX_SIZE);
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.putImageData(image, 0, 0);
  } else {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    try {
      const factor = Math.min(
        PREVIEW_MAX_SIZE / bitmap.width,
        PREVIEW_MAX_SIZE / bitmap.height,
      );
      canvas.width = Math.max(1, Math.round(bitmap.width * factor));
      canvas.height = Math.max(1, Math.round(bitmap.height * factor));
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    } finally {
      bitmap.close();
    }
  }

  const blob = await canvas.convertToBlob({ type: "image/webp", quality: 0.8 });
  return URL.createObjectURL(blob);
}

/** 按裁剪描述中心裁剪并编码为 JPEG Blob（用于 RGB 源） */
export async function cropToJpegBlob(
  file: File,
  crop: CropSpec,
  quality: number,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const [left, top, right, bottom] = centerCropWindow(
      bitmap.width,
      bitmap.height,
      crop,
    );
    const cropWidth = right - left;
    const cropHeight = bottom - top;

    const canvas = new OffscreenCanvas(cropWidth, cropHeight);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("无法创建画布上下文");
    ctx.drawImage(
      bitmap,
      left,
      top,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight,
    );
    return canvas.convertToBlob({ type: "image/jpeg", quality });
  } finally {
    bitmap.close();
  }
}

/** 按裁剪描述中心裁剪并编码为无损 PNG（用于单波段 TIF 源） */
export async function cropToGrayPngBlob(
  file: File,
  crop: CropSpec,
): Promise<Blob> {
  const { width, height, gray } = await readTiffCropGray(file, crop);
  return encodeGrayPng(gray, width, height);
}
