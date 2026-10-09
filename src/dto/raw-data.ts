// 数据集相关的数据对象，与浏览器端解析结果对应

export type ImgId = number;
export type ImgPath = string;

/** 图片波段 */
export const enum ImgBand {
  RBG = "D",
  G = "G",
  NIR = "NIR",
  R = "R",
  RE = "RE",
}

/**
 * 大疆 MRK 文件中的一行
 * @property id 图片编号
 * @property lat 纬度
 * @property lon 经度
 * @property imgs 波段到文件名的映射
 */
export type MrkItem = {
  id: ImgId;
  lat: number;
  lon: number;
  imgs: Map<ImgBand, ImgPath>;
};

/**
 * 数据集
 * @member dirName 数据所在文件夹名
 * @member items 按图片编号组织的条目
 */
export type RawData = {
  dirName: string;
  items: MrkItem[];
};
