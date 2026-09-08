import React from 'react';
import { VesselTelemetry } from '../../types';

interface VesselStatusViewProps {
  vessel: VesselTelemetry;
}

export const VesselStatusView: React.FC<VesselStatusViewProps> = ({ vessel }) => {
  return (
    <div className="space-y-4" id="view-vessel-status">
      {/* Header Banner */}
      <div className="panel glass p-6 rounded-[22px] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] text-[#66e2a3] uppercase tracking-[1.5px] font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-[#66e2a3] animate-pulse" />
            Vessel Integrated Automation System (IAS) · Live Telemetry
          </div>
          <h2 className="font-space text-2xl font-bold text-[#f1f2fa]">
            {vessel.name} · Polar Class 5 Telemetry
          </h2>
          <p className="text-xs text-[#9297b1] mt-1 max-w-2xl leading-relaxed">
            Hull structural stress transducers, azipod propulsion load, fuel oil bunker endurance, and satellite communications link status.
          </p>
        </div>

        <div className="flex gap-2">
          <div className="px-3 py-2 rounded-xl bg-[rgba(102,226,163,0.1)] border border-[rgba(102,226,163,0.25)] text-[#66e2a3] font-mono text-xs font-bold flex items-center gap-2">
            <span>●</span> STATUS: {vessel.operationalState}
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="panel glass p-5 rounded-[20px]">
          <span className="text-xs text-[#9297b1]">Current Speed / Heading</span>
          <div className="font-space text-2xl font-bold text-[#f1f2fa] mt-1 font-mono">
            {vessel.speedKnots} kn / {vessel.heading}°
          </div>
          <div className="text-[10px] text-[#45e0d0] mt-1">Azimuthing thrusters synchronized</div>
        </div>

        {/* Stat 2 */}
        <div className="panel glass p-5 rounded-[20px]">
          <span className="text-xs text-[#9297b1]">Hull Bow Strain</span>
          <div className="font-space text-2xl font-bold text-[#66e2a3] mt-1 font-mono">
            {vessel.hullStrainPercent}% <span className="text-xs font-sans font-normal text-[#9297b1]">(Nominal)</span>
          </div>
          <div className="text-[10px] text-[#9297b1] mt-1">Safe threshold &lt; 75% yield limit</div>
        </div>

        {/* Stat 3 */}
        <div className="panel glass p-5 rounded-[20px]">
          <span className="text-xs text-[#9297b1]">Heavy Fuel / MGO Bunker</span>
          <div className="font-space text-2xl font-bold text-[#f1f2fa] mt-1 font-mono">
            {vessel.fuelRemainingPercent}%
          </div>
          <div className="text-[10px] text-[#b7bad0] mt-1">Estimated endurance: 42 sea days</div>
        </div>

        {/* Stat 4 */}
        <div className="panel glass p-5 rounded-[20px]">
          <span className="text-xs text-[#9297b1]">Satcom Link Status</span>
          <div className="font-space text-2xl font-bold text-[#45e0d0] mt-1 font-mono">
            CONNECTED
          </div>
          <div className="text-[10px] text-[#66e2a3] mt-1">Iridium Certus + Starlink Polar Active</div>
        </div>
      </div>

      {/* Hull Strain Visual Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="panel glass p-5 rounded-[22px]">
          <h3 className="font-space text-sm font-semibold text-[#f1f2fa] pb-3 border-b border-[rgba(165,177,224,0.13)] mb-4">
            Icebreaker Hull Stress Transducers
          </h3>
          <div className="space-y-3 text-xs font-mono">
            <div>
              <div className="flex justify-between text-[#b7bad0] mb-1">
                <span>Bow Stem Knife Edge:</span>
                <span className="text-[#66e2a3]">38% strain</span>
              </div>
              <div className="h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                <div className="h-full bg-[#66e2a3] rounded-full" style={{ width: '38%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[#b7bad0] mb-1">
                <span>Port Ice-Belt Plating:</span>
                <span className="text-[#66e2a3]">29% strain</span>
              </div>
              <div className="h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                <div className="h-full bg-[#66e2a3] rounded-full" style={{ width: '29%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[#b7bad0] mb-1">
                <span>Starboard Ice-Belt Plating:</span>
                <span className="text-[#66e2a3]">31% strain</span>
              </div>
              <div className="h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                <div className="h-full bg-[#66e2a3] rounded-full" style={{ width: '31%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[#b7bad0] mb-1">
                <span>Rudder & Propeller Nozzles:</span>
                <span className="text-[#45e0d0]">24% load</span>
              </div>
              <div className="h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                <div className="h-full bg-[#45e0d0] rounded-full" style={{ width: '24%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="panel glass p-5 rounded-[22px]">
          <h3 className="font-space text-sm font-semibold text-[#f1f2fa] pb-3 border-b border-[rgba(165,177,224,0.13)] mb-4">
            Vessel Particulars & Registry
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.04)]">
              <span className="text-[#9297b1]">Vessel Name:</span>
              <span className="text-[#f1f2fa] font-mono">{vessel.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.04)]">
              <span className="text-[#9297b1]">Call Sign / IMO:</span>
              <span className="text-[#f1f2fa] font-mono">{vessel.callSign} / IMO 9844219</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.04)]">
              <span className="text-[#9297b1]">Polar Class:</span>
              <span className="text-[#45e0d0] font-mono">{vessel.iceClass}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.04)]">
              <span className="text-[#9297b1]">Displacement:</span>
              <span className="text-[#f1f2fa] font-mono">14,200 Gross Tonnage</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#9297b1]">Mission Authority:</span>
              <span className="text-[#b7bad0]">Antarctic Treaty Science Operations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
