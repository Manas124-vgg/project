import React, { useState } from 'react';
import { timeSeriesTrend } from '../data/mockData';

export const SeaIceChart: React.FC = () => {
  const [activeMetric, setActiveMetric] = useState<'ice' | 'wind' | 'temp'>('ice');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Metric configs
  const config = {
    ice: {
      label: 'Sea-Ice Coverage (%)',
      color: '#45e0d0',
      gradientId: 'chartGradientIce',
      unit: '%',
      points: [
        { x: 0, y: 130, val: 78, label: 'T-10' },
        { x: 60, y: 116, val: 76, label: 'T-9' },
        { x: 120, y: 125, val: 74, label: 'T-8' },
        { x: 180, y: 93, val: 71, label: 'T-6' },
        { x: 240, y: 105, val: 69, label: 'T-5' },
        { x: 300, y: 80, val: 67, label: 'T-4' },
        { x: 360, y: 92, val: 66, label: 'T-3' },
        { x: 420, y: 63, val: 65, label: 'T-2' },
        { x: 480, y: 75, val: 65, label: 'T-1.5' },
        { x: 540, y: 48, val: 64.5, label: 'T-1' },
        { x: 600, y: 61, val: 64.2, label: 'T-0.5' },
        { x: 650, y: 40, val: 64, label: 'NOW' },
      ],
      areaPath: `
        M0 130
        L60 116
        L120 125
        L180 93
        L240 105
        L300 80
        L360 92
        L420 63
        L480 75
        L540 48
        L600 61
        L650 40
        L650 170
        L0 170 Z
      `,
      linePath: `
        M0 130
        L60 116
        L120 125
        L180 93
        L240 105
        L300 80
        L360 92
        L420 63
        L480 75
        L540 48
        L600 61
        L650 40
      `,
    },
    wind: {
      label: 'Surface Wind Velocity (kn)',
      color: '#c9c2ff',
      gradientId: 'chartGradientWind',
      unit: ' kn',
      points: [
        { x: 0, y: 60, val: 34, label: 'T-10' },
        { x: 120, y: 75, val: 32, label: 'T-8' },
        { x: 180, y: 85, val: 30, label: 'T-6' },
        { x: 300, y: 95, val: 29, label: 'T-4' },
        { x: 420, y: 105, val: 28, label: 'T-2' },
        { x: 650, y: 108, val: 28, label: 'NOW' },
      ],
      areaPath: `
        M0 60 L120 75 L180 85 L300 95 L420 105 L650 108 L650 170 L0 170 Z
      `,
      linePath: `
        M0 60 L120 75 L180 85 L300 95 L420 105 L650 108
      `,
    },
    temp: {
      label: 'Ambient Air Temp (°C)',
      color: '#ff7189',
      gradientId: 'chartGradientTemp',
      unit: '°C',
      points: [
        { x: 0, y: 140, val: -19.2, label: 'T-10' },
        { x: 120, y: 128, val: -18.5, label: 'T-8' },
        { x: 180, y: 115, val: -17.8, label: 'T-6' },
        { x: 300, y: 100, val: -17.1, label: 'T-4' },
        { x: 420, y: 90, val: -16.8, label: 'T-2' },
        { x: 650, y: 80, val: -16.4, label: 'NOW' },
      ],
      areaPath: `
        M0 140 L120 128 L180 115 L300 100 L420 90 L650 80 L650 170 L0 170 Z
      `,
      linePath: `
        M0 140 L120 128 L180 115 L300 100 L420 90 L650 80
      `,
    },
  }[activeMetric];

  return (
    <div className="bento-card p-5 overflow-hidden" id="environmental-trend-panel">
      {/* Header */}
      <div className="flex justify-between items-center px-5 py-3.5 border-b border-[rgba(165,177,224,0.15)] bg-[rgba(8,9,20,0.4)]">
        <div>
          <div className="card-title mb-0 flex items-center gap-2">
            <span>Environmental Trend Analysis</span>
            <span className="text-[10px] text-[#45e0d0] font-mono lowercase">({config.label})</span>
          </div>
          <div className="text-[#9297b1] text-[10px] mt-0.5">
            Synchronized sensor array time-series
          </div>
        </div>

        {/* Metric Selector Tabs & Badge */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 border border-[rgba(165,177,224,0.13)] rounded-lg p-0.5 bg-[rgba(255,255,255,0.02)]">
            <button
              onClick={() => setActiveMetric('ice')}
              className={`px-2 py-0.5 text-[9px] rounded font-medium transition-colors cursor-pointer ${
                activeMetric === 'ice' ? 'bg-[#45e0d0] text-[#080914]' : 'text-[#9297b1]'
              }`}
            >
              Ice %
            </button>
            <button
              onClick={() => setActiveMetric('wind')}
              className={`px-2 py-0.5 text-[9px] rounded font-medium transition-colors cursor-pointer ${
                activeMetric === 'wind' ? 'bg-[#c9c2ff] text-[#080914]' : 'text-[#9297b1]'
              }`}
            >
              Wind
            </button>
            <button
              onClick={() => setActiveMetric('temp')}
              className={`px-2 py-0.5 text-[9px] rounded font-medium transition-colors cursor-pointer ${
                activeMetric === 'temp' ? 'bg-[#ff7189] text-[#080914]' : 'text-[#9297b1]'
              }`}
            >
              Temp
            </button>
          </div>

          <span className="badge border border-[rgba(69,224,208,0.19)] text-[#45e0d0] bg-[rgba(69,224,208,0.06)] rounded-lg px-2 py-1.5 text-[9px] uppercase tracking-[1px]">
            Prototype
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="p-[17px_19px_20px] relative">
        <svg
          className="w-full h-[190px]"
          viewBox="0 0 650 190"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={config.color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={config.color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Background Grid Lines */}
          <g stroke="#ffffff" strokeOpacity="0.055">
            <line x1="0" y1="30" x2="650" y2="30" />
            <line x1="0" y1="70" x2="650" y2="70" />
            <line x1="0" y1="110" x2="650" y2="110" />
            <line x1="0" y1="150" x2="650" y2="150" />
          </g>

          {/* Area Fill */}
          <path
            className="transition-all duration-500"
            d={config.areaPath}
            fill="url(#chartGradient)"
            opacity="0.55"
          />

          {/* Line Stroke */}
          <path
            className="transition-all duration-500"
            d={config.linePath}
            fill="none"
            stroke={config.color}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 7px ${config.color}30)` }}
          />

          {/* Key Sample Points */}
          <g fill={config.color}>
            {config.points.map((pt, i) => (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={hoverIndex === i ? 5 : 3.5}
                  className="transition-all duration-150"
                />
                {hoverIndex === i && (
                  <text
                    x={pt.x}
                    y={pt.y - 8}
                    fill="#ffffff"
                    fontSize="9"
                    fontFamily="Space Grotesk"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {pt.val}
                    {config.unit}
                  </text>
                )}
              </g>
            ))}
          </g>

          {/* Time Labels */}
          <g fill="#737991" fontSize="9" fontFamily="DM Sans">
            <text x="0" y="185">T-10</text>
            <text x="125" y="185">T-8</text>
            <text x="250" y="185">T-6</text>
            <text x="375" y="185">T-4</text>
            <text x="500" y="185">T-2</text>
            <text x="620" y="185">NOW</text>
          </g>
        </svg>
      </div>
    </div>
  );
};
