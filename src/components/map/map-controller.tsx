import { initMap, setMarkers, unMountMap } from "@/lib/map";
import { useDataset } from "@/lib/stores/raw-data";
import { useWorkSpace } from "@/lib/stores/workspace";
import { useEffect } from "react";

export function MapViewer() {
  const dataset = useDataset((state) => state.dataset);
  const selectedItems = useWorkSpace((state) => state.selectedItems);

  useEffect(() => {
    initMap("map");
    return () => {
      unMountMap();
    };
  }, []);

  useEffect(() => {
    const marks: {
      id: number;
      lat: number;
      lon: number;
      selected: boolean;
    }[] = [];
    dataset.items.forEach((value) => {
      marks.push({
        id: value.id,
        lat: value.lat,
        lon: value.lon,
        selected: selectedItems.get(value.id)!,
      });
    });
    setMarkers(marks);
  }, [dataset, selectedItems]);

  return <div id="map" className="h-full w-full select-none"></div>;
}
