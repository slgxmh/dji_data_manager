import { JPEG_QUALITY } from "@/lib/const";
import type { CropSpec } from "@/lib/geotiff";
import { cropToGrayPngBlob, cropToJpegBlob } from "@/lib/image";

type ExportRequest = {
  id: number;
  file: File;
  format: "jpg" | "png";
  crop: CropSpec;
};

type ExportResponse =
  | { id: number; blob: Blob }
  | { id: number; error: string };

// 在 Worker 上下文中 self 的 postMessage/onmessage 与 DOM 类型不同，这里显式声明
const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<ExportRequest>) => void) | null;
  postMessage: (message: ExportResponse) => void;
};

ctx.onmessage = async (event) => {
  const { id, file, format, crop } = event.data;
  try {
    const blob =
      format === "png"
        ? await cropToGrayPngBlob(file, crop)
        : await cropToJpegBlob(file, crop, JPEG_QUALITY);
    ctx.postMessage({ id, blob });
  } catch (error) {
    ctx.postMessage({
      id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
