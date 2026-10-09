import { ImgBand, MrkItem } from "@/dto/raw-data";
import { DATASET_BANDS, isImageFile, isMrkFile } from "./const";

// 与 Rust 端 dataset/utils.rs 中的正则保持一致：
// 行首的图片编号，以及形如 44.38783666 的经纬度
const REG_MRK_ID = /^\d*/;
const REG_MRK_POS = /\d{2}\.\d{8}/g;
// 文件名中形如 _0295_ 的编号段
const REG_FILE_ID = /_\d{1,4}_/;

const KNOWN_BANDS = new Set<string>(DATASET_BANDS);

/** 构建后的数据集：包含 MRK 解析结果与文件名到 File 的映射 */
export type BuiltDataset = {
  dirName: string;
  items: MrkItem[];
  files: Map<string, File>;
};

type MrkLine = { id: number; lat: number; lon: number };

/** 解析 MRK 文本，逐行提取图片编号与经纬度 */
export function parseMrkText(text: string): MrkLine[] {
  const items: MrkLine[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (line === "") continue;
    const idMatch = line.match(REG_MRK_ID);
    if (!idMatch || idMatch[0] === "") continue;
    const pos = line.match(REG_MRK_POS);
    if (!pos || pos.length < 2) continue;
    items.push({
      id: Number.parseInt(idMatch[0], 10),
      lat: Number.parseFloat(pos[0]),
      lon: Number.parseFloat(pos[1]),
    });
  }
  return items;
}

/** 从文件名中解析图片编号（对应 MRK 行号） */
export function parseImageId(fileName: string): number | null {
  const match = fileName.match(REG_FILE_ID);
  return match ? Number.parseInt(match[0].slice(1, -1), 10) : null;
}

/** 从文件名中解析波段名（最后一个下划线段，去掉扩展名后大写） */
export function parseImageBand(fileName: string): string | null {
  const dot = fileName.lastIndexOf(".");
  const stem = dot < 0 ? fileName : fileName.slice(0, dot);
  const parts = stem.split("_");
  const last = parts[parts.length - 1];
  return last ? last.toUpperCase() : null;
}

/** 判断某个波段名是否为已知波段 */
export function isKnownBand(band: string): band is ImgBand {
  return KNOWN_BANDS.has(band);
}

/**
 * 根据一个文件夹中的所有文件构建数据集。
 * MRK 提供编号与经纬度，图片文件名提供编号与波段，二者按编号关联。
 */
export async function buildDataset(
  dirName: string,
  files: File[],
): Promise<BuiltDataset> {
  const imgMap = new Map<string, string>();
  const fileMap = new Map<string, File>();
  let mrkFile: File | null = null;

  for (const file of files) {
    const name = file.name;
    if (isMrkFile(name)) {
      mrkFile = file;
      continue;
    }
    if (!isImageFile(name)) continue;

    const id = parseImageId(name);
    const band = parseImageBand(name);
    if (id === null || band === null || !isKnownBand(band)) continue;

    imgMap.set(`${id}-${band}`, name);
    fileMap.set(name, file);
  }

  if (!mrkFile) {
    throw new Error("所选文件夹中未找到 MRK 文件");
  }

  const items: MrkItem[] = parseMrkText(await mrkFile.text()).map((line) => {
    const imgs = new Map<ImgBand, string>();
    for (const band of DATASET_BANDS) {
      const name = imgMap.get(`${line.id}-${band}`);
      if (name) imgs.set(band, name);
    }
    return { id: line.id, lat: line.lat, lon: line.lon, imgs };
  });

  return { dirName, items, files: fileMap };
}
