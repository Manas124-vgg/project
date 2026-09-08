import React, { useState, useEffect } from 'react';
import { Iceberg, MapLayers, VesselTelemetry } from '../types';

interface AntarcticMapProps {
  icebergs: Iceberg[];
  vessel: VesselTelemetry;
  selectedIcebergId: string | null;
  onSelectIceberg: (id: string | null) => void;
  layers: MapLayers;
  onToggleLayer: (layer: keyof MapLayers) => void;
}

export const AntarcticMap: React.FC<AntarcticMapProps> = ({
  icebergs,
  vessel,
  selectedIcebergId,
  onSelectIceberg,
  layers,
  onToggleLayer,
}) => {
  // Drift oscillation offset state
  const [driftOffset, setDriftOffset] = useState<number>(0);
  const [driftDirection, setDriftDirection] = useState<number>(1);
  const [hoverCoord, setHoverCoord] = useState<{ lat: string; lon: string } | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(1);
  const [showVesselCard, setShowVesselCard] = useState<boolean>(false);

  // Subtle iceberg movement matching prototype JS
  useEffect(() => {
    const interval = setInterval(() => {
      setDriftOffset((prev) => {
        const next = prev + 0.12 * driftDirection;
        if (next > 3.5 || next < -3.5) {
          setDriftDirection((d) => -d);
        }
        return next;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [driftDirection]);

  const selectedBerg = icebergs.find((b) => b.id === selectedIcebergId);

  // Coordinate estimation on mouse move over SVG
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 900;
    const y = ((e.clientY - rect.top) / rect.height) * 520;

    // Approximated polar coordinates for realism
    const latDeg = (60 + ((y - 100) / 400) * 20).toFixed(1);
    const lonDeg = (30 + ((x - 150) / 700) * 45).toFixed(1);
    setHoverCoord({
      lat: `${latDeg}°S`,
      lon: `${lonDeg}°W`,
    });
  };

  return (
    <div
      className="bento-card overflow-hidden flex flex-col relative min-h-[585px]"
      id="antarctic-map-panel"
      style={{
        background: 'var(--card)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Panel Header */}
      <div className="min-h-[58px] flex justify-between items-center px-5 py-3.5 border-b border-[rgba(165,177,224,0.15)] bg-[rgba(8,9,20,0.5)]">
        <div>
          <div className="card-title mb-0 flex items-center gap-2">
            <span>Tactical Navigation Projection</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#45e0d0] shadow-[0_0_8px_#45e0d0]" />
          </div>
          <div className="text-[#9297b1] text-[10px] mt-0.5">
            Polar stereographic grid · EPSG:3031 · live SAR sync
          </div>
        </div>

        {/* Map Layer Tools */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            id="iceBtn"
            onClick={() => onToggleLayer('ice')}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer border ${
              layers.ice
                ? 'text-[#45e0d0] border-[rgba(69,224,208,0.3)] bg-[rgba(69,224,208,0.08)] shadow-[0_0_12px_rgba(69,224,208,0.15)]'
                : 'text-[#9297b1] border-[rgba(165,177,224,0.13)] bg-[rgba(255,255,255,0.025)] opacity-60 hover:opacity-100'
            }`}
          >
            Ice
          </button>

          <button
            id="bergsBtn"
            onClick={() => onToggleLayer('bergs')}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer border ${
              layers.bergs
                ? 'text-[#45e0d0] border-[rgba(69,224,208,0.3)] bg-[rgba(69,224,208,0.08)] shadow-[0_0_12px_rgba(69,224,208,0.15)]'
                : 'text-[#9297b1] border-[rgba(165,177,224,0.13)] bg-[rgba(255,255,255,0.025)] opacity-60 hover:opacity-100'
            }`}
          >
            Icebergs
          </button>

          <button
            id="routeBtn"
            onClick={() => onToggleLayer('route')}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer border ${
              layers.route
                ? 'text-[#45e0d0] border-[rgba(69,224,208,0.3)] bg-[rgba(69,224,208,0.08)] shadow-[0_0_12px_rgba(69,224,208,0.15)]'
                : 'text-[#9297b1] border-[rgba(165,177,224,0.13)] bg-[rgba(255,255,255,0.025)] opacity-60 hover:opacity-100'
            }`}
          >
            Track
          </button>

          <button
            id="driftBtn"
            onClick={() => onToggleLayer('driftVectors')}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer border ${
              layers.driftVectors
                ? 'text-[#8b7cff] border-[rgba(139,124,255,0.3)] bg-[rgba(139,124,255,0.08)]'
                : 'text-[#9297b1] border-[rgba(165,177,224,0.13)] bg-[rgba(255,255,255,0.025)] opacity-60 hover:opacity-100'
            }`}
          >
            Vectors
          </button>

          {/* Zoom In / Zoom Out */}
          <div className="flex items-center border border-[rgba(165,177,224,0.13)] rounded-lg overflow-hidden ml-1">
            <button
              onClick={() => setMapZoom((z) => Math.min(1.5, z + 0.15))}
              className="px-2 py-1 text-[11px] text-[#9297b1] hover:text-[#45e0d0] bg-[rgba(255,255,255,0.025)] hover:bg-[rgba(255,255,255,0.05)] cursor-pointer"
              title="Zoom In"
            >
              +
            </button>
            <button
              onClick={() => setMapZoom(1)}
              className="px-1.5 py-1 text-[9px] text-[#666b86] hover:text-[#b7bad0] bg-[rgba(255,255,255,0.025)] cursor-pointer"
              title="Reset Zoom"
            >
              1x
            </button>
            <button
              onClick={() => setMapZoom((z) => Math.max(0.85, z - 0.15))}
              className="px-2 py-1 text-[11px] text-[#9297b1] hover:text-[#45e0d0] bg-[rgba(255,255,255,0.025)] hover:bg-[rgba(255,255,255,0.05)] cursor-pointer"
              title="Zoom Out"
            >
              −
            </button>
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div
        className="relative flex-1 h-[520px] overflow-hidden"
        style={{
          background: 'radial-gradient(circle at center, #1a2040, var(--card))',
        }}
        onMouseLeave={() => setHoverCoord(null)}
      >
        {/* Ocean contour pseudo-lines background */}
        <div
          className="absolute inset-0 opacity-45 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(ellipse at center, transparent 20%, rgba(109,220,255,0.035) 21%, transparent 22%),
              radial-gradient(ellipse at center, transparent 35%, rgba(109,220,255,0.028) 36%, transparent 37%),
              radial-gradient(ellipse at center, transparent 50%, rgba(109,220,255,0.023) 51%, transparent 52%)
            `,
          }}
        />

        {/* SVG Projection Canvas */}
        <div
          className="w-full h-full transition-transform duration-300 origin-center"
          style={{ transform: `scale(${mapZoom})` }}
        >
          <svg
            id="antarcticMap"
            viewBox="0 0 900 520"
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-full select-none"
            onMouseMove={handleMouseMove}
          >
            <defs>
              <radialGradient id="oceanGlow">
                <stop offset="0%" stopColor="#182e43" />
                <stop offset="100%" stopColor="#09121e" />
              </radialGradient>

              <linearGradient id="iceGradient" x1="0" x2="1">
                <stop offset="0%" stopColor="#6ddcff" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#8b7cff" stopOpacity="0.03" />
              </linearGradient>

              <filter id="glow">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter id="softGlow">
                <feGaussianBlur stdDeviation="2.5" />
              </filter>

              <filter id="bergGlow">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#ffca72" floodOpacity="0.6" />
              </filter>
            </defs>

            {/* Ocean Basin */}
            <rect width="900" height="520" fill="url(#oceanGlow)" />

            {/* Polar Grid (Concentric Latitude Rings) */}
            <g fill="none" stroke="#6ddcff" strokeOpacity="0.09">
              <ellipse cx="450" cy="280" rx="360" ry="190" />
              <ellipse cx="450" cy="280" rx="275" ry="145" />
              <ellipse cx="450" cy="280" rx="190" ry="100" />
              <ellipse cx="450" cy="280" rx="90" ry="50" strokeOpacity="0.05" />
            </g>

            {/* Longitude Lines (Curved meridians converging on South Pole) */}
            <g stroke="#6ddcff" strokeOpacity="0.055" fill="none">
              <path d="M450 75 Q290 280 450 485" />
              <path d="M450 75 Q610 280 450 485" />
              <path d="M450 75 Q350 280 450 485" />
              <path d="M450 75 Q550 280 450 485" />
              <line x1="90" y1="280" x2="810" y2="280" strokeOpacity="0.04" />
              <line x1="450" y1="50" x2="450" y2="500" strokeOpacity="0.04" />
            </g>

            {/* Antarctica Continent Outline */}
            <path
              id="antarctica-mainland"
              d="
                M450 160
                C405 145 365 153 342 176
                C315 167 292 189 300 214
                C272 229 282 253 302 265
                C277 285 288 311 315 318
                C300 347 328 365 350 356
                C355 387 390 390 409 374
                C430 404 468 395 478 370
                C505 390 540 375 537 349
                C568 360 592 334 574 310
                C606 302 607 271 583 258
                C604 236 586 211 561 211
                C558 183 526 171 502 182
                C489 154 467 150 450 160 Z
              "
              fill="#e8eef1"
              fillOpacity="0.88"
              stroke="#ffffff"
              strokeOpacity="0.35"
              strokeWidth="1.5"
            />

            {/* Ice Shelf (Ross & Ronne-Filchner shelves) */}
            <path
              id="ice-shelf"
              d="
                M340 190
                C370 171 410 178 450 169
                C490 177 535 167 568 190
                L579 211
                C525 198 482 207 450 198
                C412 207 370 196 320 213 Z
              "
              fill="url(#iceGradient)"
              opacity="0.9"
            />

            {/* Ice Fields Layer (Pack Ice Polygons) */}
            {layers.ice && (
              <g id="iceLayer" className="transition-opacity duration-300">
                <g fill="#6ddcff" fillOpacity="0.11" stroke="#6ddcff" strokeOpacity="0.18">
                  <path d="M220 150 L270 137 L301 165 L275 191 L225 180 Z" />
                  <path d="M620 166 L670 145 L712 171 L690 205 L638 197 Z" />
                  <path d="M170 260 L225 242 L257 270 L235 301 L180 293 Z" />
                  <path d="M650 277 L710 252 L746 286 L720 321 L665 316 Z" />
                  <path d="M260 370 L310 346 L345 373 L322 406 L278 399 Z" />
                  <path d="M570 380 L625 351 L660 380 L632 414 L585 407 Z" />
                  {/* Extra pack field for realistic boundary */}
                  <path d="M470 435 L520 420 L545 448 L510 470 L465 460 Z" opacity="0.8" />
                </g>

                {/* Animated Ice Floe Fragments */}
                <g fill="#a5eaff" opacity="0.45" className="floating">
                  <circle cx="207" cy="205" r="3" />
                  <circle cx="690" cy="225" r="4" />
                  <circle cx="170" cy="340" r="3" />
                  <circle cx="745" cy="355" r="3" />
                  <circle cx="285" cy="130" r="3" />
                  <circle cx="635" cy="130" r="3" />
                  <circle cx="490" cy="450" r="2.5" />
                  <circle cx="340" cy="380" r="3" />
                </g>
              </g>
            )}

            {/* Route Layer */}
            {layers.route && (
              <g id="routeLayer" className="transition-opacity duration-300">
                {/* Route Glow Path */}
                <path
                  d="M705 440
                     C660 420 650 380 615 350
                     C585 325 560 310 530 295
                     C500 280 480 270 458 260"
                  fill="none"
                  stroke="#45e0d0"
                  strokeOpacity="0.16"
                  strokeWidth="10"
                  filter="url(#softGlow)"
                />

                {/* Route Track Line */}
                <path
                  d="M705 440
                     C660 420 650 380 615 350
                     C585 325 560 310 530 295
                     C500 280 480 270 458 260"
                  fill="none"
                  stroke="#45e0d0"
                  strokeWidth="2.5"
                  strokeDasharray="7 7"
                />

                {/* Waypoint Checkpoints */}
                <circle cx="615" cy="350" r="3" fill="#45e0d0" opacity="0.6" />
                <circle cx="530" cy="295" r="3" fill="#45e0d0" opacity="0.6" />

                {/* Research Vessel Marker at (705, 440) */}
                <g
                  transform="translate(705 440)"
                  className="cursor-pointer"
                  onClick={() => setShowVesselCard(!showVesselCard)}
                >
                  <circle r="16" fill="#45e0d0" fillOpacity="0.09" className="pulse-marker" />
                  <circle r="6" fill="#45e0d0" filter="url(#glow)" />
                  <path d="M-5 6 L5 6 L2 -6 L-2 -6 Z" fill="#e9ffff" transform="rotate(25)" />
                </g>

                {/* Destination Station Marker at (458, 260) */}
                <g transform="translate(458 260)">
                  <circle r="6" fill="none" stroke="#c9c2ff" strokeWidth="2" />
                  <circle r="2.5" fill="#c9c2ff" />
                  <circle r="12" fill="none" stroke="#c9c2ff" strokeOpacity="0.2" strokeDasharray="3 3" />
                </g>
              </g>
            )}

            {/* Icebergs Layer */}
            {layers.bergs && (
              <g id="bergsLayer" className="transition-opacity duration-300">
                {icebergs.map((berg, index) => {
                  const isSelected = berg.id === selectedIcebergId;
                  const currentDir = index % 2 === 0 ? 1 : -1;
                  const currentOffset = driftOffset * currentDir;

                  return (
                    <g
                      key={berg.id}
                      className="berg-marker cursor-pointer group"
                      transform={`translate(${berg.svgX + currentOffset} ${berg.svgY})`}
                      onClick={() => onSelectIceberg(isSelected ? null : berg.id)}
                    >
                      {/* Selection ring if selected */}
                      {isSelected && (
                        <circle
                          r="18"
                          fill="none"
                          stroke="#ffca72"
                          strokeWidth="1.5"
                          strokeDasharray="4 3"
                          className="animate-spin"
                          style={{ animationDuration: '6s' }}
                        />
                      )}

                      {/* Halo aura */}
                      <circle
                        r={isSelected ? 14 : 11}
                        fill="#ffca72"
                        fillOpacity={isSelected ? 0.25 : 0.08}
                        className="transition-all duration-200 group-hover:fill-opacity-30"
                      />

                      {/* Diamond polygon for iceberg */}
                      <path
                        d="M0 -7 L7 3 L2 7 L-6 4 Z"
                        fill={isSelected ? '#ffffff' : '#ffca72'}
                        filter={isSelected ? 'url(#glow)' : 'url(#bergGlow)'}
                        className="transition-colors duration-200"
                      />

                      {/* Drift Vector Arrow */}
                      {layers.driftVectors && (
                        <g opacity="0.65">
                          <line
                            x1="0"
                            y1="0"
                            x2={Math.sin((berg.driftHeadingDeg * Math.PI) / 180) * 16}
                            y2={-Math.cos((berg.driftHeadingDeg * Math.PI) / 180) * 16}
                            stroke="#ffca72"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                          />
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            )}

            {/* Map Labels */}
            <g fontFamily="DM Sans" fontSize="9" fill="#9da5c2" pointerEvents="none">
              <text x="680" y="464" fontWeight="600" letterSpacing="0.5px">
                RESEARCH VESSEL
              </text>
              <text x="465" y="250" fontWeight="600" letterSpacing="0.5px" fill="#c9c2ff">
                DESTINATION
              </text>

              {layers.bergs && (
                <>
                  <text x="566" y="222" fill="#ffca72" fontWeight="500">
                    IB-01
                  </text>
                  <text x="617" y="295" fill="#ffca72" fontWeight="500">
                    IB-02
                  </text>
                  <text x="510" y="204" fill="#ffca72" fontWeight="500">
                    IB-03
                  </text>
                  <text x="382" y="298" fill="#ffca72" fontWeight="500">
                    IB-04
                  </text>
                </>
              )}

              {/* Geographic feature annotations */}
              <text x="325" y="178" fontSize="8" fill="#666b86" letterSpacing="1px">
                WEDDELL SEA
              </text>
              <text x="535" y="172" fontSize="8" fill="#666b86" letterSpacing="1px">
                ROSS ICE SHELF
              </text>
            </g>

            {/* Compass Rose */}
            <g transform="translate(810 85)">
              <circle
                r="25"
                fill="#090f19"
                fillOpacity="0.75"
                stroke="#6ddcff"
                strokeOpacity="0.15"
                strokeWidth="1"
              />
              <path d="M0 -16 L4 0 L0 16 L-4 0 Z" fill="#c9c2ff" />
              <path d="M-16 0 L0 4 L16 0 L0 -4 Z" fill="#8b7cff" opacity="0.6" />
              <text x="-3" y="-29" fill="#858da9" fontSize="8" fontWeight="bold">
                N
              </text>
              <text x="-3" y="38" fill="#858da9" fontSize="8" fontWeight="bold">
                S
              </text>
            </g>
          </svg>
        </div>

        {/* Selected Iceberg Floating Card (if user clicked an iceberg) */}
        {selectedBerg && (
          <div
            className="absolute top-4 right-4 max-w-[260px] p-3.5 rounded-[15px] bg-[rgba(8,10,20,0.92)] border border-[rgba(255,202,114,0.3)] shadow-[0_12px_30px_rgba(0,0,0,0.5)] backdrop-blur-[16px] z-20 text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.08)]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#ffca72] rotate-45" />
                <strong className="font-space text-[13px] text-[#f1f2fa]">
                  {selectedBerg.code}
                </strong>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[rgba(255,202,114,0.15)] text-[#ffca72] uppercase font-mono">
                  {selectedBerg.hazardLevel}
                </span>
              </div>
              <button
                onClick={() => onSelectIceberg(null)}
                className="text-[#9297b1] hover:text-white text-sm cursor-pointer p-0.5"
              >
                ✕
              </button>
            </div>

            <div className="mt-2 space-y-1 text-[11px]">
              <div className="text-[#b7bad0] font-medium">{selectedBerg.name}</div>
              <div className="flex justify-between text-[#9297b1]">
                <span>Dimensions:</span>
                <span className="text-[#f1f2fa] font-mono">{selectedBerg.dimensions}</span>
              </div>
              <div className="flex justify-between text-[#9297b1]">
                <span>Draft:</span>
                <span className="text-[#f1f2fa] font-mono">{selectedBerg.draftM} m</span>
              </div>
              <div className="flex justify-between text-[#9297b1]">
                <span>Coordinates:</span>
                <span className="text-[#45e0d0] font-mono">{selectedBerg.latDisplay}</span>
              </div>
              <div className="flex justify-between text-[#9297b1]">
                <span>Drift Vector:</span>
                <span className="text-[#f1f2fa] font-mono">{selectedBerg.driftSpeedKnots} kn @ {selectedBerg.driftHeadingDeg}°</span>
              </div>
              <div className="flex justify-between text-[#9297b1]">
                <span>Corridor Dist:</span>
                <strong className="text-[#ffca72] font-mono font-bold">{selectedBerg.distanceNm} nm</strong>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-[rgba(255,255,255,0.06)] text-[10px] text-[#9297b1] italic">
              {selectedBerg.notes}
            </div>
          </div>
        )}

        {/* Vessel Telemetry Floating Card (if user clicked vessel) */}
        {showVesselCard && (
          <div
            className="absolute top-4 right-4 max-w-[260px] p-3.5 rounded-[15px] bg-[rgba(8,10,20,0.92)] border border-[rgba(69,224,208,0.3)] shadow-[0_12px_30px_rgba(0,0,0,0.5)] backdrop-blur-[16px] z-20 text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.08)]">
              <div className="flex items-center gap-2">
                <span className="text-[#45e0d0]">⚓</span>
                <strong className="font-space text-[13px] text-[#f1f2fa]">
                  {vessel.name}
                </strong>
              </div>
              <button
                onClick={() => setShowVesselCard(false)}
                className="text-[#9297b1] hover:text-white text-sm cursor-pointer p-0.5"
              >
                ✕
              </button>
            </div>
            <div className="mt-2 space-y-1 text-[11px]">
              <div className="flex justify-between text-[#9297b1]">
                <span>Speed:</span>
                <span className="text-[#45e0d0] font-mono font-bold">{vessel.speedKnots} kn</span>
              </div>
              <div className="flex justify-between text-[#9297b1]">
                <span>Heading:</span>
                <span className="text-[#f1f2fa] font-mono">{vessel.heading}° T</span>
              </div>
              <div className="flex justify-between text-[#9297b1]">
                <span>Position:</span>
                <span className="text-[#b7bad0] font-mono">{vessel.position.lat}</span>
              </div>
              <div className="flex justify-between text-[#9297b1]">
                <span>Hull Strain:</span>
                <span className="text-[#66e2a3] font-mono">{vessel.hullStrainPercent}% (Safe)</span>
              </div>
            </div>
          </div>
        )}

        {/* Live Coordinate Crosshair Readout */}
        {hoverCoord && (
          <div className="absolute top-3 left-4 px-2 py-1 rounded-md bg-[rgba(8,9,20,0.8)] border border-[rgba(165,177,224,0.12)] text-[10px] text-[#b7bad0] font-mono backdrop-blur-xs">
            POS: {hoverCoord.lat} · {hoverCoord.lon}
          </div>
        )}

        {/* Map Legend (Bottom Left matching prototype) */}
        <div className="map-legend absolute left-[18px] bottom-[18px] w-[175px] p-[13px] rounded-[13px] bg-[rgba(7,10,19,0.85)] border border-[rgba(165,177,224,0.13)] backdrop-blur-[15px] z-10">
          <div className="text-[#b7bad0] text-[9px] uppercase tracking-[1px] font-semibold mb-2.5">
            Map layers
          </div>

          <div
            className={`flex items-center gap-2 text-[10px] my-1.5 cursor-pointer ${
              layers.route ? 'text-[#f1f2fa]' : 'text-[#666b86]'
            }`}
            onClick={() => onToggleLayer('route')}
          >
            <span className="w-[22px] h-[2px] bg-[#45e0d0] block" />
            <span>Vessel track</span>
          </div>

          <div
            className={`flex items-center gap-2 text-[10px] my-1.5 cursor-pointer ${
              layers.ice ? 'text-[#f1f2fa]' : 'text-[#666b86]'
            }`}
            onClick={() => onToggleLayer('ice')}
          >
            <span className="w-2.5 h-2.5 bg-[rgba(109,220,255,0.35)] border border-[#6ddcff] rounded-[3px] block" />
            <span>Sea-ice field</span>
          </div>

          <div
            className={`flex items-center gap-2 text-[10px] my-1.5 cursor-pointer ${
              layers.bergs ? 'text-[#f1f2fa]' : 'text-[#666b86]'
            }`}
            onClick={() => onToggleLayer('bergs')}
          >
            <span className="w-2 h-2 bg-[#ffca72] rotate-45 block" />
            <span>Iceberg object</span>
          </div>
        </div>

        {/* Tactical Position Indicator (Bento style bottom-right) */}
        <div className="absolute bottom-5 right-5 text-right pointer-events-none z-10 mono">
          <div className="text-xs sm:text-[13px] font-bold tracking-wider text-[#45e0d0]">
            {vessel.name.toUpperCase()}
          </div>
          <div className="text-[10px] text-[#9297b1] tracking-wide mt-0.5">
            64.310°S · 56.705°W
          </div>
        </div>
      </div>
    </div>
  );
};
