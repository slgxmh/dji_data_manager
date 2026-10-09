# 棉花数据集管理器

无人机（大疆多光谱）拍摄数据的管理与导出工具，纯浏览器应用（无后端、无本地运行时）。

## 功能

- 打开一个数据文件夹：解析其中的 MRK 文件，把拍摄点显示在地图上
- 在地图上点选 / Ctrl 框选，或在数据表中查看，挑选需要导出的图片
- 预览各波段图片（RGB 为 JPG，多光谱波段为 TIF）
- 工程文件（选择结果 + 导出设置）保存在数据文件夹中的 `data_manager.json`，打开文件夹时自动恢复
- 在浏览器内直接裁剪并导出，写入用户选择的目录：
  - RGB（`_D.JPG`）→ 3 通道 JPEG（`{id}_D.JPG`）
  - 多光谱（`_MS_*.TIF`）→ **单通道无损 PNG**（`{id}_{band}.PNG`）

## 运行

使用 [bun](https://bun.sh/)：

```bash
bun install
bun run dev       # 开发
bun run build     # 生产构建（输出到 dist/）
bun run preview   # 预览构建结果
bun run lint      # 代码检查
```

## 浏览器要求

**仅支持 Chromium 系（Chrome / Edge）**，且需在安全上下文（`https://` 或 `localhost`）下运行：

- 读写本地目录依赖 File System Access API（Firefox / Safari 不支持）
- 打开数据文件夹时会请求读写权限，用于把工程文件写回该文件夹；若不可写，保存工程会降级为下载 JSON
- 导出为增量模式：目标目录中已存在的同名文件默认跳过，可勾选「覆盖已存在」
- 导出格式按源决定：RGB 为 JPEG，多光谱为单通道无损 PNG；建议一个拍摄架次对应一个输出目录

## 技术栈

React 19 · TypeScript · Vite · Zustand · OpenLayers · geotiff.js · shadcn/ui · Tailwind CSS
