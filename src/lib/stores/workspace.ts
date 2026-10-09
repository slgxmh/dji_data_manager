import { ExportSettings, SelectedItems } from "@/dto/workspace";
import { DATASET_BANDS } from "../const";
import { create } from "zustand";

/** 导出设置的默认值 */
export function defaultExportSettings(): ExportSettings {
  return {
    cropMode: "percent",
    area: 100,
    windowWidth: 512,
    windowHeight: 512,
    bands: [...DATASET_BANDS],
  };
}

/**
 * 工作空间的状态
 * @member dirName 数据文件夹名
 * @member selectedItems 选中的数据集项
 * @member exportSettings 导出设置
 */
type WorkSpaceState = {
  dirName: string;
  setDirName: (name: string) => void;
  selectedItems: SelectedItems;
  setSelectIds: (...ids: number[]) => void;
  isSelected: (id: number) => boolean;
  setUnSelectIds: (...ids: number[]) => void;
  toggleSelectId: (id: number) => void;
  restoreSelected: (items: SelectedItems) => void;
  clearSelected: () => void;
  exportSettings: ExportSettings;
  setExportSettings: (settings: Partial<ExportSettings>) => void;
};

export const useWorkSpace = create<WorkSpaceState>()((set, get) => ({
  dirName: "",
  setDirName(name) {
    set({ dirName: name });
  },

  selectedItems: new Map(),
  setSelectIds(...ids) {
    set((state) => {
      const selected = new Map(state.selectedItems);
      ids.forEach((id) => {
        selected.set(id, true);
      });
      return { selectedItems: selected };
    });
  },
  isSelected(id) {
    return get().selectedItems.get(id) || false;
  },
  setUnSelectIds(...ids) {
    set((state) => {
      const selected = new Map(state.selectedItems);
      ids.forEach((id) => {
        selected.set(id, false);
      });
      return { selectedItems: selected };
    });
  },

  toggleSelectId(id) {
    set((state) => {
      const selected = new Map(state.selectedItems);
      selected.set(id, !selected.get(id));
      return { selectedItems: selected };
    });
  },

  restoreSelected(items) {
    set({ selectedItems: items });
  },

  clearSelected() {
    set({
      selectedItems: new Map(),
      dirName: "",
      exportSettings: defaultExportSettings(),
    });
  },

  exportSettings: defaultExportSettings(),
  setExportSettings(settings) {
    set((state) => ({
      exportSettings: { ...state.exportSettings, ...settings },
    }));
  },
}));
