import { fromBlob } from "geotiff";

/** TIF 元数据 */
export type TiffMeta = {
  width: number;
  height: number;
  samplesPerPixel: number;
  bitsPerSample: number;
};

/** 中心裁剪窗口（像素坐标，[left, top, right, bottom]） */
export type CropWindow = [number, number, number, number];

/** 裁剪描述：百分比模式或固定像素窗口模式 */
export type CropSpec =
  | { mode: "percent"; area: number }
  | { mode: "fixed"; width: number; height: number };

/**
 * 计算以图像中心为中心的裁剪像素窗口。
 * 百分比模式按面积百分比计算；固定窗口模式取 min(原图, 窗口)，超出部分截断。
 */
export function centerCropWindow(
  width: number,
  height: number,
  crop: CropSpec,
): CropWindow {
  const cropWidth =
    crop.mode === "percent"
      ? Math.floor((width * crop.area) / 100)
      : Math.min(width, crop.width);
  const cropHeight =
    crop.mode === "percent"
      ? Math.floor((height * crop.area) / 100)
      : Math.min(height, crop.height);
  const left = Math.floor(width / 2) - Math.floor(cropWidth / 2);
  const top = Math.floor(height / 2) - Math.floor(cropHeight / 2);
  return [left, top, left + cropWidth, top + cropHeight];
}

/** 读取 TIF 的元数据 */
export async function readTiffMeta(file: File): Promise<TiffMeta> {
  const tiff = await fromBlob(file);
  try {
    const image = await tiff.getImage();
    return {
      width: image.getWidth(),
      height: image.getHeight(),
      samplesPerPixel: image.getSamplesPerPixel(),
      bitsPerSample: image.getBitsPerSample(0),
    };
  } finally {
    await tiff.close();
  }
}

/** 8bit 单波段转 RGBA ImageData */
function grayToImageData(
  gray: ArrayLike<number>,
  width: number,
  height: number,
  bits: number,
  scale: number,
): ImageData {
  const rgba = new Uint8ClampedArray(width * height * 4);
  const divisor = bits > 8 ? (1 << bits) - 1 : 255;
  for (let i = 0; i < width * height; i++) {
    const value = Math.round((gray[i] / divisor) * 255 * scale);
    const offset = i * 4;
    rgba[offset] = value;
    rgba[offset + 1] = value;
    rgba[offset + 2] = value;
    rgba[offset + 3] = 255;
  }
  return new ImageData(rgba, width, height);
}

/** 单波段 8bit 灰度图 */
export type GrayImage = {
  width: number;
  height: number;
  /** 长度为 width*height 的灰度数据 */
  gray: Uint8Array;
};

/** 读取 TIF 并按其自身尺寸做中心裁剪，返回 8bit 单波段灰度数据 */
export async function readTiffCropGray(
  file: File,
  crop: CropSpec,
): Promise<GrayImage> {
  const tiff = await fromBlob(file);
  try {
    const image = await tiff.getImage();
    const window = centerCropWindow(
      image.getWidth(),
      image.getHeight(),
      crop,
    );
    const [left, top, right, bottom] = window;
    const width = right - left;
    const height = bottom - top;
    const band = (await image.readRasters({ window, interleave: false }))[0];
    const bits = image.getBitsPerSample(0);
    const gray = new Uint8Array(width * height);
    if (bits > 8) {
      const divisor = (1 << bits) - 1;
      for (let i = 0; i < gray.length; i++) {
        gray[i] = Math.round((band[i] / divisor) * 255);
      }
    } else {
      for (let i = 0; i < gray.length; i++) {
        gray[i] = band[i];
      }
    }
    return { width, height, gray };
  } finally {
    await tiff.close();
  }
}

/** 读取整幅 TIF 并缩放到指定范围，返回 ImageData（用于预览） */
export async function readTiffPreviewImage(
  file: File,
  maxSize: number,
): Promise<ImageData> {
  const tiff = await fromBlob(file);
  try {
    const image = await tiff.getImage();
    const fullWidth = image.getWidth();
    const fullHeight = image.getHeight();
    const factor = Math.min(maxSize / fullWidth, maxSize / fullHeight);
    const width = Math.max(1, Math.round(fullWidth * factor));
    const height = Math.max(1, Math.round(fullHeight * factor));
    const rasters = await image.readRasters({ width, height, interleave: false });
    return grayToImageData(
      rasters[0],
      width,
      height,
      image.getBitsPerSample(0),
      1,
    );
  } finally {
    await tiff.close();
  }
}
