import React from 'react';
import { RouteCorridor } from '../../types';

interface RouteAnalysisViewProps {
  corridors: RouteCorridor[];
  selectedCorridorId: string;
  onSelectCorridor: (id: string) => void;
}

export const RouteAnalysisView: React.FC<RouteAnalysisViewProps> = ({
  corridors,
  selectedCorridorId,
  onSelectCorridor,
}) => {
  const current = corridors.find((c) => c.id === selectedCorridorId) || corridors[0];

  const waypoints = [
    { name: 'WP-01 (Departure Lead)', lat: "64°18'36\"S", lon: "56°42'18\"W", dist: '0 nm', status: 'Passed' },
    { name: 'WP-02 (Weddell Channel Alpha)', lat: "64°45'00\"S", lon: "57°30'00\"W", dist: '54 nm', status: 'Next WP (ETA 4h 12m)' },
    { name: 'WP-03 (Erebus Basin Gate)', lat: "65°12'30\"S", lon: "58°15'00\"W", dist: '118 nm', status: 'En Route' },
    { name: 'WP-04 (James Ross Island Lead)', lat: "65°50'00\"S", lon: "59°05'00\"W", dist: '205 nm', status: 'Planned' },
    { name: 'WP-05 (Shelf Approach Sound)', lat: "66°20'00\"S", lon: "60°10'00\"W", dist: '280 nm', status: 'Planned' },
    { name: 'WP-06 (Research Station Berth)', lat: "66°48'00\"S", lon: "61°20'00\"W", dist: '342 nm', status: 'Destination' },
  ];

  return (
    <div className="space-y-4" id="view-route-analysis">
      {/* Header Banner */}
      <div className="panel glass p-6 rounded-[22px] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] text-[#6ddcff] uppercase tracking-[1.5px] font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-[#6ddcff]" />
            Polar Voyage Route Optimization Engine
          </div>
          <h2 className="font-space text-2xl font-bold text-[#f1f2fa]">
            Corridor Risk & Fuel Modeling
          </h2>
          <p className="text-xs text-[#9297b1] mt-1 max-w-2xl leading-relaxed">
            Dynamic route optimization balancing satellite-derived sea-ice thickness, iceberg drift vectors, and vessel hydrodynamic resistance.
          </p>
        </div>

        <div className="flex gap-2">
          {corridors.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectCorridor(c.id)}
              className={`px-3 py-2 rounded-xl text-xs font-space font-bold transition-all cursor-pointer border ${
                c.id === selectedCorridorId
                  ? 'bg-[rgba(69,224,208,0.15)] text-[#45e0d0] border-[rgba(69,224,208,0.3)] shadow-[0_0_15px_rgba(69,224,208,0.1)]'
                  : 'bg-[rgba(255,255,255,0.02)] text-[#9297b1] border-[rgba(165,177,224,0.1)] hover:text-[#f1f2fa]'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Corridor Comparative Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {corridors.map((c) => {
          const isSelected = c.id === selectedCorridorId;
          return (
            <div
              key={c.id}
              onClick={() => onSelectCorridor(c.id)}
              className={`panel glass p-5 rounded-[20px] transition-all cursor-pointer border ${
                isSelected
                  ? 'border-[rgba(69,224,208,0.35)] bg-[rgba(69,224,208,0.04)] shadow-[0_8px_25px_rgba(69,224,208,0.1)]'
                  : 'hover:border-[rgba(165,177,224,0.2)]'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[rgba(255,255,255,0.04)] text-[#b7bad0]">
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
              <p className="text-[11px] text-[#9297b1] mt-1 line-clamp-2">
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
            </div>
          );
        })}
      </div>

      {/* Selected Corridor Waypoints Table */}
      <div className="panel glass p-5 rounded-[22px]">
        <div className="flex justify-between items-center pb-3 border-b border-[rgba(165,177,224,0.13)] mb-4">
          <div>
            <h3 className="font-space text-sm font-semibold text-[#f1f2fa]">
              Waypoint Navigation Log · {current.name}
            </h3>
            <p className="text-[10px] text-[#9297b1]">Geodesic Rhumb-Line Track with Ice Clearance Gates</p>
          </div>
          <span className="text-xs font-mono text-[#45e0d0]">
            Total Distance: {current.distanceNm} nm
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)] text-[#666b86] text-[10px] uppercase">
                <th className="pb-2">Waypoint</th>
                <th className="pb-2">Latitude</th>
                <th className="pb-2">Longitude</th>
                <th className="pb-2">Cumul. Dist</th>
                <th className="pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.03)]">
              {waypoints.map((wp, i) => (
                <tr key={i} className="hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="py-2.5 font-medium text-[#f1f2fa]">{wp.name}</td>
                  <td className="py-2.5 text-[#b7bad0]">{wp.lat}</td>
                  <td className="py-2.5 text-[#b7bad0]">{wp.lon}</td>
                  <td className="py-2.5 text-[#6ddcff]">{wp.dist}</td>
                  <td className="py-2.5 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        wp.status === 'Passed'
                          ? 'bg-[rgba(102,226,163,0.1)] text-[#66e2a3]'
                          : wp.status.includes('Next')
                          ? 'bg-[rgba(69,224,208,0.15)] text-[#45e0d0]'
                          : 'bg-[rgba(255,255,255,0.03)] text-[#9297b1]'
                      }`}
                    >
                      {wp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
