import { MrkItem } from "@/dto/raw-data";
import { ColumnDef } from "@tanstack/react-table";
import { Check } from "lucide-react";

export type ColumnType = MrkItem & { selected: boolean };

export const columns: ColumnDef<ColumnType>[] = [
  {
    id: "select",
    header: "选中",
    cell: ({ row }) => {
      if (row.original.selected) return <Check />;
    },
    enableSorting: false,
    enableHiding: false,
    accessorKey: "selected",
  },
  {
    accessorKey: "id",
    header: "图片编号",
  },
  {
    accessorKey: "lat",
    header: "维度",
  },
  {
    accessorKey: "lon",
    header: "经度",
  },
];
