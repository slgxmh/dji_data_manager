import { ImgBand } from "@/dto/raw-data";

/** 识别图片文件的扩展名（小写，不含点） */
export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "tif", "tiff"] as const;

/** 一个数据集会涉及的波段（顺序与训练侧一致） */
export const DATASET_BANDS: ImgBand[] = [
  ImgBand.RBG,
  ImgBand.G,
  ImgBand.NIR,
  ImgBand.R,
  ImgBand.RE,
];

/** RGB（JPG）导出时固定的 JPEG 质量 */
export const JPEG_QUALITY = 0.95;

/** 预览图的最大边长（像素） */
export const PREVIEW_MAX_SIZE = 200;

/** 工程文件名：保存在数据文件夹中，打开文件夹时自动读取 */
export const WORKSPACE_FILE_NAME = "data_manager.json";

/** 取文件名的小写扩展名（不含点），无扩展名返回空串 */
export function fileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot < 0 ? "" : fileName.slice(dot + 1).toLowerCase();
}

/** 是否为图片文件 */
export function isImageFile(fileName: string): boolean {
  return (IMAGE_EXTENSIONS as readonly string[]).includes(fileExtension(fileName));
}

/** 是否为 TIF/TIFF 文件 */
export function isTiffFile(fileName: string): boolean {
  const ext = fileExtension(fileName);
  return ext === "tif" || ext === "tiff";
}

/** 是否为 MRK 文件 */
export function isMrkFile(fileName: string): boolean {
  return fileExtension(fileName) === "mrk";
}
