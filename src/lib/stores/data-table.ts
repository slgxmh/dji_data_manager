// 控制数据表格的显示

import { create } from "zustand";

type DataTableState = {
  refreshFlag: boolean;
  setRefreshFlag: (flag: boolean) => void;
};

export const useDataTable = create<DataTableState>()((set) => ({
  refreshFlag: false,
  setRefreshFlag(flag) {
    set({ refreshFlag: flag });
  },
}));
