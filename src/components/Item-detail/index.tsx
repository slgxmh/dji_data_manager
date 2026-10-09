import { readImgPreview } from "@/lib/actions";
import { useDataset } from "@/lib/stores/raw-data";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useItemDetail } from "@/lib/stores/item-detail";
import { Checkbox } from "../ui/checkbox";
import { useWorkSpace } from "@/lib/stores/workspace";
import Loader from "../ui/loader";

export function ItemDetail() {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const urlRef = useRef("");

  const id = useItemDetail((state) => state.id);
  const band = useItemDetail((state) => state.band);

  const getImgName = useDataset((state) => state.getImgName);
  const getFile = useDataset((state) => state.getFile);
  const isSelected = useWorkSpace((state) => state.isSelected);
  const toggleSelect = useWorkSpace((state) => state.toggleSelectId);

  const [selected, setSelected] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setSelected(isSelected(id));

      // 释放上一张预览
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = "";
      }

      const name = getImgName(id, band);
      const file = name ? getFile(name) : undefined;
      if (!file) {
        setImageUrl("");
        setLoading(false);
        return;
      }

      const url = await readImgPreview(file);
      if (cancelled) {
        URL.revokeObjectURL(url);
        return;
      }
      urlRef.current = url;
      setImageUrl(url);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, band, isSelected, getImgName, getFile]);

  if (id <= 0) return <>未选中图片</>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            {id}-{band}
          </span>
          <Checkbox
            checked={selected}
            onClick={() => {
              toggleSelect(id);
              setSelected(!selected);
            }}
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-w-[200px] flex-col items-center justify-center gap-2">
        {loading ? (
          <Loader />
        ) : (
          <img width="200px" height="200px" src={imageUrl} alt="图片" />
        )}
      </CardContent>
    </Card>
  );
}
