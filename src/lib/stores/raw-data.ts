// 数据集的状态，这是基础数据集，用于存储数据集的相关数据，应用的地图组件，数据组件都通过这个状态获取基础数据

import { ImgBand, RawData } from "@/dto/raw-data";
import { create } from "zustand";

const EMPTY_DATASET: RawData = { dirName: "", items: [] };

/**
 * 数据集的状态
 * @member dataset 数据集
 * @member files 文件名到文件对象的映射
 * @member dirHandle 数据文件夹的目录句柄，用于写回工程文件
 */
type DatasetState = {
  dataset: RawData;
  files: Map<string, File>;
  dirHandle: FileSystemDirectoryHandle | null;
  setDataset: (
    dataset: RawData,
    files: Map<string, File>,
    dirHandle: FileSystemDirectoryHandle | null,
  ) => void;
  clearDataset: () => void;
  getFile: (name: string) => File | undefined;
  getImgName: (id: number, band: ImgBand) => string;
};

export const useDataset = create<DatasetState>()((set, get) => ({
  dataset: EMPTY_DATASET,
  files: new Map(),
  dirHandle: null,
  setDataset(dataset, files, dirHandle) {
    set({ dataset, files, dirHandle });
  },
  clearDataset() {
    set({ dataset: EMPTY_DATASET, files: new Map(), dirHandle: null });
  },
  getFile(name) {
    return get().files.get(name);
  },
  getImgName(id, band) {
    const item = get().dataset.items.find((it) => it.id === id);
    return item?.imgs.get(band) ?? "";
  },
}));
