import React, { useState } from 'react';
import { RouteCorridor, Iceberg, VesselTelemetry, MapLayers } from '../../types';
import { corridorWaypoints } from '../../data/mockData';
import { AntarcticMap } from '../AntarcticMap';

interface RouteAnalysisViewProps {
  corridors: RouteCorridor[];
  selectedCorridorId: string;
  onSelectCorridor: (id: string) => void;
  icebergs: Iceberg[];
  vessel: VesselTelemetry;
  selectedIcebergId: string | null;
  onSelectIceberg: (id: string | null) => void;
  layers: MapLayers;
  onToggleLayer: (layer: keyof MapLayers) => void;
}

export const RouteAnalysisView: React.FC<RouteAnalysisViewProps> = ({
  corridors,
  selectedCorridorId,
  onSelectCorridor,
  icebergs,
  vessel,
  selectedIcebergId,
  onSelectIceberg,
  layers,
  onToggleLayer,
}) => {
  const current = corridors.find((c) => c.id === selectedCorridorId) || corridors[0];
  const activeWaypoints = corridorWaypoints[selectedCorridorId] || corridorWaypoints['corridor-a'];
  const [selectedWaypointId, setSelectedWaypointId] = useState<string | null>(null);

  return (
    <div className="space-y-4" id="view-route-analysis">
      {/* Header Banner */}
      <div className="panel glass p-6 rounded-[22px] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] text-[#45e0d0] uppercase tracking-[1.5px] font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-[#45e0d0] shadow-[0_0_8px_#45e0d0]" />
            Polar Voyage Route Optimization Engine
          </div>
          <h2 className="font-space text-2xl font-bold text-[#f1f2fa]">
            Corridor Risk & Fuel Modeling
          </h2>
          <p className="text-xs text-[#9297b1] mt-1 max-w-2xl leading-relaxed">
            Dynamic rhumb-line and great-circle route modeling balancing satellite sea-ice thickness, iceberg drift vectors, and vessel hydrodynamic resistance.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {corridors.map((c) => {
            const isSelected = c.id === selectedCorridorId;
            return (
              <button
                key={c.id}
                onClick={() => onSelectCorridor(c.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-space font-bold transition-all cursor-pointer border ${
                  isSelected
                    ? c.id === 'corridor-a'
                      ? 'bg-[rgba(69,224,208,0.2)] text-[#45e0d0] border-[rgba(69,224,208,0.4)] shadow-[0_0_15px_rgba(69,224,208,0.15)]'
                      : c.id === 'corridor-b'
                      ? 'bg-[rgba(255,202,114,0.2)] text-[#ffca72] border-[rgba(255,202,114,0.4)] shadow-[0_0_15px_rgba(255,202,114,0.15)]'
                      : 'bg-[rgba(139,124,255,0.2)] text-[#8b7cff] border-[rgba(139,124,255,0.4)] shadow-[0_0_15px_rgba(139,124,255,0.15)]'
                    : 'bg-[rgba(255,255,255,0.02)] text-[#9297b1] border-[rgba(165,177,224,0.1)] hover:text-[#f1f2fa]'
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tactical Route Map Panel */}
      <div className="w-full">
        <AntarcticMap
          icebergs={icebergs}
          vessel={vessel}
          selectedIcebergId={selectedIcebergId}
          onSelectIceberg={onSelectIceberg}
          layers={layers}
          onToggleLayer={onToggleLayer}
          selectedCorridorId={selectedCorridorId}
          onSelectCorridor={onSelectCorridor}
        />
      </div>

      {/* Corridor Comparative Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {corridors.map((c) => {
          const isSelected = c.id === selectedCorridorId;
          return (
            <div
              key={c.id}
              onClick={() => onSelectCorridor(c.id)}
              className={`panel glass p-5 rounded-[20px] transition-all cursor-pointer border relative overflow-hidden ${
                isSelected
                  ? c.id === 'corridor-a'
                    ? 'border-[rgba(69,224,208,0.4)] bg-[rgba(69,224,208,0.05)] shadow-[0_8px_30px_rgba(69,224,208,0.12)]'
                    : c.id === 'corridor-b'
                    ? 'border-[rgba(255,202,114,0.4)] bg-[rgba(255,202,114,0.05)] shadow-[0_8px_30px_rgba(255,202,114,0.12)]'
                    : 'border-[rgba(139,124,255,0.4)] bg-[rgba(139,124,255,0.05)] shadow-[0_8px_30px_rgba(139,124,255,0.12)]'
                  : 'hover:border-[rgba(165,177,224,0.22)] hover:bg-[rgba(255,255,255,0.02)]'
              }`}
            >
              {isSelected && (
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{
                    background:
                      c.id === 'corridor-a'
                        ? '#45e0d0'
                        : c.id === 'corridor-b'
                        ? '#ffca72'
                        : '#8b7cff',
                  }}
                />
              )}

              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[rgba(255,255,255,0.05)] text-[#b7bad0]">
                  {c.status}
                </span>
                <span
                  className={`text-xs font-bold font-space ${
                    c.riskScore === 'Low'
                      ? 'text-[#66e2a3]'
                      : c.riskScore === 'Moderate'
                      ? 'text-[#ffca72]'
                      : 'text-[#ff7189]'
                  }`}
                >
                  {c.riskScore} Risk
                </span>
              </div>

              <h3 className="font-space text-base font-bold text-[#f1f2fa]">
                {c.name}
              </h3>
              <p className="text-[11px] text-[#9297b1] mt-1 leading-relaxed">
                {c.description}
              </p>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)] text-center font-mono">
                <div>
                  <span className="text-[9px] text-[#9297b1] block">Distance</span>
                  <strong className="text-xs text-[#f1f2fa]">{c.distanceNm} nm</strong>
                </div>
                <div>
                  <span className="text-[9px] text-[#9297b1] block">ETA</span>
                  <strong className="text-xs text-[#45e0d0]">{c.etaFormatted}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-[#9297b1] block">Fuel Burn</span>
                  <strong className="text-xs text-[#b7bad0]">{c.fuelConsumptionPct}%</strong>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-[rgba(255,255,255,0.04)] flex justify-between items-center text-[10px] text-[#8892b0]">
                <span>Avg Ice Thickness:</span>
                <span className="text-[#f1f2fa] font-mono font-bold">{c.packIceThicknessAvg} m</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Corridor Waypoints Table & Ice Profile Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Waypoint Navigation Log Table */}
        <div className="panel glass p-5 rounded-[22px] lg:col-span-2">
          <div className="flex justify-between items-center pb-3 border-b border-[rgba(165,177,224,0.13)] mb-4">
            <div>
              <h3 className="font-space text-sm font-semibold text-[#f1f2fa] flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    background:
                      current.id === 'corridor-a'
                        ? '#45e0d0'
                        : current.id === 'corridor-b'
                        ? '#ffca72'
                        : '#8b7cff',
                  }}
                />
                Waypoint Navigation Log · {current.name}
              </h3>
              <p className="text-[10px] text-[#9297b1]">
                Geodesic Rhumb-Line Track with Real-Time Soundings and Ice Clearance Gates
              </p>
            </div>
            <span className="text-xs font-mono text-[#45e0d0]">
              Total Distance: {current.distanceNm} nm ({activeWaypoints.length} Checkpoints)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)] text-[#666b86] text-[10px] uppercase">
                  <th className="pb-2">Waypoint</th>
                  <th className="pb-2">Coordinates</th>
                  <th className="pb-2">Cumul. Dist</th>
                  <th className="pb-2">Sounding</th>
                  <th className="pb-2">Ice Avg</th>
                  <th className="pb-2">Schedule</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.03)]">
                {activeWaypoints.map((wp) => {
                  const isSelected = selectedWaypointId === wp.id;
                  return (
                    <tr
                      key={wp.id}
                      onClick={() => setSelectedWaypointId(isSelected ? null : wp.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[rgba(69,224,208,0.08)]'
                          : 'hover:bg-[rgba(255,255,255,0.02)]'
                      }`}
                    >
                      <td className="py-2.5 font-medium text-[#f1f2fa] flex items-center gap-2">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            wp.status === 'Passed'
                              ? 'bg-[#66e2a3]'
                              : wp.status === 'Next'
                              ? 'bg-[#45e0d0] shadow-[0_0_6px_#45e0d0]'
                              : wp.status === 'Destination'
                              ? 'bg-[#ffca72]'
                              : 'bg-[#9297b1]'
                          }`}
                        />
                        {wp.name}
                      </td>
                      <td className="py-2.5 text-[#b7bad0] text-[11px]">
                        {wp.lat} · {wp.lon}
                      </td>
                      <td className="py-2.5 text-[#6ddcff] font-bold">{wp.distNm} nm</td>
                      <td className="py-2.5 text-[#8892b0]">{wp.depthM} m</td>
                      <td className="py-2.5 text-[#f1f2fa]">{wp.iceThicknessM} m</td>
                      <td className="py-2.5 text-[#b7bad0]">{wp.eta}</td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            wp.status === 'Passed'
                              ? 'bg-[rgba(102,226,163,0.12)] text-[#66e2a3]'
                              : wp.status === 'Next'
                              ? 'bg-[rgba(69,224,208,0.18)] text-[#45e0d0] border border-[rgba(69,224,208,0.3)]'
                              : wp.status === 'Destination'
                              ? 'bg-[rgba(255,202,114,0.18)] text-[#ffca72] border border-[rgba(255,202,114,0.3)]'
                              : 'bg-[rgba(255,255,255,0.03)] text-[#9297b1]'
                          }`}
                        >
                          {wp.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Corridor Hydrodynamics & Segment Ice Profile */}
        <div className="panel glass p-5 rounded-[22px] flex flex-col justify-between gap-4">
          <div>
            <h3 className="font-space text-sm font-semibold text-[#f1f2fa] pb-2 border-b border-[rgba(165,177,224,0.13)]">
              Segment Ice Profile
            </h3>
            <p className="text-[10px] text-[#9297b1] mt-1 mb-3">
              Ice thickness and hull resistance profile along {current.name} legs.
            </p>

            <div className="space-y-3 font-mono text-xs">
              {activeWaypoints.map((wp, idx) => {
                const pct = Math.min(100, Math.round((wp.iceThicknessM / 2.0) * 100));
                return (
                  <div key={wp.id} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#b7bad0]">
                        Leg {idx + 1}: {wp.name.split(' ')[0]}
                      </span>
                      <span className="text-[#45e0d0] font-bold">{wp.iceThicknessM} m</span>
                    </div>
                    <div className="w-full h-1.5 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${pct}%`,
                          backgroundColor:
                            pct > 70 ? '#ff7189' : pct > 45 ? '#ffca72' : '#45e0d0',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(165,177,224,0.1)] text-xs">
            <div className="flex justify-between items-center text-[11px] mb-1">
              <span className="text-[#8892b0]">Estimated Hull Stress:</span>
              <span className="text-[#66e2a3] font-mono font-bold">
                {current.riskScore === 'Low' ? '32% (Nominal)' : current.riskScore === 'Moderate' ? '54% (Elevated)' : '78% (High)'}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#8892b0]">Icebreaker Escort:</span>
              <span className="text-[#b7bad0] font-mono">
                {current.icebreakerEscortReq ? 'Required' : 'Not Required'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
