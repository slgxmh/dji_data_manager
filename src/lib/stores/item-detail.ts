import { ImgBand } from "@/dto/raw-data";
import { create } from "zustand";

/** 图片查看状态 */
type ItemDetailState = {
  id: number;
  setId: (id: number) => void;
  band: ImgBand;
  setType: (type: ImgBand) => void;
};

export const useItemDetail = create<ItemDetailState>()((set) => ({
  id: -1,
  setId(id) {
    set(() => ({ id }));
  },

  band: ImgBand.RBG,
  setType(type) {
    set(() => ({ band: type }));
  },
}));
