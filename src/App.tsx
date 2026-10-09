import DatasetTable from "./components/dataset-table";
import { ExportDialog } from "./components/export-dialog";
import { ItemDetail } from "./components/Item-detail";
import { Header } from "./components/layout/header";
import { ThemeProvider } from "./components/layout/theme-provider";
import { MapViewer } from "./components/map/map-controller";

function App() {
  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="h-screen w-screen overflow-clip">
          <Header />
          <MapViewer />
          <div className="absolute bottom-2 left-2">
            <DatasetTable />
          </div>
          <div className="absolute bottom-2 right-2">
            <ItemDetail />
          </div>
        </div>
        <ExportDialog />
      </ThemeProvider>
    </>
  );
}

export default App;
