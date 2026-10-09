import { ImgBand, ImgId } from "./raw-data";

export type SelectedItems = Map<ImgId, boolean>;

/** 裁剪模式：百分比中心裁剪 / 固定像素窗口中心裁剪 */
export type CropMode = "percent" | "fixed";

/** 导出设置，随工程文件一起保存 */
export type ExportSettings = {
  /** 裁剪模式 */
  cropMode: CropMode;
  /** 裁剪面积百分比 1-100（百分比模式） */
  area: number;
  /** 固定窗口宽（像素，固定窗口模式） */
  windowWidth: number;
  /** 固定窗口高（像素，固定窗口模式） */
  windowHeight: number;
  /** 需要导出的波段 */
  bands: ImgBand[];
};

/**
 * 工作空间的保存文件，用于工作空间的导入和导出
 * @member dirName 数据文件夹名（浏览器无法保存绝对路径）
 */
export type WorkSpaceFile = {
  dirName: string;
  selectedItems: SelectedItems;
  exportSettings: ExportSettings;
};
