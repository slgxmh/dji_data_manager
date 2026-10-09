import { useDataTable } from "@/lib/stores/data-table";
import { useDataset } from "@/lib/stores/raw-data";
import { ChevronsDown, ChevronsUpIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { columns, ColumnType } from "./columns";
import { DataTable } from "./data-table";
import { useWorkSpace } from "@/lib/stores/workspace";

/** 显示目前数据状态 */
export default function DatasetTable() {
  const [collapse, setCollapse] = useState(false);

  const dataset = useDataset((state) => state.dataset);
  const selectedItems = useWorkSpace((state) => state.selectedItems);
  const [tableData, setTableData] = useState<ColumnType[]>([]);

  const refreshFlag = useDataTable((state) => state.refreshFlag);
  const setRefreshFlag = useDataTable((state) => state.setRefreshFlag);

  const selectedCount = Array.from(selectedItems.values()).filter(Boolean).length;

  /** 事件响应：数据集/选择改变 */
  function onDatasetChange(): ColumnType[] {
    return dataset.items.map((item) => ({
      ...item,
      selected: selectedItems.get(item.id) || false,
    }));
  }

  useEffect(() => {
    setTableData(onDatasetChange());
    setRefreshFlag(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshFlag]);

  return (
    <div className="flex h-fit w-fit flex-col gap-1">
      <Button
        onClick={() => setCollapse(!collapse)}
        variant="outline"
        className="justify-start"
      >
        数据：「选中{selectedCount}个」
        {collapse ? <ChevronsDown /> : <ChevronsUpIcon />}
      </Button>
      <div className="bg-primary-foreground">
        {collapse && <DataTable columns={columns} data={tableData} />}
      </div>
    </div>
  );
}
