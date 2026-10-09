import { useRef, useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { useExportDialog } from "./state";
import { useDataset } from "@/lib/stores/raw-data";
import { useWorkSpace } from "@/lib/stores/workspace";
import { DATASET_BANDS } from "@/lib/const";
import { pickOutputDirectory } from "@/lib/fs";
import { ExportProgress, runExport } from "@/lib/export";
import type { CropSpec } from "@/lib/geotiff";
import { ImgBand } from "@/dto/raw-data";

export function ExportDialog() {
  const open = useExportDialog((state) => state.open);
  const setOpen = useExportDialog((state) => state.setOpen);

  const dataset = useDataset((state) => state.dataset);
  const selectedItems = useWorkSpace((state) => state.selectedItems);
  const settings = useWorkSpace((state) => state.exportSettings);
  const setSettings = useWorkSpace((state) => state.setExportSettings);

  const [dir, setDir] = useState<FileSystemDirectoryHandle | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const selectedCount = Array.from(selectedItems.values()).filter(Boolean).length;

  let taskCount = 0;
  for (const item of dataset.items) {
    if (!selectedItems.get(item.id)) continue;
    for (const band of settings.bands) {
      if (item.imgs.get(band)) taskCount += 1;
    }
  }

  const isPositiveInt = (value: number) =>
    Number.isInteger(value) && value >= 1;
  const cropValid =
    settings.cropMode === "percent"
      ? Number.isFinite(settings.area) && settings.area >= 1 && settings.area <= 100
      : isPositiveInt(settings.windowWidth) && isPositiveInt(settings.windowHeight);
  const crop: CropSpec =
    settings.cropMode === "percent"
      ? { mode: "percent", area: settings.area }
      : {
          mode: "fixed",
          width: settings.windowWidth,
          height: settings.windowHeight,
        };

  const percent = progress
    ? Math.round((progress.done / Math.max(1, progress.total)) * 100)
    : 0;

  async function onPickDir() {
    try {
      setDir(await pickOutputDirectory());
    } catch {
      // 用户取消选择
    }
  }

  function toggleBand(band: ImgBand) {
    const has = settings.bands.includes(band);
    setSettings({
      bands: has
        ? settings.bands.filter((item) => item !== band)
        : DATASET_BANDS.filter(
            (item) => item === band || settings.bands.includes(item),
          ),
    });
  }

  async function onExport() {
    if (!dir || taskCount === 0 || !cropValid) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setRunning(true);
    setProgress({
      total: taskCount,
      done: 0,
      skipped: 0,
      failed: [],
      current: "",
    });
    try {
      const result = await runExport({
        dir,
        crop,
        bands: settings.bands,
        overwrite,
        signal: controller.signal,
        onProgress: setProgress,
      });
      setProgress(result);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : String(error));
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  async function onCopyFailures() {
    if (!progress?.failed.length) return;
    const text = progress.failed
      .map((failure) => `${failure.name}\t${failure.message}`)
      .join("\n");
    await navigator.clipboard.writeText(text);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!running) setOpen(next);
      }}
    >
      <DialogContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          已选 {selectedCount} 张 × {settings.bands.length} 波段 = 共 {taskCount}{" "}
          个文件
        </p>
        <p className="text-xs text-muted-foreground">
          多光谱（TIF）波段导出为单通道无损 PNG；RGB（D）导出为 JPEG。
        </p>

        <div className="flex items-center gap-2">
          <span className="w-20 text-nowrap">波段</span>
          {DATASET_BANDS.map((band) => (
            <label key={band} className="flex items-center gap-1">
              <Checkbox
                checked={settings.bands.includes(band)}
                disabled={running}
                onClick={() => toggleBand(band)}
              />
              {band}
            </label>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="w-20 text-nowrap">裁剪模式</span>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="crop-mode"
              checked={settings.cropMode === "percent"}
              disabled={running}
              onChange={() => setSettings({ cropMode: "percent" })}
            />
            百分比
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="crop-mode"
              checked={settings.cropMode === "fixed"}
              disabled={running}
              onChange={() => setSettings({ cropMode: "fixed" })}
            />
            固定窗口
          </label>
        </div>

        {settings.cropMode === "percent" ? (
          <div className="flex items-center gap-2">
            <span className="w-20 text-nowrap">裁剪大小</span>
            <Input
              type="number"
              min={1}
              max={100}
              disabled={running}
              value={settings.area}
              onChange={(event) =>
                setSettings({ area: Number(event.target.value) })
              }
            />
            <span>%</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="w-20 text-nowrap">窗口大小</span>
            <Input
              type="number"
              min={1}
              disabled={running}
              value={settings.windowWidth}
              onChange={(event) =>
                setSettings({ windowWidth: Number(event.target.value) })
              }
            />
            <span>×</span>
            <Input
              type="number"
              min={1}
              disabled={running}
              value={settings.windowHeight}
              onChange={(event) =>
                setSettings({ windowHeight: Number(event.target.value) })
              }
            />
            <span>px</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="w-20 text-nowrap">输出目录</span>
          <Input value={dir?.name ?? ""} disabled placeholder="未选择" />
          <Button variant="outline" disabled={running} onClick={onPickDir}>
            选择目录
          </Button>
        </div>

        <label className="flex items-center gap-1 text-sm">
          <Checkbox
            checked={overwrite}
            disabled={running}
            onClick={() => setOverwrite(!overwrite)}
          />
          覆盖已存在（默认增量跳过）
        </label>

        {progress && (
          <div className="flex flex-col gap-1">
            <div className="h-2 w-full overflow-hidden rounded bg-secondary">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              已处理 {progress.done}/{progress.total}，跳过 {progress.skipped}，失败{" "}
              {progress.failed.length}
              {progress.current ? ` · 当前 ${progress.current}` : ""}
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          {progress && progress.failed.length > 0 && !running && (
            <Button variant="outline" onClick={() => void onCopyFailures()}>
              复制失败清单
            </Button>
          )}
          {running ? (
            <Button variant="outline" onClick={() => abortRef.current?.abort()}>
              取消
            </Button>
          ) : (
            <Button
              disabled={!dir || taskCount === 0 || !cropValid}
              onClick={() => void onExport()}
            >
              开始导出
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
