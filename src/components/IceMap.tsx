import { useEffect, useState, useMemo, Fragment } from "react";
import { MapContainer, TileLayer, Rectangle, CircleMarker, Popup, useMap, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getSeaIceData, getIcebergs, IceGridPoint, Iceberg } from "../services/iceDataService";
import { getSettings, onSettingsChanged } from "../services/settingsService";

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
  // Simulated own-ship position near the Weddell approach (matches the dashboard vessel)
  const vesselPos = useMemo(() => ({ lat: -64.42, lon: -57.18 }), []);
  // Operator's CPA buffer (settings view) scales the hazard standoff rings
  const [cpaNm, setCpaNm] = useState<number>(() => getSettings().cpaThresholdNm);

  useEffect(() => onSettingsChanged((s) => setCpaNm(s.cpaThresholdNm)), []);

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

  // Iceberg markers rendered as live radar contacts: pulsing ring, drift vector, ID label
  const bergIcons = useMemo(() => {
    const icons = new Map<string, L.DivIcon>();
    icebergs.forEach((berg) => {
      const isGiant = berg.sizeKm > 10;
      const ringColor = isGiant ? "#ffa502" : "#ff453a";
      // Deterministic pseudo-random drift bearing from the berg id (stable across renders)
      let hash = 0;
      for (let c = 0; c < berg.id.length; c++) hash = (hash * 31 + berg.id.charCodeAt(c)) | 0;
      const driftDeg = ((hash >>> 4) % 360 + 360) % 360;
      const sizePx = isGiant ? 26 : 20;
      icons.set(
        berg.id,
        L.divIcon({
          className: "berg-marker-wrapper",
          iconSize: [sizePx, sizePx],
          iconAnchor: [sizePx / 2, sizePx / 2],
          html: `
            <div class="berg-marker ${isGiant ? "berg-giant" : ""}" style="--berg-ring: ${ringColor}">
              <span class="berg-ping"></span>
              <span class="berg-core"></span>
              <span class="berg-arrow" style="transform: rotate(${driftDeg}deg)"></span>
              <span class="berg-label">${berg.id}</span>
            </div>`,
        }),
      );
    });
    return icons;
  }, [icebergs]);

  const tileConfigs = {
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "&copy; Esri & NASA World Imagery",
    },
    dark: {
      // CARTO's dark_all tiles now watermark "API KEY REQUIRED" without an
      // account, so the dark basemap uses Esri's free Dark Gray Canvas instead.
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      attribution: "&copy; Esri &copy; HERE, Garmin, FAO, NOAA, USGS",
    },
    ocean: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}",
      attribution: "&copy; Esri & GEBCO Ocean Basemap",
    },
  };

  return (
    <div className="relative rounded-[18px] overflow-hidden border border-[rgba(196,219,255,0.18)] shadow-2xl bg-[#0a1120]">
      {/* Top Map Toolbar: Basemap Selector & Live Counter */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2 bg-[rgba(148,180,235,0.12)] backdrop-blur-xl px-3 py-1.5 rounded-xl border border-[rgba(196,219,255,0.24)]">
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
      <div className="absolute top-3 left-14 z-[1000] bg-[rgba(148,180,235,0.12)] backdrop-blur-xl px-3 py-1.5 rounded-xl border border-[rgba(196,219,255,0.24)] flex items-center gap-2.5">
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
          const isSelected = selectedCell === point;
          return (
            <Rectangle
              key={`cell-${i}-${point.lat}-${point.lon}`}
              bounds={[
                [point.lat - 0.22, point.lon - 0.45],
                [point.lat + 0.22, point.lon + 0.45],
              ]}
              pathOptions={{
                color: isSelected ? "#45e0d0" : style.color,
                weight: isSelected ? 2.5 : 1,
                fillColor: style.fillColor,
                fillOpacity: isSelected ? Math.min(1, style.fillOpacity + 0.15) : style.fillOpacity,
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

        {/* Major Iceberg Hazard Markers — live radar-contact style, sized by calved mass */}
        {icebergs.map((berg) => {
          const estDraftM = Math.round(berg.sizeKm * 8.5);
          const isGiant = berg.sizeKm > 10;
          return (
            <Fragment key={`berg-${berg.id}`}>
              {/* CPA standoff advisory zone — radius follows the operator's CPA buffer setting */}
              <CircleMarker
                center={[berg.lat, berg.lon]}
                radius={Math.max(8, Math.min(28, cpaNm * 0.7))}
                pathOptions={{
                  color: "rgba(255, 69, 58, 0.4)",
                  weight: 1.5,
                  fillColor: "rgba(255, 69, 58, 0.15)",
                  fillOpacity: 0.12,
                  dashArray: "3, 3",
                }}
              />
              {/* Bathymetric keel contour: dashed ring suggesting the submerged ice footprint */}
              {isGiant && (
                <CircleMarker
                  center={[berg.lat, berg.lon]}
                  radius={22}
                  pathOptions={{
                    color: "rgba(109, 220, 255, 0.45)",
                    weight: 1.2,
                    fillColor: "rgba(109, 220, 255, 0.06)",
                    fillOpacity: 0.2,
                    dashArray: "6, 5",
                  }}
                />
              )}
              {/* Pulsing radar-contact marker */}
              <Marker
                position={[berg.lat, berg.lon]}
                icon={bergIcons.get(berg.id)}
                zIndexOffset={500}
              >
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
                  <div>
                    <strong className="text-white">Est. Keel Draft:</strong> ~{estDraftM} m below waterline
                  </div>
                  <div className="text-[10px] text-[#ffa502] bg-[rgba(255,165,2,0.12)] p-1.5 rounded-lg border border-[rgba(255,165,2,0.25)] mt-1.5">
                    Standoff advisory: {cpaNm} NM CPA buffer (Settings)
                  </div>
                </div>
              </div>
            </Popup>
              </Marker>
            </Fragment>
          );
        })}

        {/* Own-ship position: cyan nav light with safety halo */}
        <CircleMarker
          center={[vesselPos.lat, vesselPos.lon]}
          radius={6}
          pathOptions={{
            color: "#ffffff",
            weight: 1.5,
            fillColor: "#45e0d0",
            fillOpacity: 1,
          }}
          zIndexOffset={900}
        >
          <Popup>
            <div className="p-1 min-w-[160px] text-[#f1f2fa]">
              <div className="text-xs font-bold text-[#45e0d0] mb-1">⚓ R/V PIONEER (Own Ship)</div>
              <div className="text-[11px] text-[#c2c7e0]">
                {Math.abs(vesselPos.lat).toFixed(2)}°S, {Math.abs(vesselPos.lon).toFixed(2)}°W — ice-class hull, nominal propulsion.
              </div>
            </div>
          </Popup>
        </CircleMarker>
        <CircleMarker
          center={[vesselPos.lat, vesselPos.lon]}
          radius={14}
          pathOptions={{
            color: "rgba(69, 224, 208, 0.5)",
            weight: 1.5,
            fillColor: "rgba(69, 224, 208, 0.08)",
            fillOpacity: 0.15,
            dashArray: "2, 4",
          }}
        />
      </MapContainer>

      {/* Floating Bottom Legend & Scale Overlay */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-[rgba(148,180,235,0.14)] backdrop-blur-xl p-3 rounded-2xl border border-[rgba(196,219,255,0.26)] shadow-xl max-w-xs text-[#e0e5ff]">
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

        {/* Live grid statistics + iceberg legend */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[rgba(165,177,224,0.15)] text-[10px]">
          <span className="flex items-center gap-1.5 text-[#c2c7e0]">
            <span className="w-3 h-3 rounded-full bg-[#ff453a] border border-white flex-shrink-0" />
            Tracked Iceberg ({cpaNm} NM hazard zone)
          </span>
          <span className="font-mono text-[#9297b1]">{icebergs.length} contacts</span>
        </div>
        <div className="flex items-center justify-between mt-1.5 text-[10px] font-mono">
          <span className="text-[#9297b1]">Grid mean SIC</span>
          <span className="text-[#6ddcff] font-bold">{stats.avg}%</span>
        </div>
        <div className="flex items-center justify-between mt-0.5 text-[10px] font-mono">
          <span className="text-[#9297b1]">Heavy cells (≥70%)</span>
          <span className="text-[#ffca72] font-bold">{stats.highRiskCount} / {gridPoints.length}</span>
        </div>
      </div>
    </div>
  );
}

export default IceMap;