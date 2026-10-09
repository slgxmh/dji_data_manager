// File System Access API 的补充声明。
// TypeScript 的 lib.dom 已包含 FileSystemDirectoryHandle / FileSystemFileHandle /
// FileSystemWritableFileStream，但缺少目录迭代方法和 Window 上的选择器方法。

export {};

declare global {
  interface FileSystemDirectoryHandle {
    keys(): AsyncIterableIterator<string>;
    values(): AsyncIterableIterator<FileSystemFileHandle | FileSystemDirectoryHandle>;
    entries(): AsyncIterableIterator<
      [string, FileSystemFileHandle | FileSystemDirectoryHandle]
    >;
    [Symbol.asyncIterator](): AsyncIterableIterator<
      [string, FileSystemFileHandle | FileSystemDirectoryHandle]
    >;
  }

  interface DirectoryPickerOptions {
    id?: string;
    mode?: "read" | "readwrite";
    startIn?: string;
  }

  interface FilePickerOptions {
    id?: string;
    multiple?: boolean;
    types?: {
      description?: string;
      accept: Record<string, string | string[]>;
    }[];
    excludeAcceptAllOption?: boolean;
    startIn?: string;
  }

  interface SaveFilePickerOptions extends FilePickerOptions {
    suggestedName?: string;
  }

  interface Window {
    showDirectoryPicker(
      options?: DirectoryPickerOptions,
    ): Promise<FileSystemDirectoryHandle>;
    showOpenFilePicker(
      options?: FilePickerOptions,
    ): Promise<FileSystemFileHandle[]>;
    showSaveFilePicker(
      options?: SaveFilePickerOptions,
    ): Promise<FileSystemFileHandle>;
  }
}
