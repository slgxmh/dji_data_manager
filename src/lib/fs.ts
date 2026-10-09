/** 选中的文件夹及其文件列表、目录句柄 */
export type PickedDirectory = {
  name: string;
  files: File[];
  handle: FileSystemDirectoryHandle;
};

/** 打开一个可读写目录，读取其中所有文件并返回目录句柄 */
export async function pickDirectory(): Promise<PickedDirectory> {
  const handle = await window.showDirectoryPicker({ mode: "readwrite" });
  const files: File[] = [];
  for await (const entry of handle.values()) {
    if (entry.kind === "file") {
      files.push(await entry.getFile());
    }
  }
  return { name: handle.name, files, handle };
}

/** 打开一个可写目录，用于导出结果 */
export function pickOutputDirectory(): Promise<FileSystemDirectoryHandle> {
  return window.showDirectoryPicker({ mode: "readwrite" });
}

/** 列出目录下已有的文件名 */
export async function listFileNames(
  dir: FileSystemDirectoryHandle,
): Promise<Set<string>> {
  const names = new Set<string>();
  for await (const name of dir.keys()) {
    names.add(name);
  }
  return names;
}

/** 将一个 Blob 写入目录下的文件 */
export async function writeBlob(
  dir: FileSystemDirectoryHandle,
  fileName: string,
  blob: Blob,
): Promise<void> {
  const handle = await dir.getFileHandle(fileName, { create: true });
  const writable = await handle.createWritable();
  try {
    await writable.write(blob);
  } finally {
    await writable.close();
  }
}

/** 触发浏览器下载一段文本（用于工程文件） */
export function downloadText(
  fileName: string,
  text: string,
  mimeType = "application/json",
): void {
  const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
