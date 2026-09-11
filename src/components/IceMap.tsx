import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Rectangle, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getSeaIceData, getIcebergs, IceGridPoint, Iceberg } from "../services/iceDataService";

interface IceMapProps {
  height?: string;
}

// Controller component to fix sizing issues and auto-center onto ice data
function MapController({ points }: { points: IceGridPoint[] }) {
  const map = useMap();

  useEffect(() => {
    // Invalidate map size to prevent gray/unrendered tiles
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    const timer2 = setTimeout(() => {
      map.invalidateSize();
    }, 600);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [map]);

  useEffect(() => {
    if (points.length > 0) {
      const lats = points.map((p) => p.lat);
      const lons = points.map((p) => p.lon);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);

      map.fitBounds(
        [
          [minLat, minLon],
          [maxLat, maxLon],
        ],
        { padding: [30, 30], maxZoom: 7, animate: true }
      );
    }
  }, [points, map]);

  return null;
}

// Sea ice concentration color palette (Scientific WMO ice scale)
function getConcentrationStyle(c: number) {
  if (c < 0.15) {
    return {
      fillColor: "#0a3866",
      fillOpacity: 0.35,
      color: "rgba(10, 56, 102, 0.4)",
      label: "Open Water (<15%)",
      risk: "Clear navigation",
    };
  }
  if (c < 0.4) {
    return {
      fillColor: "#00b4d8",
      fillOpacity: 0.65,
      color: "rgba(0, 180, 216, 0.6)",
      label: "Very Open Drift Ice (15-40%)",
      risk: "Navigable for ice-strengthened hulls",
    };
  }
  if (c < 0.7) {
    return {
      fillColor: "#48cae4",
      fillOpacity: 0.75,
      color: "rgba(72, 202, 228, 0.7)",
      label: "Open Pack Ice (40-70%)",
      risk: "Caution: Leads transit required",
    };
  }
  if (c < 0.9) {
    return {
      fillColor: "#caf0f8",
      fillOpacity: 0.85,
      color: "rgba(202, 240, 248, 0.8)",
      label: "Close Pack Ice (70-90%)",
      risk: "Severe resistance; icebreaker convoy recommended",
    };
  }
  return {
    fillColor: "#ffffff",
    fillOpacity: 0.95,
    color: "#45e0d0",
    label: "Fast / Consolidated Ice (90-100%)",
    risk: "Impassable pack; high structural crush risk",
  };
}

export function IceMap({ height = "480px" }: IceMapProps) {
  const [gridPoints, setGridPoints] = useState<IceGridPoint[]>([]);
  const [icebergs, setIcebergs] = useState<Iceberg[]>([]);
  const [basemap, setBasemap] = useState<"satellite" | "dark" | "ocean">("satellite");
  const [selectedCell, setSelectedCell] = useState<IceGridPoint | null>(null);

  useEffect(() => {
    getSeaIceData().then((pts) => {
      if (pts && pts.length > 0) {
        setGridPoints(pts);
      }
    });
    getIcebergs().then((bergs) => {
      if (bergs && bergs.length > 0) {
        setIcebergs(bergs);
      }
    });
  }, []);

  // Compute stats
  const stats = useMemo(() => {
    if (gridPoints.length === 0) return { avg: 0, highRiskCount: 0 };
    const avg = gridPoints.reduce((acc, p) => acc + p.concentration, 0) / gridPoints.length;
    const highRiskCount = gridPoints.filter((p) => p.concentration >= 0.7).length;
    return {
      avg: Math.round(avg * 100),
      highRiskCount,
    };
  }, [gridPoints]);

  const tileConfigs = {
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "&copy; Esri & NASA World Imagery",
    },
    dark: {
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    },
    ocean: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}",
      attribution: "&copy; Esri & GEBCO Ocean Basemap",
    },
  };

  return (
    <div className="relative rounded-[18px] overflow-hidden border border-[rgba(165,177,224,0.18)] shadow-2xl bg-[#090d16]">
      {/* Top Map Toolbar: Basemap Selector & Live Counter */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2 bg-[rgba(10,14,24,0.85)] backdrop-blur-md px-3 py-1.5 rounded-xl border border-[rgba(165,177,224,0.2)]">
        <span className="text-[10px] text-[#9297b1] uppercase tracking-wider font-semibold mr-1">
          Basemap:
        </span>
        <button
          type="button"
          onClick={() => setBasemap("satellite")}
          className={`px-2 py-1 text-[11px] rounded-lg transition-all ${
            basemap === "satellite"
              ? "bg-[#45e0d0] text-[#090d16] font-bold shadow"
              : "text-[#c2c7e0] hover:text-white hover:bg-[rgba(255,255,255,0.08)]"
          }`}
        >
          Satellite
        </button>
        <button
          type="button"
          onClick={() => setBasemap("dark")}
          className={`px-2 py-1 text-[11px] rounded-lg transition-all ${
            basemap === "dark"
              ? "bg-[#45e0d0] text-[#090d16] font-bold shadow"
              : "text-[#c2c7e0] hover:text-white hover:bg-[rgba(255,255,255,0.08)]"
          }`}
        >
          Nautical Dark
        </button>
        <button
          type="button"
          onClick={() => setBasemap("ocean")}
          className={`px-2 py-1 text-[11px] rounded-lg transition-all ${
            basemap === "ocean"
              ? "bg-[#45e0d0] text-[#090d16] font-bold shadow"
              : "text-[#c2c7e0] hover:text-white hover:bg-[rgba(255,255,255,0.08)]"
          }`}
        >
          Bathymetry
        </button>
      </div>

      {/* Top Left Live Status Pill */}
      <div className="absolute top-3 left-14 z-[1000] bg-[rgba(10,14,24,0.85)] backdrop-blur-md px-3 py-1.5 rounded-xl border border-[rgba(165,177,224,0.2)] flex items-center gap-2.5">
        <span className="w-2 h-2 rounded-full bg-[#45e0d0] animate-ping" />
        <span className="text-[11px] text-[#e0e5ff] font-medium font-space">
          Copernicus AMSR2 Telemetry
        </span>
        <span className="text-[10px] text-[#6ddcff] bg-[rgba(109,220,255,0.12)] px-2 py-0.5 rounded-md border border-[rgba(109,220,255,0.25)]">
          {gridPoints.length} Radar Cells
        </span>
        <span className="text-[10px] text-[#ff6b6b] bg-[rgba(255,107,107,0.12)] px-2 py-0.5 rounded-md border border-[rgba(255,107,107,0.25)]">
          {icebergs.length} Icebergs Tracked
        </span>
      </div>

      {/* Main Leaflet Map Container */}
      <MapContainer
        center={[-65.0, -53.0]}
        zoom={5}
        scrollWheelZoom={true}
        style={{ height, width: "100%", background: "#060911" }}
      >
        <TileLayer
          key={basemap}
          url={tileConfigs[basemap].url}
          attribution={tileConfigs[basemap].attribution}
          maxZoom={12}
        />

        <MapController points={gridPoints} />

        {/* Sea Ice SAR Radar Concentration Grid Cells */}
        {gridPoints.map((point, i) => {
          const style = getConcentrationStyle(point.concentration);
          return (
            <Rectangle
              key={`cell-${i}-${point.lat}-${point.lon}`}
              bounds={[
                [point.lat - 0.22, point.lon - 0.45],
                [point.lat + 0.22, point.lon + 0.45],
              ]}
              pathOptions={{
                color: style.color,
                weight: 1,
                fillColor: style.fillColor,
                fillOpacity: style.fillOpacity,
              }}
              eventHandlers={{
                click: () => setSelectedCell(point),
              }}
            >
              <Popup className="ice-map-popup">
                <div className="p-1 min-w-[200px] text-[#f1f2fa]">
                  <div className="flex items-center justify-between border-b border-[rgba(165,177,224,0.2)] pb-1.5 mb-1.5">
                    <span className="text-xs font-bold text-[#f1f2fa]">
                      SAR Radar Cell #{i + 1}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[rgba(69,224,208,0.2)] text-[#45e0d0] border border-[rgba(69,224,208,0.4)]">
                      {(point.concentration * 100).toFixed(0)}% Ice
                    </span>
                  </div>
                  <div className="space-y-1 text-[11px] text-[#c2c7e0]">
                    <div>
                      <strong className="text-white">Position:</strong> {Math.abs(point.lat).toFixed(2)}°S,{" "}
                      {Math.abs(point.lon).toFixed(2)}°W
                    </div>
                    <div>
                      <strong className="text-white">Classification:</strong> {style.label}
                    </div>
                    <div className="text-[10px] pt-1 border-t border-[rgba(165,177,224,0.15)] text-[#9297b1] italic">
                      {style.risk}
                    </div>
                  </div>
                </div>
              </Popup>
            </Rectangle>
          );
        })}

        {/* Major Iceberg Hazard Markers with glowing pulse rings */}
        {icebergs.map((berg) => (
          <CircleMarker
            key={`berg-${berg.id}`}
            center={[berg.lat, berg.lon]}
            radius={9}
            pathOptions={{
              color: "#ff3b30",
              weight: 2,
              fillColor: "#ff453a",
              fillOpacity: 0.85,
            }}
          >
            <CircleMarker
              center={[berg.lat, berg.lon]}
              radius={18}
              pathOptions={{
                color: "rgba(255, 69, 58, 0.4)",
                weight: 1.5,
                fillColor: "rgba(255, 69, 58, 0.15)",
                fillOpacity: 0.3,
                dashArray: "3, 3",
              }}
            />
            <Popup>
              <div className="p-1 min-w-[190px] text-[#f1f2fa]">
                <div className="flex items-center justify-between border-b border-red-500/30 pb-1 mb-1">
                  <span className="text-xs font-bold text-[#ff453a] flex items-center gap-1">
                    ⚠️ ICEBERG HAZARD
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-red-500/20 text-[#ff6b6b] border border-red-500/40 px-1.5 py-0.5 rounded">
                    {berg.id}
                  </span>
                </div>
                <div className="text-[11px] text-[#c2c7e0] space-y-1">
                  <div>
                    <strong className="text-white">Calved Size:</strong> {berg.sizeKm} km
                  </div>
                  <div>
                    <strong className="text-white">Location:</strong> {Math.abs(berg.lat).toFixed(2)}°S,{" "}
                    {Math.abs(berg.lon).toFixed(2)}°W
                  </div>
                  <div className="text-[10px] text-[#ffa502] bg-[rgba(255,165,2,0.12)] p-1.5 rounded-lg border border-[rgba(255,165,2,0.25)] mt-1.5">
                    Standoff advisory: 5.0 NM mandatory clearance
                  </div>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Floating Bottom Legend & Scale Overlay */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-[rgba(10,14,24,0.92)] backdrop-blur-lg p-3 rounded-2xl border border-[rgba(165,177,224,0.22)] shadow-xl max-w-xs text-[#e0e5ff]">
        <div className="flex justify-between items-center mb-2 pb-1 border-b border-[rgba(165,177,224,0.15)]">
          <span className="text-[10px] font-space font-semibold uppercase tracking-wider text-[#45e0d0]">
            Sea-Ice Concentration (SIC)
          </span>
          <span className="text-[9px] text-[#9297b1]">Weddell Sea</span>
        </div>

        {/* Gradient bar */}
        <div className="h-3 rounded-full mb-1.5 overflow-hidden flex border border-[rgba(255,255,255,0.15)]">
          <div style={{ flex: 1, background: "#0a3866" }} title="<15% Open Water" />
          <div style={{ flex: 1, background: "#00b4d8" }} title="15-40% Drift Ice" />
          <div style={{ flex: 1, background: "#48cae4" }} title="40-70% Open Pack" />
          <div style={{ flex: 1, background: "#caf0f8" }} title="70-90% Close Pack" />
          <div style={{ flex: 1, background: "#ffffff" }} title="90-100% Fast Ice" />
        </div>

        <div className="flex justify-between text-[9px] text-[#9297b1] font-mono px-0.5">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>

        {/* Iceberg Legend Indicator */}
        <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-[rgba(165,177,224,0.15)] text-[10px]">
          <span className="w-3 h-3 rounded-full bg-[#ff453a] border border-white flex-shrink-0" />
          <span className="text-[#c2c7e0]">Tracked Iceberg (5 NM Hazard Zone)</span>
        </div>
      </div>
    </div>
  );
}

export default IceMap;