import { Feature, Map, View } from "ol";
import { defaults } from "ol/control";
import { platformModifierKeyOnly } from "ol/events/condition";
import { Point } from "ol/geom";
import { DragBox, Select } from "ol/interaction";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import { fromLonLat } from "ol/proj";
import { XYZ } from "ol/source";
import VectorSource from "ol/source/Vector";
import { Circle, Fill, Stroke, Style, Text } from "ol/style";
import { useDataTable } from "../stores/data-table";
import { useWorkSpace } from "../stores/workspace";
import { useItemDetail } from "../stores/item-detail";

/** 初始化地图控制 */
export function initMap(domId: string) {
  MapController.mount(domId);
}

/** 清理地图控制 */
export function unMountMap() {
  MapController.getInstance().unMount();
}

/** 为地图添加标记点 */
export function setMarkers(
  marks: { id: number; lat: number; lon: number; selected: boolean }[],
) {
  MapController.getInstance().setMarkers(marks);
}

/** 地图组件控制器 */
class MapController {
  private static instance: MapController;

  private map: Map;
  private marksFeature: Feature[] = []; // 用于存储当前的标记点特征
  private marksLayer = new VectorLayer({
    // 标记点层
    source: new VectorSource({ features: this.marksFeature }),
  });

  private constructor(id: string) {
    this.map = new Map({
      target: id,
      layers: [
        new TileLayer({
          source: new XYZ({
            url: "https://wprd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
          }),
        }),
        this.marksLayer,
        // 选中框的层
      ],
      view: new View({
        center: fromLonLat([86.0, 44.0]),
        zoom: 10,
      }),
      controls: defaults({
        zoom: false,
        rotate: false,
        attribution: false,
      }),
    });

    this.initSelectAction();
  }

  public static getInstance(): MapController {
    if (!MapController.instance) {
      throw new Error("MapController未装载");
    }
    return MapController.instance;
  }

  public static mount(id: string): MapController {
    if (!MapController.instance) {
      MapController.instance = new MapController(id);
    }
    const oldId = MapController.instance.map.getTarget();
    if (oldId) {
      MapController.instance.unMount();
    }
    MapController.instance.map.setTarget(id);
    console.log("地图控制器已装载");
    return MapController.instance;
  }

  public unMount(): void {
    // 清除地图目标
    this.map.setTarget(undefined);
    console.log("地图控制器已卸载");
  }

  public setMarkers(
    marks: { id: number; lon: number; lat: number; selected: boolean }[],
  ) {
    // 清空现有的标记点特征
    this.marksFeature = [];

    for (const item of marks) {
      const markStyle = item.selected
        ? this.createSelectedMarkerStyle(item.id)
        : this.createUnSelectedMarkerStyle(item.id);

      const markFeature = new Feature({
        geometry: new Point(fromLonLat([item.lon, item.lat])),
      });
      markFeature.setId(item.id);
      markFeature.setStyle(markStyle);
      this.marksFeature.push(markFeature);
    }
    this.marksLayer.getSource()!.clear();
    this.marksLayer.getSource()!.addFeatures(this.marksFeature);

    console.log(`更新了${marks.length}个标记点`);
  }

  /** 增加选中功能 */
  private initSelectAction() {
    // a normal select interaction to handle click
    const select = new Select({});
    this.map.addInteraction(select);
    select.on("select", (mrk) => {
      const selectedMark = mrk.selected[0];
      useItemDetail.getState().setId(selectedMark.getId() as number);
    });

    const dragBox = new DragBox({
      condition: platformModifierKeyOnly,
    });
    this.map.addInteraction(dragBox);

    dragBox.on("boxend", () => {
      const boxExtent = dragBox.getGeometry().getExtent();
      const selectedMarks = this.marksFeature.filter((markFeature) => {
        const markGeometry = markFeature.getGeometry() as Point;
        return (
          boxExtent[0] <= markGeometry.getCoordinates()[0] &&
          markGeometry.getCoordinates()[0] <= boxExtent[2] &&
          boxExtent[1] <= markGeometry.getCoordinates()[1] &&
          markGeometry.getCoordinates()[1] <= boxExtent[3]
        );
      });
      const selectedIds = selectedMarks.map((mark) => mark.getId() as number);
      useWorkSpace.getState().setSelectIds(...selectedIds);
      useDataTable.getState().setRefreshFlag(true);
    });
  }

  private createSelectedMarkerStyle(id: number): Style {
    return new Style({
      fill: new Fill({ color: "rgba(255, 255, 255, 0.2)" }),
      stroke: new Stroke({ color: "#00ff00", width: 2 }),
      image: new Circle({
        radius: 7,
        fill: new Fill({ color: "#00ff00" }),
      }),
      text: new Text({
        text: id.toString(),
        font: "10px sans-serif",
        textAlign: "center",
        textBaseline: "middle",
        fill: new Fill({ color: "#ff0000" }),
        stroke: new Stroke({ color: "#ffffff" }),
        placement: "point",
        overflow: false,
      }),
    });
  }

  private createUnSelectedMarkerStyle(id: number): Style {
    return new Style({
      fill: new Fill({ color: "rgba(255, 255, 255, 0.2)" }),
      stroke: new Stroke({ color: "#0532ff", width: 2 }),
      image: new Circle({
        radius: 7,
        fill: new Fill({ color: "#0000ff" }),
      }),
      text: new Text({
        text: id.toString(),
        font: "10px sans-serif",
        textAlign: "center",
        textBaseline: "middle",
        fill: new Fill({ color: "#ff0000" }),
        stroke: new Stroke({ color: "#ffffff" }),
        placement: "point",
        overflow: false,
      }),
    });
  }
}
