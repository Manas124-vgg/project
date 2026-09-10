import React, { useState, useRef, useMemo } from 'react';
import { Iceberg, MapLayers, VesselTelemetry, ResearchStation, MapWaypoint } from '../types';
import { researchStations, corridorWaypoints, corridors } from '../data/mockData';
import { Antarctic3DMap } from './Antarctic3DMap';

interface AntarcticMapProps {
  icebergs: Iceberg[];
  vessel: VesselTelemetry;
  selectedIcebergId: string | null;
  onSelectIceberg: (id: string | null) => void;
  layers: MapLayers;
  onToggleLayer: (layer: keyof MapLayers) => void;
  selectedCorridorId?: string;
  onSelectCorridor?: (id: string) => void;
}

export const AntarcticMap: React.FC<AntarcticMapProps> = ({
  icebergs,
  vessel,
  selectedIcebergId,
  onSelectIceberg,
  layers,
  onToggleLayer,
  selectedCorridorId = 'corridor-a',
  onSelectCorridor,
}) => {
  // View Mode: '2d' (NSIDC Satellite Polar Projection) or '3d' (Live WebGL 3D Globe)
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  // NSIDC Satellite Product Mode: 'concentration' (0-100% Heatmap) or 'extent' (Solid >=15% Pack)
  const [satelliteProduct, setSatelliteProduct] = useState<'concentration' | 'extent'>('concentration');

  // Map Container & Viewport Pan/Zoom State (Completely stationary, no accidental resizing)
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Fullscreen expansion state
  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(false);

  // Scroll hint notification when scrolling without Ctrl
  const [showScrollHint, setShowScrollHint] = useState<boolean>(false);
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cursor Hover & Polar Coordinate Readout
  const [hoverCoord, setHoverCoord] = useState<{
    lat: string;
    lon: string;
    svgX: number;
    svgY: number;
    depthM: number;
    icePct: number;
  } | null>(null);

  // Inspection Card states
  const [showVesselCard, setShowVesselCard] = useState<boolean>(false);
  const [selectedStation, setSelectedStation] = useState<ResearchStation | null>(null);
  const [selectedWaypoint, setSelectedWaypoint] = useState<MapWaypoint | null>(null);

  // Nautical Measurement Ruler Tool State
  const [measureMode, setMeasureMode] = useState<boolean>(false);
  const [measureStart, setMeasureStart] = useState<{ x: number; y: number; lat: string; lon: string } | null>(null);
  const [measureCurrent, setMeasureCurrent] = useState<{ x: number; y: number; lat: string; lon: string } | null>(null);
  const [measureLocked, setMeasureLocked] = useState<boolean>(false);

  // 48-Hour Simulation Time-Horizon (Still & static by default, projects only when selected)
  const [simulationHour, setSimulationHour] = useState<number>(0);

  // Extended active layers
  const [activeLayers, setActiveLayers] = useState({
    ice: layers.ice ?? true,
    medianEdge: true,
    bergs: layers.bergs ?? true,
    route: layers.route ?? true,
    driftVectors: layers.driftVectors ?? true,
    stations: layers.stations ?? true,
    vessel: true,
  });

  const toggleLayer = (layerKey: keyof typeof activeLayers) => {
    setActiveLayers((prev) => {
      const nextVal = !prev[layerKey];
      if (layerKey in layers) {
        onToggleLayer(layerKey as keyof MapLayers);
      }
      return { ...prev, [layerKey]: nextVal };
    });
  };

  // Selected corridor waypoints
  const activeWaypoints = useMemo(() => {
    return corridorWaypoints[selectedCorridorId] || corridorWaypoints['corridor-a'];
  }, [selectedCorridorId]);

  // Selected iceberg
  const selectedBerg = useMemo(() => {
    return icebergs.find((b) => b.id === selectedIcebergId) || null;
  }, [icebergs, selectedIcebergId]);

  // Projected positions for icebergs (Completely static when simulationHour === 0)
  const projectedIcebergs = useMemo(() => {
    return icebergs.map((b) => {
      if (simulationHour === 0) {
        return {
          ...b,
          currentSvgX: b.svgX,
          currentSvgY: b.svgY,
          projectedDistanceNm: b.distanceNm,
        };
      }

      const rad = (b.driftHeadingDeg * Math.PI) / 180;
      const simDeltaX = Math.sin(rad) * (b.driftSpeedKnots * simulationHour * 0.28);
      const simDeltaY = -Math.cos(rad) * (b.driftSpeedKnots * simulationHour * 0.28);

      return {
        ...b,
        currentSvgX: b.svgX + simDeltaX,
        currentSvgY: b.svgY + simDeltaY,
        projectedDistanceNm: Math.max(2.0, Number((b.distanceNm - (b.driftSpeedKnots * simulationHour * 0.15)).toFixed(1))),
      };
    });
  }, [icebergs, simulationHour]);

  // Projected vessel position along waypoint route
  const projectedVesselPosition = useMemo(() => {
    if (simulationHour === 0 || activeWaypoints.length < 2) {
      return { x: vessel.position.svgX, y: vessel.position.svgY, heading: vessel.heading };
    }

    const progressRatio = Math.min(1, simulationHour / 32);
    const totalSegments = activeWaypoints.length - 1;
    const segmentProgress = progressRatio * totalSegments;
    const currentSegIndex = Math.min(Math.floor(segmentProgress), totalSegments - 1);
    const segFraction = segmentProgress - currentSegIndex;

    const wp1 = activeWaypoints[currentSegIndex];
    const wp2 = activeWaypoints[currentSegIndex + 1];

    const currentX = wp1.svgX + (wp2.svgX - wp1.svgX) * segFraction;
    const currentY = wp1.svgY + (wp2.svgY - wp1.svgY) * segFraction;

    const angleDeg = (Math.atan2(wp2.svgY - wp1.svgY, wp2.svgX - wp1.svgX) * 180) / Math.PI + 90;

    return { x: currentX, y: currentY, heading: Math.round((angleDeg + 360) % 360) };
  }, [vessel, simulationHour, activeWaypoints]);

  // Transform coordinates from client mouse to SVG coordinate space
  const getSvgCoordinates = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 440, y: 265 };
    const rect = containerRef.current.getBoundingClientRect();
    const clientRelX = clientX - rect.left;
    const clientRelY = clientY - rect.top;

    const unzoomedX = (clientRelX - pan.x) / zoom;
    const unzoomedY = (clientRelY - pan.y) / zoom;

    const svgX = (unzoomedX / rect.width) * 960;
    const svgY = (unzoomedY / rect.height) * 540;

    return {
      x: Math.max(0, Math.min(960, svgX)),
      y: Math.max(0, Math.min(540, svgY)),
    };
  };

  // Convert SVG coordinates to Polar Stereographic Latitude / Longitude
  const svgToPolarCoords = (x: number, y: number) => {
    const cx = 440;
    const cy = 265;
    const dx = x - cx;
    const dy = y - cy;
    const distPx = Math.sqrt(dx * dx + dy * dy);

    // Distance from pole: 0px = 90°S, ~70px = 80°S, ~140px = 70°S, ~210px = 60°S, ~280px = 50°S
    const latDeg = Math.min(90, Math.max(50, 90 - (distPx / 70) * 10)).toFixed(2);

    // Angle: standard polar orientation where upward is 0° meridian (Greenwich)
    let angleRad = Math.atan2(dx, -dy);
    let angleDeg = (angleRad * 180) / Math.PI;
    const lonDirection = angleDeg >= 0 ? 'E' : 'W';
    const lonAbs = Math.abs(angleDeg).toFixed(2);

    const depthM = distPx < 140 ? Math.round(180 + distPx * 4) : Math.round(1500 + (distPx - 140) * 12);
    // Estimated ice concentration based on polar distance
    const icePct = distPx > 265 ? 0 : distPx > 240 ? Math.round(15 + (265 - distPx) * 2.8) : distPx > 170 ? Math.round(65 + (240 - distPx) * 0.4) : Math.min(100, Math.round(85 + (170 - distPx) * 0.15));

    return { lat: `${latDeg}°S`, lon: `${lonAbs}°${lonDirection}`, depthM, icePct };
  };

  // Centering / Camera Navigation Helpers
  const centerCameraOn = (targetSvgX: number, targetSvgY: number, targetZoom: number = 1.6) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    const targetClientX = (targetSvgX / 960) * rect.width;
    const targetClientY = (targetSvgY / 540) * rect.height;

    const newPanX = rect.width / 2 - targetClientX * targetZoom;
    const newPanY = rect.height / 2 - targetClientY * targetZoom;

    setZoom(targetZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  const resetCamera = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Pan Event Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (measureMode && !measureLocked) {
      const { x, y } = getSvgCoordinates(e.clientX, e.clientY);
      const polar = svgToPolarCoords(x, y);

      if (!measureStart) {
        setMeasureStart({ x, y, lat: polar.lat, lon: polar.lon });
        setMeasureCurrent({ x, y, lat: polar.lat, lon: polar.lon });
      } else {
        setMeasureCurrent({ x, y, lat: polar.lat, lon: polar.lon });
        setMeasureLocked(true);
      }
      return;
    }

    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x, y } = getSvgCoordinates(e.clientX, e.clientY);
    const polar = svgToPolarCoords(x, y);

    setHoverCoord({
      lat: polar.lat,
      lon: polar.lon,
      svgX: Math.round(x),
      svgY: Math.round(y),
      depthM: polar.depthM,
      icePct: polar.icePct,
    });

    if (measureMode && measureStart && !measureLocked) {
      setMeasureCurrent({ x, y, lat: polar.lat, lon: polar.lon });
    }

    if (!isDragging) return;

    const newPanX = e.clientX - dragStart.x;
    const newPanY = e.clientY - dragStart.y;

    setPan({
      x: Math.max(-800 * zoom, Math.min(800 * zoom, newPanX)),
      y: Math.max(-500 * zoom, Math.min(500 * zoom, newPanY)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // WHEEL HANDLER: Do NOT zoom or intercept scrolling unless user holds Ctrl!
  // This completely stops the map from abruptly resizing when the user scrolls the page!
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (!containerRef.current) return;

      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
      const nextZoom = Math.min(3.5, Math.max(0.85, zoom * zoomFactor));

      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newPanX = mouseX - (mouseX - pan.x) * (nextZoom / zoom);
      const newPanY = mouseY - (mouseY - pan.y) * (nextZoom / zoom);

      setZoom(nextZoom);
      setPan({ x: newPanX, y: newPanY });
    } else {
      setShowScrollHint(true);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = setTimeout(() => {
        setShowScrollHint(false);
      }, 1800);
    }
  };

  // Measurement statistics
  const measureStats = useMemo(() => {
    if (!measureStart || !measureCurrent) return null;
    const dx = measureCurrent.x - measureStart.x;
    const dy = measureCurrent.y - measureStart.y;
    const svgDist = Math.sqrt(dx * dx + dy * dy);

    const distanceNm = Math.round(svgDist * 0.75 * 10) / 10;
    const distanceKm = Math.round(distanceNm * 1.852);

    let bearingDeg = Math.round((Math.atan2(dx, -dy) * 180) / Math.PI);
    if (bearingDeg < 0) bearingDeg += 360;

    const cardinals = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const cardinal = cardinals[Math.round(bearingDeg / 22.5) % 16];

    const transitHours = distanceNm / Math.max(1, vessel.speedKnots);
    const hrs = Math.floor(transitHours);
    const mins = Math.round((transitHours - hrs) * 60);

    return {
      distanceNm,
      distanceKm,
      bearingDeg,
      cardinal,
      transitTime: `${hrs}h ${mins}m`,
      midX: (measureStart.x + measureCurrent.x) / 2,
      midY: (measureStart.y + measureCurrent.y) / 2,
    };
  }, [measureStart, measureCurrent, vessel.speedKnots]);

  return (
    <div
      className={`bento-card flex flex-col relative transition-all duration-200 ${
        isMapExpanded
          ? 'fixed inset-4 z-50 shadow-[0_0_80px_rgba(0,0,0,0.85)] rounded-2xl overflow-hidden'
          : 'overflow-hidden h-[630px]'
      }`}
      id="antarctic-map-panel"
      style={{
        background: '#04162e',
        borderColor: 'rgba(69, 140, 224, 0.25)',
      }}
    >
      {/* Top Header Bar: Matches NSIDC Satellite Product Layout & Operational Controls */}
      <div className="min-h-[58px] flex flex-wrap justify-between items-center px-4 py-2 border-b border-[rgba(69,140,224,0.2)] bg-[#071d3a] gap-2 z-10">
        <div className="flex items-center gap-3">
          <div>
            <div className="card-title mb-0 flex items-center gap-2">
              <span className="font-space font-bold tracking-wide text-sm sm:text-base text-white flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]" />
                {satelliteProduct === 'concentration'
                  ? 'Sea Ice Concentration, 09 Sep 2026'
                  : 'Sea Ice Extent, 09 Sep 2026'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[rgba(56,189,248,0.12)] text-[#38bdf8] border border-[rgba(56,189,248,0.3)]">
                NSIDC Polar Stereographic
              </span>
            </div>
            <div className="text-[#93a9c7] text-[10px] flex items-center gap-2 font-mono mt-0.5">
              <span>Sensor: SSMIS / AMSR2 Passive Microwave</span>
              <span>·</span>
              <span>Grid: 25 km EPSG:3031</span>
              <span>·</span>
              <span className="text-[#38bdf8]">Zoom: {zoom.toFixed(1)}x</span>
            </div>
          </div>
        </div>

        {/* Center Toolbar: Satellite Mode Switcher + 2D / 3D Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* NSIDC Satellite Product: Concentration vs Extent */}
          <div className="flex items-center bg-[#051428] p-0.5 rounded-xl border border-[rgba(56,189,248,0.25)] shadow-sm">
            <button
              onClick={() => setSatelliteProduct('concentration')}
              className={`px-3 py-1 rounded-lg text-[10px] font-space font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                satelliteProduct === 'concentration'
                  ? 'bg-[rgba(56,189,248,0.22)] text-white border border-[rgba(56,189,248,0.45)] shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                  : 'text-[#93a9c7] hover:text-white'
              }`}
              title="Microwave Radiometer Sea Ice Concentration (0-100% Heatmap)"
            >
              <span>🌊</span>
              <span>Concentration</span>
            </button>
            <button
              onClick={() => setSatelliteProduct('extent')}
              className={`px-3 py-1 rounded-lg text-[10px] font-space font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                satelliteProduct === 'extent'
                  ? 'bg-[rgba(56,189,248,0.22)] text-white border border-[rgba(56,189,248,0.45)] shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                  : 'text-[#93a9c7] hover:text-white'
              }`}
              title="Sea Ice Extent (Threshold >= 15% Solid Ice Area)"
            >
              <span>❄️</span>
              <span>Ice Extent</span>
            </button>
          </div>

          {/* 2D / 3D View Mode Switcher */}
          <div className="flex items-center bg-[#051428] p-0.5 rounded-xl border border-[rgba(69,224,208,0.25)]">
            <button
              onClick={() => setViewMode('2d')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-space font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === '2d'
                  ? 'bg-[rgba(69,224,208,0.2)] text-[#45e0d0] border border-[rgba(69,224,208,0.4)] shadow-[0_0_10px_rgba(69,224,208,0.2)]'
                  : 'text-[#93a9c7] hover:text-white'
              }`}
            >
              <span>🗺️</span>
              <span>2D Map</span>
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-space font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === '3d'
                  ? 'bg-[rgba(69,224,208,0.25)] text-[#45e0d0] border border-[rgba(69,224,208,0.5)] shadow-[0_0_14px_rgba(69,224,208,0.3)]'
                  : 'text-[#93a9c7] hover:text-white'
              }`}
            >
              <span>🌐</span>
              <span>3D Globe</span>
            </button>
          </div>

          {/* Route Corridor Switcher */}
          <div className="flex items-center gap-1 bg-[#051428] p-0.5 rounded-xl border border-[rgba(165,177,224,0.18)]">
            {corridors.map((c) => {
              const isSelected = c.id === selectedCorridorId;
              return (
                <button
                  key={c.id}
                  onClick={() => onSelectCorridor?.(c.id)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-space font-bold transition-all cursor-pointer ${
                    isSelected
                      ? c.id === 'corridor-a'
                        ? 'bg-[rgba(69,224,208,0.2)] text-[#45e0d0] border border-[rgba(69,224,208,0.4)]'
                        : c.id === 'corridor-b'
                        ? 'bg-[rgba(255,202,114,0.2)] text-[#ffca72] border border-[rgba(255,202,114,0.4)]'
                        : 'bg-[rgba(139,124,255,0.2)] text-[#8b7cff] border border-[rgba(139,124,255,0.4)]'
                      : 'text-[#93a9c7] hover:text-white'
                  }`}
                >
                  {c.name.includes('A') ? 'Corridor A' : c.name.includes('B') ? 'Corridor B' : 'Corridor C'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Toolbar: Layer Toggles & Viewport Actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => toggleLayer('medianEdge')}
            className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer border flex items-center gap-1.5 ${
              activeLayers.medianEdge
                ? 'text-[#f58220] border-[rgba(245,130,32,0.4)] bg-[rgba(245,130,32,0.12)] font-bold'
                : 'text-[#93a9c7] border-[rgba(165,177,224,0.14)] opacity-60'
            }`}
            title="1981-2010 Median Ice Edge Climatological Contour"
          >
            <span className="inline-block w-2 h-2 bg-[#f58220] rounded-[2px]" />
            <span>Median Edge</span>
          </button>

          <button
            onClick={() => toggleLayer('bergs')}
            className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer border ${
              activeLayers.bergs
                ? 'text-[#ffca72] border-[rgba(255,202,114,0.35)] bg-[rgba(255,202,114,0.1)]'
                : 'text-[#93a9c7] border-[rgba(165,177,224,0.12)] opacity-50'
            }`}
          >
            Icebergs ({icebergs.length})
          </button>

          <button
            onClick={() => toggleLayer('stations')}
            className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer border ${
              activeLayers.stations
                ? 'text-[#6ddcff] border-[rgba(109,220,255,0.35)] bg-[rgba(109,220,255,0.1)]'
                : 'text-[#93a9c7] border-[rgba(165,177,224,0.12)] opacity-50'
            }`}
          >
            Stations ({researchStations.length})
          </button>

          <button
            onClick={() => {
              if (measureMode) {
                setMeasureMode(false);
                setMeasureStart(null);
                setMeasureCurrent(null);
                setMeasureLocked(false);
              } else {
                setMeasureMode(true);
                setMeasureStart(null);
                setMeasureCurrent(null);
                setMeasureLocked(false);
              }
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer border flex items-center gap-1 ${
              measureMode
                ? 'text-[#ffca72] border-[rgba(255,202,114,0.5)] bg-[rgba(255,202,114,0.18)]'
                : 'text-[#93a9c7] border-[rgba(165,177,224,0.14)] bg-[rgba(255,255,255,0.02)] hover:text-white'
            }`}
            title="Nautical Distance & Bearing Ruler"
          >
            <span>📏</span>
            <span>{measureMode ? (measureLocked ? 'Locked' : 'Click A-B') : 'Ruler'}</span>
          </button>

          {/* Quick Centering & Zoom Controls */}
          <div className="flex items-center gap-1 pl-1 border-l border-[rgba(165,177,224,0.15)]">
            <button
              onClick={() => centerCameraOn(projectedVesselPosition.x, projectedVesselPosition.y, 1.7)}
              className="px-2 py-1 rounded-lg text-[10px] text-[#45e0d0] hover:bg-[rgba(69,224,208,0.18)] bg-[rgba(69,224,208,0.08)] border border-[rgba(69,224,208,0.3)] cursor-pointer flex items-center gap-1 font-mono"
              title="Center camera on Research Vessel"
            >
              <span>⚓</span>
              <span>Vessel</span>
            </button>

            <button
              onClick={() => setZoom((z) => Math.min(3.5, z * 1.25))}
              className="w-6 h-6 flex items-center justify-center text-xs text-[#93a9c7] hover:text-[#45e0d0] bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(165,177,224,0.13)] rounded-md cursor-pointer"
              title="Zoom In (+)"
            >
              +
            </button>
            <button
              onClick={resetCamera}
              className="px-1.5 h-6 flex items-center justify-center text-[10px] text-[#93a9c7] hover:text-white bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(165,177,224,0.13)] rounded-md cursor-pointer font-mono"
              title="Reset View (1x)"
            >
              1x
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.85, z * 0.8))}
              className="w-6 h-6 flex items-center justify-center text-xs text-[#93a9c7] hover:text-[#45e0d0] bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(165,177,224,0.13)] rounded-md cursor-pointer"
              title="Zoom Out (−)"
            >
              −
            </button>

            <button
              onClick={() => setIsMapExpanded(!isMapExpanded)}
              className="w-6 h-6 flex items-center justify-center text-xs text-[#93a9c7] hover:text-white bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(165,177,224,0.13)] rounded-md cursor-pointer"
              title={isMapExpanded ? 'Exit Full View' : 'Full Screen'}
            >
              {isMapExpanded ? '✕' : '⛶'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div
        className="relative flex-1 overflow-hidden select-none"
        style={{
          height: isMapExpanded ? 'calc(100vh - 120px)' : '570px',
          background: '#083262', // Authentic NSIDC deep oceanic navy background
        }}
      >
        {viewMode === '3d' ? (
          <Antarctic3DMap
            icebergs={icebergs}
            vessel={vessel}
            selectedIcebergId={selectedIcebergId}
            onSelectIceberg={onSelectIceberg}
            selectedCorridorId={selectedCorridorId}
            onSelectCorridor={onSelectCorridor}
            onSelectStation={(st) => {
              setSelectedStation(st);
              setSelectedWaypoint(null);
              onSelectIceberg(null);
            }}
            onSelectWaypoint={(wp) => {
              setSelectedWaypoint(wp);
              setSelectedStation(null);
              onSelectIceberg(null);
            }}
            onToggleVesselCard={() => setShowVesselCard(!showVesselCard)}
          />
        ) : (
          <div
            ref={containerRef}
            className={`w-full h-full relative overflow-hidden select-none ${
              measureMode ? 'cursor-crosshair' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              setIsDragging(false);
              setHoverCoord(null);
            }}
            onWheel={handleWheel}
          >
            {/* Scroll hint notification (shows only if user scrolls without Ctrl) */}
            {showScrollHint && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-lg bg-[rgba(7,24,46,0.95)] border border-[rgba(56,189,248,0.4)] text-xs text-[#38bdf8] font-mono shadow-lg pointer-events-none transition-opacity">
                Use Ctrl + Scroll to zoom, or click + / −
              </div>
            )}

            {/* Dynamic Zoom & Pan Transform Layer */}
            <div
              className="w-full h-full origin-top-left"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              }}
            >
              <svg
                id="nsidcAntarcticMap"
                viewBox="0 0 960 540"
                preserveAspectRatio="xMidYMid meet"
                className="w-full h-full pointer-events-auto"
              >
                <defs>
                  {/* Ocean floor base */}
                  <linearGradient id="nsidcOceanBase" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#083262" />
                    <stop offset="100%" stopColor="#062952" />
                  </linearGradient>

                  {/* Polar Concentration Multi-Stop Radiometer Heatmap Gradient */}
                  {/* Matching the exact colors from the NSIDC reference image: Navy -> Azure -> Sky -> Ice-white */}
                  <radialGradient id="iceConcentrationGradient" cx="440" cy="265" r="280" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                    <stop offset="42%" stopColor="#ffffff" stopOpacity="0.98" />
                    <stop offset="55%" stopColor="#ebf7fe" stopOpacity="0.95" />
                    <stop offset="68%" stopColor="#b3e2fd" stopOpacity="0.92" />
                    <stop offset="78%" stopColor="#53b7f8" stopOpacity="0.90" />
                    <stop offset="86%" stopColor="#2493ee" stopOpacity="0.88" />
                    <stop offset="93%" stopColor="#1268bc" stopOpacity="0.82" />
                    <stop offset="98%" stopColor="#0c427f" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#083262" stopOpacity="0" />
                  </radialGradient>

                  {/* NSIDC Right-hand Vertical Color Bar Gradient */}
                  <linearGradient id="nsidcColorScaleBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="10%" stopColor="#d4edfd" />
                    <stop offset="20%" stopColor="#96d4fb" />
                    <stop offset="30%" stopColor="#58bcf9" />
                    <stop offset="40%" stopColor="#29a3f5" />
                    <stop offset="50%" stopColor="#1b88e8" />
                    <stop offset="60%" stopColor="#146ebd" />
                    <stop offset="70%" stopColor="#10579c" />
                    <stop offset="80%" stopColor="#0c427c" />
                    <stop offset="88%" stopColor="#083262" />
                    <stop offset="100%" stopColor="#051f3d" />
                  </linearGradient>

                  {/* Filter for crisp sea ice boundaries */}
                  <filter id="iceShadow" x="-5%" y="-5%" width="110%" height="110%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.4" />
                  </filter>
                </defs>

                {/* 1. Ocean Base Rectangle */}
                <rect x="24" y="16" width="832" height="508" fill="url(#nsidcOceanBase)" />

                {/* 2. NSIDC Polar Graticule (Subtle latitude parallels & meridian spokes) */}
                <g id="polarGraticule" fill="none" stroke="#12467d" strokeWidth="0.75">
                  {/* Concentric Latitude Circles centered at South Pole (440, 265) */}
                  <circle cx="440" cy="265" r="70" strokeDasharray="3 4" opacity="0.65" /> {/* 80°S */}
                  <circle cx="440" cy="265" r="140" opacity="0.75" /> {/* 70°S */}
                  <circle cx="440" cy="265" r="210" opacity="0.75" /> {/* 60°S */}
                  <circle cx="440" cy="265" r="280" opacity="0.7" /> {/* 50°S */}

                  {/* Radiating Meridians */}
                  <line x1="440" y1="265" x2="440" y2="18" opacity="0.7" />
                  <line x1="440" y1="265" x2="440" y2="522" opacity="0.7" />
                  <line x1="440" y1="265" x2="854" y2="265" opacity="0.7" />
                  <line x1="440" y1="265" x2="26" y2="265" opacity="0.7" />
                  <line x1="440" y1="265" x2="638" y2="67" opacity="0.45" strokeDasharray="2 3" />
                  <line x1="440" y1="265" x2="638" y2="463" opacity="0.45" strokeDasharray="2 3" />
                  <line x1="440" y1="265" x2="242" y2="463" opacity="0.45" strokeDasharray="2 3" />
                  <line x1="440" y1="265" x2="242" y2="67" opacity="0.45" strokeDasharray="2 3" />
                </g>

                {/* 3. South America (Tierra del Fuego & Cape Horn Archipelago on left border) */}
                <g id="southAmericaArchipelago">
                  {/* Main Tierra del Fuego island */}
                  <path
                    d="
                      M 36 195
                      C 45 202 54 210 50 222
                      C 46 232 56 240 58 250
                      C 54 260 46 268 40 274
                      C 36 266 38 252 35 240
                      C 33 226 34 210 36 195 Z
                    "
                    fill="#686b71"
                    stroke="#14181f"
                    strokeWidth="1.2"
                  />
                  {/* Navarino & Hoste islands (Cape Horn region) */}
                  <path
                    d="M 40 274 C 45 282 48 290 42 296 C 36 292 38 284 40 274 Z"
                    fill="#686b71"
                    stroke="#14181f"
                    strokeWidth="1.2"
                  />
                  {/* Isla de los Estados */}
                  <ellipse cx="64" cy="245" rx="5" ry="2.5" transform="rotate(-25 64 245)" fill="#686b71" stroke="#14181f" strokeWidth="1" />

                  {/* Vertical "South America" label (matches NSIDC official label placement) */}
                  <text
                    x="29"
                    y="255"
                    fill="#a2c0db"
                    fontSize="8.5"
                    fontFamily="Arial, sans-serif"
                    fontWeight="600"
                    transform="rotate(-90 29 255)"
                    textAnchor="middle"
                    letterSpacing="0.8px"
                  >
                    South America
                  </text>
                </g>

                {/* 4. Sea Ice Layer (Dual Mode: Concentration Heatmap vs Extent) */}
                {activeLayers.ice && (
                  <g id="seaIceLayer">
                    {satelliteProduct === 'extent' ? (
                      /* Mode A: Sea Ice Extent (Solid crisp white >= 15% pack ice) */
                      <path
                        id="seaIceExtentPolygon"
                        d="
                          M 440 38
                          C 490 40 550 52 610 82
                          C 670 112 715 155 745 205
                          C 775 255 770 315 740 368
                          C 710 420 655 460 595 482
                          C 535 504 465 508 405 496
                          C 345 484 290 454 248 412
                          C 205 370 180 315 175 260
                          C 170 205 188 150 225 105
                          C 262 60 330 40 395 38
                          C 418 37 430 38 440 38 Z
                        "
                        fill="#ffffff"
                        filter="url(#iceShadow)"
                      />
                    ) : (
                      /* Mode B: Sea Ice Concentration (Multi-layer blue-to-white radiometric gradient) */
                      <g id="seaIceConcentrationFields">
                        {/* Base outer fringe: 15-30% concentration (Deep azure blue) */}
                        <path
                          d="
                            M 440 38
                            C 490 40 550 52 610 82
                            C 670 112 715 155 745 205
                            C 775 255 770 315 740 368
                            C 710 420 655 460 595 482
                            C 535 504 465 508 405 496
                            C 345 484 290 454 248 412
                            C 205 370 180 315 175 260
                            C 170 205 188 150 225 105
                            C 262 60 330 40 395 38
                            C 418 37 430 38 440 38 Z
                          "
                          fill="#1875c7"
                        />

                        {/* Mid-outer pack: 30-55% concentration (Vibrant sky blue) */}
                        <path
                          d="
                            M 440 52
                            C 485 54 542 66 598 94
                            C 654 122 696 162 725 208
                            C 752 254 748 308 720 356
                            C 692 404 642 442 585 462
                            C 528 482 462 486 408 475
                            C 352 464 302 436 264 398
                            C 224 358 202 308 198 258
                            C 194 208 210 158 244 118
                            C 278 78 340 54 400 52 Z
                          "
                          fill="#38a9f6"
                        />

                        {/* Medium-dense pack: 55-75% concentration (Light cyan ice) */}
                        <path
                          d="
                            M 440 70
                            C 480 72 532 84 582 110
                            C 632 136 672 172 698 215
                            C 724 256 720 302 695 344
                            C 670 386 624 420 572 438
                            C 520 456 460 460 412 450
                            C 362 440 318 414 284 380
                            C 248 344 228 298 225 254
                            C 222 210 236 168 266 132
                            C 298 96 352 72 408 70 Z
                          "
                          fill="#7ac9fb"
                        />

                        {/* Heavy consolidated pack: 75-90% concentration (Pale ice blue) */}
                        <path
                          d="
                            M 440 92
                            C 475 94 520 105 564 128
                            C 608 152 644 184 666 222
                            C 688 260 684 298 662 334
                            C 640 370 598 400 552 414
                            C 506 428 454 432 414 424
                            C 372 414 334 392 304 362
                            C 272 330 254 290 252 250
                            C 250 210 262 174 290 144
                            C 318 112 366 94 416 92 Z
                          "
                          fill="#bde6fe"
                        />

                        {/* Near-coastal / Shelf maximum: 90-100% concentration (Crisp brilliant white) */}
                        <path
                          d="
                            M 440 115
                            C 470 116 508 126 546 146
                            C 584 166 615 194 634 228
                            C 652 262 648 294 628 324
                            C 608 354 572 378 532 390
                            C 492 402 448 404 412 398
                            C 376 390 344 370 320 344
                            C 294 316 278 280 276 246
                            C 274 212 286 182 310 156
                            C 334 130 376 116 418 115 Z
                          "
                          fill="#ffffff"
                        />

                        {/* Realistic coastal polynyas / leads in Weddell & Ross Seas matching satellite imagery */}
                        {/* Weddell Sea offshore opening */}
                        <ellipse cx="340" cy="135" rx="14" ry="9" fill="#58bcf9" opacity="0.85" />
                        {/* Ross Sea coastal polynya opening */}
                        <ellipse cx="430" cy="425" rx="20" ry="8" fill="#38a9f6" opacity="0.8" />
                        {/* Prydz Bay coastal lead */}
                        <ellipse cx="655" cy="275" rx="12" ry="7" fill="#58bcf9" opacity="0.85" />
                      </g>
                    )}
                  </g>
                )}

                {/* 5. Orange Contour Line: 1981-2010 Median Ice Edge */}
                {activeLayers.medianEdge && (
                  <g id="medianIceEdgeContour" pointerEvents="none">
                    <path
                      id="median-ice-edge-1981-2010"
                      d="
                        M 440 32
                        C 475 33 515 36 555 46
                        C 595 56 630 76 662 104
                        C 694 132 724 168 748 210
                        C 772 252 778 300 760 348
                        C 742 396 706 438 660 468
                        C 614 498 558 514 500 518
                        C 442 522 385 510 336 488
                        C 287 466 244 430 214 384
                        C 184 338 168 284 172 230
                        C 176 176 200 126 240 86
                        C 280 46 335 32 390 31
                        C 410 30 425 31 440 32 Z
                      "
                      fill="none"
                      stroke="#f58220"
                      strokeWidth="2.2"
                      strokeLinejoin="round"
                    />
                  </g>
                )}

                {/* 6. Realistic Antarctic Continent (Dark slate-grey with black outline, centered at 440, 265) */}
                <g id="antarcticContinentGrounded">
                  <path
                    id="antarcticLandmass"
                    d="
                      M 440 170
                      C 470 172 505 178 540 195
                      C 575 212 605 235 625 265
                      C 645 295 640 330 620 360
                      C 600 390 565 410 525 418
                      C 485 426 450 412 430 380
                      C 410 358 385 360 365 378
                      C 345 396 320 380 305 350
                      C 290 320 300 290 325 270
                      C 345 254 365 240 375 235
                      C 340 225 300 212 265 198
                      C 240 190 220 182 210 185
                      C 215 195 230 215 245 235
                      C 255 248 245 260 230 270
                      C 218 260 212 245 215 235
                      C 220 225 210 215 205 200
                      C 202 188 208 178 218 175
                      C 230 172 250 180 275 190
                      C 310 202 345 215 370 218
                      C 385 205 408 190 425 180
                      C 432 174 436 170 440 170 Z
                    "
                    fill="#686b71"
                    stroke="#14181f"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />

                  {/* Alexander Island (West of Peninsula) */}
                  <ellipse cx="230" cy="272" rx="9" ry="16" transform="rotate(15 230 272)" fill="#686b71" stroke="#14181f" strokeWidth="1.2" />

                  {/* South Shetland Islands */}
                  <ellipse cx="212" cy="168" rx="4" ry="2" transform="rotate(-30 212 168)" fill="#686b71" stroke="#14181f" strokeWidth="0.8" />
                  <ellipse cx="222" cy="162" rx="5" ry="2" transform="rotate(-30 222 162)" fill="#686b71" stroke="#14181f" strokeWidth="0.8" />

                  {/* Berkner Island (Weddell Sea embayment) */}
                  <ellipse cx="365" cy="238" rx="10" ry="16" fill="#686b71" stroke="#14181f" strokeWidth="1.2" />

                  {/* South Pole Marker (+) */}
                  <g transform="translate(440 265)" opacity="0.6">
                    <line x1="-5" y1="0" x2="5" y2="0" stroke="#ffffff" strokeWidth="1" />
                    <line x1="0" y1="-5" x2="0" y2="5" stroke="#ffffff" strokeWidth="1" />
                  </g>

                  {/* "East Antarctica" Typography (centered on East Antarctica shield, matching reference image) */}
                  <text
                    x="535"
                    y="252"
                    fill="#ffffff"
                    fontSize="10"
                    fontFamily="Arial, sans-serif"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="pointer-events-none drop-shadow-sm"
                  >
                    East
                  </text>
                  <text
                    x="535"
                    y="266"
                    fill="#ffffff"
                    fontSize="10"
                    fontFamily="Arial, sans-serif"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="pointer-events-none drop-shadow-sm"
                  >
                    Antarctica
                  </text>

                  {/* "West Antarctica" Typography (centered on West Antarctica, matching reference image) */}
                  <text
                    x="345"
                    y="312"
                    fill="#ffffff"
                    fontSize="9"
                    fontFamily="Arial, sans-serif"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="pointer-events-none drop-shadow-sm"
                  >
                    West
                  </text>
                  <text
                    x="345"
                    y="324"
                    fill="#ffffff"
                    fontSize="9"
                    fontFamily="Arial, sans-serif"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="pointer-events-none drop-shadow-sm"
                  >
                    Antarctica
                  </text>
                </g>

                {/* 7. Bottom Right: "■ median ice edge 1981-2010" Legend Chip */}
                {activeLayers.medianEdge && (
                  <g transform="translate(635 494)" pointerEvents="none">
                    <rect x="0" y="0" width="10" height="10" fill="#f58220" />
                    <text x="16" y="9" fill="#ffffff" fontSize="9.5" fontFamily="Arial, sans-serif" fontWeight="500">
                      median ice edge 1981-2010
                    </text>
                  </g>
                )}

                {/* 8. Right Margin: NSIDC Official Credit (Vertical text) */}
                <text
                  x="866"
                  y="270"
                  fill="#98b6d4"
                  fontSize="7.5"
                  fontFamily="Arial, sans-serif"
                  fontWeight="500"
                  transform="rotate(-90 866 270)"
                  textAnchor="middle"
                  letterSpacing="0.6px"
                >
                  National Snow and Ice Data Center, University of Colorado Boulder
                </text>

                {/* 9. Right Margin: 0% - 100% Sea Ice Concentration Color Bar Scale */}
                {satelliteProduct === 'concentration' && (
                  <g id="nsidcColorScaleLegend" transform="translate(884 48)">
                    {/* Scale bar box */}
                    <rect
                      x="0"
                      y="0"
                      width="16"
                      height="420"
                      fill="url(#nsidcColorScaleBar)"
                      stroke="#1a4675"
                      strokeWidth="1"
                    />

                    {/* Tick marks & percentage labels */}
                    {[
                      { pct: '100%', y: 0 },
                      { pct: '90%', y: 42 },
                      { pct: '80%', y: 84 },
                      { pct: '70%', y: 126 },
                      { pct: '60%', y: 168 },
                      { pct: '50%', y: 210 },
                      { pct: '40%', y: 252 },
                      { pct: '30%', y: 294 },
                      { pct: '20%', y: 336 },
                      { pct: '10%', y: 378 },
                      { pct: '0%', y: 420 },
                    ].map((tick, idx) => (
                      <g key={idx} transform={`translate(16 ${tick.y})`}>
                        <line x1="0" y1="0" x2="4" y2="0" stroke="#89a8cb" strokeWidth="0.8" />
                        <text
                          x="7"
                          y="3"
                          fill="#c5daf0"
                          fontSize="7.5"
                          fontFamily="Arial, monospace"
                          fontWeight="bold"
                        >
                          {tick.pct}
                        </text>
                      </g>
                    ))}
                  </g>
                )}

                {/* 10. Operational Maritime Layer: Route Corridors (A, B, C) */}
                {activeLayers.route && (
                  <g id="navigationCorridorTracks">
                    {/* Inactive corridors (subtle dashed lines) */}
                    {corridors
                      .filter((c) => c.id !== selectedCorridorId)
                      .map((c) => {
                        const wps = corridorWaypoints[c.id];
                        if (!wps || wps.length === 0) return null;
                        const pathD = wps.reduce((acc, wp, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${wp.svgX} ${wp.svgY}`, '');
                        const color = c.id === 'corridor-b' ? '#ffca72' : '#8b7cff';

                        return (
                          <g key={c.id} className="cursor-pointer group" onClick={() => onSelectCorridor?.(c.id)}>
                            <path
                              d={pathD}
                              fill="none"
                              stroke={color}
                              strokeWidth="1.6"
                              strokeDasharray="3 4"
                              strokeOpacity="0.4"
                              className="group-hover:stroke-opacity-90 transition-all"
                            />
                            <text
                              x={wps[Math.floor(wps.length / 2)].svgX + 8}
                              y={wps[Math.floor(wps.length / 2)].svgY - 8}
                              fill={color}
                              fontSize="7"
                              opacity="0.65"
                              className="group-hover:opacity-100 font-mono"
                            >
                              {c.name}
                            </text>
                          </g>
                        );
                      })}

                    {/* Active Corridor Track */}
                    <path
                      d={activeWaypoints.reduce((acc, wp, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${wp.svgX} ${wp.svgY}`, '')}
                      fill="none"
                      stroke={selectedCorridorId === 'corridor-b' ? '#ffca72' : selectedCorridorId === 'corridor-c' ? '#8b7cff' : '#45e0d0'}
                      strokeWidth="2.2"
                      strokeDasharray="6 4"
                    />

                    {/* Waypoints along active corridor */}
                    {activeWaypoints.map((wp) => {
                      const isDestination = wp.status === 'Destination';
                      const isNext = wp.status === 'Next';

                      return (
                        <g
                          key={wp.id}
                          className="cursor-pointer group"
                          transform={`translate(${wp.svgX} ${wp.svgY})`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedWaypoint(wp);
                            setSelectedStation(null);
                            onSelectIceberg(null);
                          }}
                        >
                          <circle
                            r={isDestination ? 5 : 3.5}
                            fill="#071d3a"
                            stroke={isNext ? '#ffffff' : '#45e0d0'}
                            strokeWidth="1.5"
                          />
                          <circle
                            r="1.8"
                            fill={isDestination ? '#ffca72' : isNext ? '#45e0d0' : '#ffffff'}
                          />
                          <text
                            x="6"
                            y="3"
                            fontSize="7.5"
                            fill="#cbe3f7"
                            fontFamily="monospace"
                            className="pointer-events-none opacity-85 group-hover:opacity-100 drop-shadow"
                          >
                            {wp.name.split(' ')[0]}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* 11. Operational Maritime Layer: Charted Icebergs */}
                {activeLayers.bergs && (
                  <g id="chartedIcebergs">
                    {projectedIcebergs.map((berg) => {
                      const isSelected = berg.id === selectedIcebergId;

                      return (
                        <g
                          key={berg.id}
                          className="cursor-pointer group"
                          transform={`translate(${berg.currentSvgX} ${berg.currentSvgY})`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectIceberg(isSelected ? null : berg.id);
                            setSelectedWaypoint(null);
                            setSelectedStation(null);
                          }}
                        >
                          {isSelected && (
                            <circle
                              r="14"
                              fill="none"
                              stroke="#ffca72"
                              strokeWidth="1.5"
                              strokeDasharray="3 2"
                            />
                          )}

                          {/* Diamond Polygon for Iceberg */}
                          <path
                            d="M0 -6 L5 1 L2 6 L-5 2 Z"
                            fill={isSelected ? '#ffffff' : '#ffca72'}
                            stroke="#06182e"
                            strokeWidth="0.8"
                          />

                          {/* Drift Vector Arrow */}
                          {activeLayers.driftVectors && (
                            <g opacity="0.9">
                              <line
                                x1="0"
                                y1="0"
                                x2={Math.sin((berg.driftHeadingDeg * Math.PI) / 180) * 16}
                                y2={-Math.cos((berg.driftHeadingDeg * Math.PI) / 180) * 16}
                                stroke="#ffca72"
                                strokeWidth="1.2"
                                strokeDasharray="2 2"
                              />
                              <circle
                                cx={Math.sin((berg.driftHeadingDeg * Math.PI) / 180) * 16}
                                cy={-Math.cos((berg.driftHeadingDeg * Math.PI) / 180) * 16}
                                r="1"
                                fill="#ffca72"
                              />
                            </g>
                          )}

                          <text
                            x="8"
                            y="3"
                            fill="#ffca72"
                            fontSize="7.5"
                            fontFamily="monospace"
                            fontWeight="bold"
                            className="pointer-events-none drop-shadow"
                          >
                            {berg.code}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* 12. Operational Maritime Layer: Research Vessel (R/V Polar Pioneer) */}
                {activeLayers.vessel && (
                  <g
                    id="vesselMarker"
                    transform={`translate(${projectedVesselPosition.x} ${projectedVesselPosition.y})`}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowVesselCard(!showVesselCard);
                      setSelectedStation(null);
                      setSelectedWaypoint(null);
                    }}
                  >
                    {/* Range Rings */}
                    <circle r="32" fill="none" stroke="#45e0d0" strokeOpacity="0.25" strokeWidth="0.8" strokeDasharray="3 4" />
                    <circle r="60" fill="none" stroke="#45e0d0" strokeOpacity="0.15" strokeWidth="0.8" strokeDasharray="4 6" />

                    {/* Heading Vector */}
                    <line
                      x1="0"
                      y1="0"
                      x2={Math.sin((projectedVesselPosition.heading * Math.PI) / 180) * 26}
                      y2={-Math.cos((projectedVesselPosition.heading * Math.PI) / 180) * 26}
                      stroke="#45e0d0"
                      strokeWidth="1.6"
                    />

                    {/* AIS Vessel Hull Shape */}
                    <path
                      d="M 0 -7 L 4.5 5 L 0 3.5 L -4.5 5 Z"
                      fill="#45e0d0"
                      stroke="#ffffff"
                      strokeWidth="1"
                      transform={`rotate(${projectedVesselPosition.heading})`}
                    />

                    <text x="9" y="3" fill="#45e0d0" fontSize="8" fontWeight="bold" fontFamily="monospace" className="drop-shadow">
                      R/V PIONEER
                    </text>
                  </g>
                )}

                {/* 13. Operational Maritime Layer: Research Stations (Bharati, Maitri, Rothera, etc.) */}
                {activeLayers.stations && (
                  <g id="researchStationsLayer">
                    {researchStations.map((st) => {
                      const isSelected = selectedStation?.id === st.id;

                      return (
                        <g
                          key={st.id}
                          className="cursor-pointer group"
                          transform={`translate(${st.svgX} ${st.svgY})`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStation(isSelected ? null : st);
                            setSelectedWaypoint(null);
                            onSelectIceberg(null);
                          }}
                        >
                          <circle
                            r={isSelected ? 8 : 5.5}
                            fill="#091b33"
                            stroke={st.country === 'India' ? '#ff9933' : '#6ddcff'}
                            strokeWidth={isSelected ? 2 : 1.2}
                          />
                          <circle
                            r="2"
                            fill={st.country === 'India' ? '#ff9933' : '#6ddcff'}
                          />
                          <text
                            x="7"
                            y="3"
                            fill={st.country === 'India' ? '#ffca72' : '#ffffff'}
                            fontSize="7.5"
                            fontWeight="bold"
                            fontFamily="Arial, sans-serif"
                            className="pointer-events-none drop-shadow"
                          >
                            {st.flag} {st.name.split(' ')[0]}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* 14. Measurement Ruler Overlay */}
                {measureMode && measureStart && measureCurrent && (
                  <g id="measurementOverlay" pointerEvents="none">
                    <line
                      x1={measureStart.x}
                      y1={measureStart.y}
                      x2={measureCurrent.x}
                      y2={measureCurrent.y}
                      stroke="#ffca72"
                      strokeWidth="1.8"
                      strokeDasharray="4 3"
                    />
                    <circle cx={measureStart.x} cy={measureStart.y} r="4" fill="#ffca72" />
                    <circle cx={measureCurrent.x} cy={measureCurrent.y} r="4" fill="#45e0d0" />

                    {measureStats && (
                      <g transform={`translate(${measureStats.midX} ${measureStats.midY - 12})`}>
                        <rect x="-50" y="-10" width="100" height="18" rx="4" fill="#071d3a" stroke="#ffca72" strokeWidth="0.8" />
                        <text x="0" y="2" textAnchor="middle" fill="#ffca72" fontSize="8" fontWeight="bold" fontFamily="monospace">
                          {measureStats.distanceNm} NM · {measureStats.bearingDeg}° {measureStats.cardinal}
                        </text>
                      </g>
                    )}
                  </g>
                )}

                {/* 15. Nautical Scale Bar (0 - 50 - 100 - 200 NM) */}
                <g transform="translate(42 486)" pointerEvents="none">
                  <rect x="0" y="0" width="160" height="18" fill="#051933" fillOpacity="0.9" stroke="#1d4878" strokeWidth="0.8" rx="3" />
                  <text x="8" y="12" fill="#93a9c7" fontSize="7" fontFamily="monospace">SCALE: 200 NM</text>
                  <line x1="80" y1="10" x2="150" y2="10" stroke="#38bdf8" strokeWidth="2" />
                  <line x1="80" y1="6" x2="80" y2="14" stroke="#38bdf8" strokeWidth="1.5" />
                  <line x1="115" y1="7" x2="115" y2="13" stroke="#38bdf8" strokeWidth="1" />
                  <line x1="150" y1="6" x2="150" y2="14" stroke="#38bdf8" strokeWidth="1.5" />
                </g>
              </svg>
            </div>

            {/* Selected Iceberg Floating Card */}
            {selectedBerg && (
              <div className="absolute top-4 right-20 max-w-[270px] p-3.5 rounded-xl bg-[rgba(6,22,46,0.96)] border border-[rgba(255,202,114,0.4)] shadow-2xl z-20 text-xs backdrop-blur-md">
                <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.08)]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-[#ffca72] rotate-45" />
                    <strong className="font-space text-sm text-white">{selectedBerg.code}</strong>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[rgba(255,202,114,0.15)] text-[#ffca72] uppercase font-mono font-bold">
                      {selectedBerg.hazardLevel}
                    </span>
                  </div>
                  <button
                    onClick={() => onSelectIceberg(null)}
                    className="text-[#93a9c7] hover:text-white text-sm cursor-pointer p-0.5"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-2 space-y-1.5 text-[11px]">
                  <div className="text-[#b7bad0] font-medium">{selectedBerg.name}</div>
                  <div className="flex justify-between text-[#93a9c7]">
                    <span>Dimensions:</span>
                    <span className="text-white font-mono">{selectedBerg.dimensions}</span>
                  </div>
                  <div className="flex justify-between text-[#93a9c7]">
                    <span>Draft / Keel:</span>
                    <span className="text-white font-mono">{selectedBerg.draftM} m</span>
                  </div>
                  <div className="flex justify-between text-[#93a9c7]">
                    <span>Coordinates:</span>
                    <span className="text-[#38bdf8] font-mono">{selectedBerg.latDisplay}</span>
                  </div>
                  <div className="flex justify-between text-[#93a9c7]">
                    <span>Drift Vector:</span>
                    <span className="text-white font-mono">
                      {selectedBerg.driftSpeedKnots} kn @ {selectedBerg.driftHeadingDeg}°
                    </span>
                  </div>
                  <div className="flex justify-between text-[#93a9c7]">
                    <span>Distance from Vessel:</span>
                    <strong className="text-[#ffca72] font-mono font-bold">
                      {selectedBerg.distanceNm} nm
                    </strong>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-[rgba(255,255,255,0.06)] flex gap-2">
                  <button
                    onClick={() => centerCameraOn(selectedBerg.svgX, selectedBerg.svgY, 2.0)}
                    className="flex-1 py-1 text-[10px] text-[#38bdf8] bg-[rgba(56,189,248,0.12)] hover:bg-[rgba(56,189,248,0.22)] border border-[rgba(56,189,248,0.35)] rounded-md cursor-pointer text-center font-mono font-bold"
                  >
                    Focus Berg
                  </button>
                </div>
              </div>
            )}

            {/* Selected Station Card */}
            {selectedStation && (
              <div className="absolute top-4 right-20 max-w-[280px] p-3.5 rounded-xl bg-[rgba(6,22,46,0.96)] border border-[rgba(109,220,255,0.4)] shadow-2xl z-20 text-xs backdrop-blur-md">
                <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.08)]">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{selectedStation.flag}</span>
                    <strong className="font-space text-sm text-white">{selectedStation.name}</strong>
                  </div>
                  <button
                    onClick={() => setSelectedStation(null)}
                    className="text-[#93a9c7] hover:text-white text-sm cursor-pointer p-0.5"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-2 space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-[#93a9c7]">
                    <span>Nation:</span>
                    <span className="text-white font-medium">{selectedStation.country}</span>
                  </div>
                  <div className="flex justify-between text-[#93a9c7]">
                    <span>Coordinates:</span>
                    <span className="text-[#38bdf8] font-mono">{selectedStation.latDisplay}</span>
                  </div>
                  <div className="flex justify-between text-[#93a9c7]">
                    <span>Crew:</span>
                    <span className="text-white font-mono">
                      {selectedStation.personnelWinter} winter / {selectedStation.personnelSummer} summer
                    </span>
                  </div>
                  <div className="flex justify-between text-[#93a9c7]">
                    <span>Elevation:</span>
                    <span className="text-white font-mono">{selectedStation.elevationM} m MSL</span>
                  </div>
                  <div className="text-[10px] text-[#93a9c7] pt-1.5 border-t border-[rgba(255,255,255,0.06)] leading-relaxed">
                    {selectedStation.mission}
                  </div>
                </div>
              </div>
            )}

            {/* Selected Waypoint Card */}
            {selectedWaypoint && (
              <div className="absolute top-4 right-20 max-w-[270px] p-3.5 rounded-xl bg-[rgba(6,22,46,0.96)] border border-[rgba(69,224,208,0.4)] shadow-2xl z-20 text-xs backdrop-blur-md">
                <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.08)]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#45e0d0]" />
                    <strong className="font-space text-sm text-white">{selectedWaypoint.name}</strong>
                  </div>
                  <button
                    onClick={() => setSelectedWaypoint(null)}
                    className="text-[#93a9c7] hover:text-white text-sm cursor-pointer p-0.5"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-2 space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-[#93a9c7]">
                    <span>Coordinates:</span>
                    <span className="text-[#45e0d0] font-mono">{selectedWaypoint.lat}</span>
                  </div>
                  <div className="flex justify-between text-[#93a9c7]">
                    <span>Cumulative Dist:</span>
                    <span className="text-white font-mono">{selectedWaypoint.distNm} nm</span>
                  </div>
                  <div className="flex justify-between text-[#93a9c7]">
                    <span>Avg Ice:</span>
                    <span className="text-white font-mono">{selectedWaypoint.iceThicknessM} m</span>
                  </div>
                  <div className="flex justify-between text-[#93a9c7]">
                    <span>Schedule:</span>
                    <strong className="text-[#45e0d0] font-mono">{selectedWaypoint.eta}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Vessel Telemetry Card */}
            {showVesselCard && (
              <div className="absolute top-4 right-20 max-w-[270px] p-3.5 rounded-xl bg-[rgba(6,22,46,0.96)] border border-[rgba(69,224,208,0.4)] shadow-2xl z-20 text-xs backdrop-blur-md">
                <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.08)]">
                  <div className="flex items-center gap-2">
                    <span className="text-[#45e0d0]">⚓</span>
                    <strong className="font-space text-sm text-white">{vessel.name}</strong>
                  </div>
                  <button
                    onClick={() => setShowVesselCard(false)}
                    className="text-[#93a9c7] hover:text-white text-sm cursor-pointer p-0.5"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-2 space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-[#93a9c7]">
                    <span>Speed Over Ground:</span>
                    <span className="text-[#45e0d0] font-mono font-bold">{vessel.speedKnots} kn</span>
                  </div>
                  <div className="flex justify-between text-[#93a9c7]">
                    <span>Heading:</span>
                    <span className="text-white font-mono">{projectedVesselPosition.heading}° True</span>
                  </div>
                  <div className="flex justify-between text-[#93a9c7]">
                    <span>Hull Strain:</span>
                    <span className="text-[#66e2a3] font-mono">{vessel.hullStrainPercent}% (Normal)</span>
                  </div>
                  <div className="flex justify-between text-[#93a9c7]">
                    <span>Fuel Reserve:</span>
                    <span className="text-[#45e0d0] font-mono">{vessel.fuelRemainingPercent}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Live Polar Coordinate Reticle HUD */}
            {hoverCoord && (
              <div className="absolute top-3 left-4 px-3 py-1.5 rounded-lg bg-[rgba(6,22,46,0.92)] border border-[rgba(56,189,248,0.25)] text-[10px] text-[#c5daf0] font-mono flex items-center gap-3 z-10 shadow-lg backdrop-blur-sm">
                <div>
                  <span className="text-[#38bdf8] font-bold">LAT/LON:</span> {hoverCoord.lat} · {hoverCoord.lon}
                </div>
                <span className="text-[rgba(255,255,255,0.2)]">|</span>
                <div>
                  <span className="text-[#ffca72]">ICE CONCENTRATION:</span> {hoverCoord.icePct}%
                </div>
                <span className="text-[rgba(255,255,255,0.2)]">|</span>
                <div>
                  <span className="text-[#45e0d0]">DEPTH:</span> {hoverCoord.depthM} m
                </div>
              </div>
            )}

            {/* Measurement Tool Active Banner */}
            {measureMode && (
              <div className="absolute bottom-4 left-48 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(6,22,46,0.95)] border border-[rgba(255,202,114,0.4)] text-xs font-mono shadow-lg">
                <span className="text-[#ffca72]">📏</span>
                <span className="text-white">
                  {!measureStart ? 'Click Point A on chart' : !measureLocked ? 'Click Point B to measure' : 'Distance Locked'}
                </span>
                {measureStats && (
                  <span className="text-[#ffca72] font-bold ml-1">
                    [{measureStats.distanceNm} NM / {measureStats.distanceKm} km · {measureStats.bearingDeg}° {measureStats.cardinal} · ETA {measureStats.transitTime}]
                  </span>
                )}
                <button
                  onClick={() => {
                    setMeasureStart(null);
                    setMeasureCurrent(null);
                    setMeasureLocked(false);
                  }}
                  className="ml-2 px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] text-[10px] text-white cursor-pointer"
                >
                  Reset
                </button>
              </div>
            )}

            {/* Simulation Horizon Selector (Static by default, user-selected projection) */}
            <div className="absolute right-20 bottom-4 z-10 flex items-center gap-1.5 bg-[rgba(6,22,46,0.92)] border border-[rgba(56,189,248,0.25)] p-1.5 rounded-xl text-xs backdrop-blur-sm">
              <span className="text-[10px] uppercase font-mono text-[#93a9c7] px-1">
                Drift Forecast:
              </span>
              {[0, 6, 12, 24, 48].map((hr) => (
                <button
                  key={hr}
                  onClick={() => setSimulationHour(hr)}
                  className={`px-2 py-1 rounded-md text-[10px] font-mono transition-all cursor-pointer ${
                    simulationHour === hr
                      ? 'bg-[rgba(56,189,248,0.25)] text-[#38bdf8] border border-[rgba(56,189,248,0.5)] font-bold'
                      : 'text-[#93a9c7] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
                  }`}
                >
                  {hr === 0 ? 'NOW' : `+${hr}h`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
