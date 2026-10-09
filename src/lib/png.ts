import UPNG from "upng-js";

/**
 * 把 8bit 单波段灰度像素编码为无损的单通道 PNG。
 * @param gray 长度为 width*height 的灰度数据（1 字节/像素）
 */
export function encodeGrayPng(
  gray: Uint8Array,
  width: number,
  height: number,
): Blob {
  const pixels = width * height;
  const rgba = new Uint8Array(pixels * 4);
  for (let i = 0; i < pixels; i++) {
    const value = gray[i];
    const offset = i * 4;
    rgba[offset] = value;
    rgba[offset + 1] = value;
    rgba[offset + 2] = value;
    rgba[offset + 3] = 255;
  }
  const buffer = UPNG.encode([rgba.buffer as ArrayBuffer], width, height, 0);
  return new Blob([buffer], { type: "image/png" });
}
