# 导出裁剪模式设计：百分比 + 固定窗口

日期：2026-10-09
范围：`data_manager`（纯 Web 项目）

## 背景

当前导出只支持百分比中心裁剪（`area` 1–100）。需要新增固定窗口裁剪：用户指定输出的宽、高（像素），以图像中心为中心裁剪。

## 已确认的需求

- 固定窗口的尺寸以“宽 × 高（像素）”指定，两个值分别填写。
- 窗口大于原图时，截断到原图范围，输出尺寸为 `min(窗口, 原图)`，不报错。
- 固定窗口以图像中心对齐，与百分比裁剪的定位方式一致。
- 导出对话框中用单选按钮切换“百分比”和“固定窗口”两种模式。
- 不修改 Python 脚本（`data_scripts/`），本次只改 Web 端。

## 设计

### 1. 数据模型（`src/dto/workspace.ts`）

导出设置新增字段，原有 `area` 保留：

```ts
cropMode: "percent" | "fixed"; // 默认 "percent"
area: number;                  // 百分比模式，默认 100
windowWidth: number;           // 固定窗口宽（像素），默认 512
windowHeight: number;          // 固定窗口高（像素），默认 512
```

旧工程文件（`data_manager.json`）没有这些字段。`decodeWorkSpace`（`src/lib/actions/index.ts`）已用默认值合并 `exportSettings`，因此旧工程可以直接打开，新字段取默认值。

### 2. 裁剪计算（`src/lib/geotiff.ts`）

引入一个裁剪描述类型，并让所有裁剪共用一个函数：

```ts
type CropSpec =
  | { mode: "percent"; area: number }
  | { mode: "fixed"; width: number; height: number };
```

`centerCropWindow(width, height, crop: CropSpec): CropWindow`：

- 百分比：`cw = floor(W * area / 100)`，`ch = floor(H * area / 100)`，结果与现在一致。
- 固定窗口：`cw = min(W, windowWidth)`，`ch = min(H, windowHeight)`。
- 两种模式都以图像中心对齐：`left = floor(W/2) - floor(cw/2)`，`top = floor(H/2) - floor(ch/2)`。

`src/lib/image.ts` 中 `cropToJpegBlob` 目前自行计算裁剪区域，改为调用同一个函数，保证 JPG（RGB）与 TIF（多光谱）的裁剪规则一致。

### 3. 导出链路

- `ExportOptions.area` 改为 `crop: CropSpec`（`src/lib/export.ts`）。
- Worker 消息中的 `area` 改为传递 `crop`（`src/workers/image.worker.ts`）。
- `cropToGrayPngBlob`、`cropToJpegBlob`、`readTiffCropGray` 的参数由 `area` 改为 `crop`。
- `ExportRecord`（`src/dto/export-params.ts`）当前未被使用，不做改动。

### 4. 界面（`src/components/export-dialog/index.tsx`）

- 新增“裁剪模式”单选按钮组：“百分比”“固定窗口”。
- 选择“百分比”时显示原有的百分比输入框（1–100）。
- 选择“固定窗口”时显示“宽”“高”两个输入框（像素，正整数）。
- 输入不合法时禁用“开始导出”按钮：百分比不在 1–100 之间，或窗口宽/高不是正整数。
- 对话框中的“已选 N 张 × M 波段”统计与模式无关，不需要改动。

### 5. 错误处理

- 窗口超出原图：按截断规则处理，不作为错误。
- 读取 TIF 或解码失败：沿用现有的失败清单机制。

### 6. 测试

- 对 `centerCropWindow` 做数值校验，覆盖以下情况：窗口小于原图、窗口等于原图、窗口大于原图（截断）、窗口一个方向超出一个方向不超出、百分比模式结果与改造前一致。
- 手动验证：用真实的 RGB 与多光谱数据分别在两种模式下导出，检查输出尺寸和居中位置。

## 不在本次范围内

- Python 脚本（`data_scripts/`）的任何修改。
- 固定窗口的偏移量或自定义位置（已确认采用中心对齐）。
- 工程文件格式版本号的变更。
