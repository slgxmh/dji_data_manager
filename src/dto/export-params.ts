/** 需要导出的图片的参数 */
export type ExportRecord = {
  raw_dir: string;
  raw_data: {
    id: number;
    imgs: {
      band: string;
      name: string;
    }[];
  }[];
  out_dir: string;
  area: number;
};