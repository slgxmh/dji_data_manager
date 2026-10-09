import { ImgBand } from "@/dto/raw-data";
import { DATASET_BANDS, isTiffFile } from "./const";
import { listFileNames, writeBlob } from "./fs";
import { useDataset } from "./stores/raw-data";
import { useWorkSpace } from "./stores/workspace";
import type { CropSpec } from "./geotiff";

/** 最多同时使用的 Worker 数 */
const MAX_WORKERS = 4;

export type ExportFailure = { name: string; message: string };

/** 导出进度 */
export type ExportProgress = {
  /** 需要执行的任务总数（不含跳过的） */
  total: number;
  /** 已完成（成功 + 失败）的任务数 */
  done: number;
  /** 因已存在而跳过的数量 */
  skipped: number;
  /** 失败清单 */
  failed: ExportFailure[];
  /** 当前处理的文件名 */
  current: string;
};

export type ExportOptions = {
  dir: FileSystemDirectoryHandle;
  /** 裁剪描述（百分比或固定窗口） */
  crop: CropSpec;
  /** 要导出的波段 */
  bands: ImgBand[];
  /** 是否覆盖已存在文件（false 时增量跳过） */
  overwrite: boolean;
  signal?: AbortSignal;
  onProgress?: (progress: ExportProgress) => void;
};

type ExportTask = {
  outputName: string;
  sourceName: string;
  format: "jpg" | "png";
};

function createImageWorker(): Worker {
  return new Worker(new URL("../workers/image.worker.ts", import.meta.url), {
    type: "module",
  });
}

/** 把一个裁剪任务交给指定 Worker 处理 */
function runOnWorker(
  worker: Worker,
  requestId: number,
  file: File,
  format: "jpg" | "png",
  crop: CropSpec,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    function cleanup() {
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
    }
    function onMessage(event: MessageEvent) {
      const data = event.data as { id: number; blob?: Blob; error?: string };
      if (data.id !== requestId) return;
      cleanup();
      if (data.error) {
        reject(new Error(data.error));
      } else {
        resolve(data.blob as Blob);
      }
    }
    function onError(event: ErrorEvent) {
      cleanup();
      reject(new Error(event.message));
    }
    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onError);
    worker.postMessage({ id: requestId, file, format, crop });
  });
}

/**
 * 在浏览器内把当前选中的数据集导出，写入目标目录。
 * 按源格式输出：RGB（JPG）→ {id}_{band}.JPG；单波段（TIF）→ {id}_{band}.PNG（无损）。
 * 使用 Worker 池并行裁剪编码，逐张写盘，支持增量跳过与取消。
 */
export async function runExport(
  options: ExportOptions,
): Promise<ExportProgress> {
  const { dir, crop, bands, overwrite, signal, onProgress } = options;

  const dataset = useDataset.getState();
  const selected = useWorkSpace.getState().selectedItems;
  const bandSet = new Set(bands);
  const existing = await listFileNames(dir);

  const queue: ExportTask[] = [];
  let skipped = 0;

  for (const item of dataset.dataset.items) {
    if (!selected.get(item.id)) continue;
    for (const band of DATASET_BANDS) {
      if (!bandSet.has(band)) continue;
      const sourceName = item.imgs.get(band);
      if (!sourceName) continue;
      const tiff = isTiffFile(sourceName);
      const format: "jpg" | "png" = tiff ? "png" : "jpg";
      const outputName = `${item.id}_${band}.${tiff ? "PNG" : "JPG"}`;
      if (!overwrite && existing.has(outputName)) {
        skipped += 1;
        continue;
      }
      queue.push({ outputName, sourceName, format });
    }
  }

  const failures: ExportFailure[] = [];
  const progress: ExportProgress = {
    total: queue.length,
    done: 0,
    skipped,
    failed: failures,
    current: "",
  };
  const emit = () =>
    onProgress?.({ ...progress, failed: [...failures] });
  emit();

  let index = 0;
  let requestId = 0;

  async function runner(): Promise<void> {
    const worker = createImageWorker();
    try {
      while (!signal?.aborted) {
        const task = queue[index++];
        if (!task) break;

        progress.current = task.outputName;
        emit();

        try {
          const file = dataset.getFile(task.sourceName);
          if (!file) throw new Error("找不到源文件");
          const blob = await runOnWorker(
            worker,
            ++requestId,
            file,
            task.format,
            crop,
          );
          await writeBlob(dir, task.outputName, blob);
        } catch (error) {
          failures.push({
            name: task.outputName,
            message: error instanceof Error ? error.message : String(error),
          });
        }

        progress.done += 1;
        emit();
      }
    } finally {
      worker.terminate();
    }
  }

  const concurrency = Math.max(
    1,
    Math.min(
      MAX_WORKERS,
      navigator.hardwareConcurrency || 1,
      queue.length || 1,
    ),
  );
  await Promise.all(Array.from({ length: concurrency }, () => runner()));

  progress.current = "";
  emit();
  return progress;
}
