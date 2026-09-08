import React from 'react';
import { EnvironmentalCondition } from '../../types';

interface EnvironmentalDataViewProps {
  environment: EnvironmentalCondition;
}

export const EnvironmentalDataView: React.FC<EnvironmentalDataViewProps> = ({ environment }) => {
  const sensorReadings = [
    { name: 'Barometric Pressure', val: `${environment.barometricPressureHpa} hPa`, trend: 'Falling (-1.4 hPa/3h)', alert: 'Gale Warning Imminent' },
    { name: 'Ambient Air Temperature', val: `${environment.airTempC}°C`, trend: 'Stable (-0.2°C/h)', alert: 'Severe Wind Chill (-31°C)' },
    { name: 'Sea Surface Water Temp', val: `${environment.waterTempC}°C`, trend: 'Near Supercooled', alert: 'Active Fraxil Ice Formation' },
    { name: 'True Wind Direction / Speed', val: `${environment.windDir} @ ${environment.windSpeedKn} kn`, trend: 'Gusts to 42 kn', alert: 'Katabatic Flow Offshore' },
    { name: 'Relative Air Humidity', val: '88%', trend: 'Saturated', alert: 'Hoar Frost / Freezing Spray' },
    { name: 'Horizontal Visibility', val: `${environment.visibilityKm} km`, trend: 'Restricted in Snow', alert: 'Radar Augmented Watch' },
  ];

  return (
    <div className="space-y-4" id="view-environmental-data">
      {/* Header Banner */}
      <div className="panel glass p-6 rounded-[22px] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] text-[#8b7cff] uppercase tracking-[1.5px] font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-[#8b7cff]" />
            Antarctic Synoptic Weather Network & Shipboard Weather Station
          </div>
          <h2 className="font-space text-2xl font-bold text-[#f1f2fa]">
            Meteorological & Oceanographic Telemetry
          </h2>
          <p className="text-xs text-[#9297b1] mt-1 max-w-2xl leading-relaxed">
            Real-time calibrated atmospheric metrics, ocean current vectors, katabatic wind shear alerts, and sea-ice thermodynamics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-[rgba(139,124,255,0.1)] border border-[rgba(139,124,255,0.25)] text-[#c9c2ff] text-xs font-mono font-bold">
            986.2 hPa Low
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-[rgba(255,113,137,0.1)] border border-[rgba(255,113,137,0.25)] text-[#ff7189] text-xs font-mono font-bold">
            Freezing Spray Warning
          </span>
        </div>
      </div>

      {/* Grid of Environmental Sensors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sensorReadings.map((sensor, i) => (
          <div key={i} className="panel glass p-5 rounded-[20px]">
            <div className="flex justify-between items-start">
              <span className="text-xs text-[#9297b1] font-medium">{sensor.name}</span>
              <span className="w-2 h-2 rounded-full bg-[#45e0d0] opacity-80" />
            </div>

            <div className="font-space text-2xl font-bold text-[#f1f2fa] mt-2 font-mono">
              {sensor.val}
            </div>

            <div className="flex justify-between items-center text-[11px] mt-2 pt-2 border-t border-[rgba(255,255,255,0.06)]">
              <span className="text-[#b7bad0]">{sensor.trend}</span>
              <span className="text-[#ffca72] font-medium text-[10px]">{sensor.alert}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Katabatic Wind Notice */}
      <div className="p-4 rounded-xl bg-[rgba(255,202,114,0.035)] border border-[rgba(255,202,114,0.18)] flex items-start gap-3 text-xs text-[#b7bad0]">
        <span className="text-[#ffca72] text-base mt-0.5">⚠</span>
        <div>
          <strong className="text-[#ffca72] block font-space font-bold">
            Katabatic Wind Advisory · Antarctic Plateau Drainage Alert
          </strong>
          <span>
            Gravity-driven cold air drainage flows from the Antarctic Continental Plateau into the western Weddell Sound are forecasted within the next 8–14 hours. Rapid localized wind accelerations exceeding 50 knots and sudden floe compression expected.
          </span>
        </div>
      </div>
    </div>
  );
};
