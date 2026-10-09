import { ExportSettings, WorkSpaceFile } from "@/dto/workspace";
import { WORKSPACE_FILE_NAME } from "../const";
import { downloadText, pickDirectory, writeBlob } from "../fs";
import { createPreviewUrl } from "../image";
import { buildDataset } from "../mrk";
import { defaultExportSettings, useWorkSpace } from "../stores/workspace";
import { useDataset } from "../stores/raw-data";
import { useDataTable } from "../stores/data-table";

/**
 * 选择数据文件夹并加载数据集，同时读取其中的工程文件（若存在）。
 * 打开文件夹即完成「解析 MRK + 恢复工程」两件事。
 */
export async function openDataset(): Promise<void> {
  const dir = await pickDirectory();
  const built = await buildDataset(dir.name, dir.files);

  useDataset
    .getState()
    .setDataset(
      { dirName: built.dirName, items: built.items },
      built.files,
      dir.handle,
    );

  const workspaceFile = dir.files.find(
    (file) => file.name === WORKSPACE_FILE_NAME,
  );
  if (workspaceFile) {
    const workspace = decodeWorkSpace(await workspaceFile.text());
    useWorkSpace.getState().setDirName(dir.name);
    useWorkSpace.getState().restoreSelected(workspace.selectedItems);
    useWorkSpace.getState().setExportSettings(workspace.exportSettings);
  } else {
    useWorkSpace.getState().clearSelected();
    useWorkSpace.getState().setDirName(dir.name);
  }

  useDataTable.getState().setRefreshFlag(true);
}

/** 新建工程：清空当前数据集与选择 */
export function newWorkSpace(): void {
  useDataset.getState().clearDataset();
  useWorkSpace.getState().clearSelected();
  useDataTable.getState().setRefreshFlag(true);
}

/** 保存工程：写入数据文件夹；若不可写则降级为下载 JSON */
export async function saveWorkSpace(): Promise<void> {
  const { dirName, selectedItems, exportSettings } = useWorkSpace.getState();
  const json = encodeWorkSpace({ dirName, selectedItems, exportSettings });
  const handle = useDataset.getState().dirHandle;

  if (handle) {
    try {
      await writeBlob(
        handle,
        WORKSPACE_FILE_NAME,
        new Blob([json], { type: "application/json" }),
      );
      window.alert("工程已保存到数据文件夹");
      return;
    } catch (error) {
      console.error(error);
    }
  }

  downloadText(`${dirName || "workspace"}.json`, json);
  window.alert("无法写入数据文件夹，已改为下载工程文件");
}

/** 读取图片预览（返回 WebP Blob URL） */
export async function readImgPreview(file: File): Promise<string> {
  return createPreviewUrl(file);
}

/** 编码工作空间文件 */
function encodeWorkSpace({
  dirName,
  selectedItems,
  exportSettings,
}: WorkSpaceFile): string {
  return JSON.stringify({
    dirName,
    selectedItems: Array.from(selectedItems),
    exportSettings,
  });
}

/** 解码工作空间文件 */
function decodeWorkSpace(text: string): WorkSpaceFile {
  const parsed = JSON.parse(text) as {
    dirName?: string;
    selectedItems?: [number, boolean][];
    exportSettings?: Partial<ExportSettings>;
  };
  return {
    dirName: parsed.dirName ?? "",
    selectedItems: new Map(parsed.selectedItems ?? []),
    exportSettings: { ...defaultExportSettings(), ...parsed.exportSettings },
  };
}
