import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";

import {
  newWorkSpace,
  openDataset,
  saveWorkSpace,
} from "@/lib/actions";
import { useDataset } from "@/lib/stores/raw-data";
import { useExportDialog } from "../export-dialog/state";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  const hasDataset = useDataset((state) => state.dataset.items.length > 0);

  /** 事件响应：新建工程（先确认，避免误清空） */
  function onNewWorkSpace() {
    const ok = window.confirm(
      "新建工程将清空当前数据集、已选图片与导出设置，是否继续？",
    );
    if (!ok) return;
    newWorkSpace();
    window.alert("已新建工程");
  }

  /** 事件响应：打开数据文件夹 */
  async function onOpenDataset() {
    try {
      await openDataset();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <div className="flex min-w-full items-center gap-2 px-1 pt-1">
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>工程</MenubarTrigger>
          <MenubarContent>
            <MenubarItem disabled={!hasDataset} onClick={onNewWorkSpace}>
              新建工程
            </MenubarItem>
            <MenubarItem
              disabled={!hasDataset}
              onClick={() => void saveWorkSpace()}
            >
              保存工程
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={() => void onOpenDataset()}>
              打开数据文件夹
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>

      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>导出</MenubarTrigger>
          <MenubarContent>
            <MenubarItem
              disabled={!hasDataset}
              onClick={() => useExportDialog.getState().setOpen(true)}
            >
              导出数据集…
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>

      <div className="grow"></div>

      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>设置</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <ThemeToggle />
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  );
}
