// upng-js 未提供 TypeScript 类型，这里补充最小声明
declare module "upng-js" {
  type UPNG = {
    /**
     * 编码 PNG。
     * @param imgs 每个帧的像素数据（ArrayBuffer 数组）
     * @param width 宽度
     * @param height 高度
     * @param cnum 输出通道数：0=灰度，2=RGB，3=索引，4=RGBA
     * @param dels 可选的帧延迟
     */
    encode(
      imgs: ArrayBuffer[],
      width: number,
      height: number,
      cnum?: number,
      dels?: number[],
    ): ArrayBuffer;
    decode(buffer: ArrayBuffer): unknown;
    toRGBA8(img: unknown): ArrayBuffer[];
  };

  const UPNG: UPNG;
  export default UPNG;
}
