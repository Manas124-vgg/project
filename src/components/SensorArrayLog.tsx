import React, { useState, useEffect } from 'react';

interface SensorArrayLogProps {
  barometerHpa?: number;
  visibilityNm?: number;
}

export const SensorArrayLog: React.FC<SensorArrayLogProps> = ({
  barometerHpa = 984,
  visibilityNm = 0.8,
}) => {
  const [logTime, setLogTime] = useState<string>('14:22:00');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setLogTime(now.toISOString().substring(11, 19));
    };
    update();
    const timer = setInterval(update, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="bento-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 lg:p-5"
      id="sensor-array-log-tile"
    >
      <div className="flex-1 min-w-0">
        <div className="card-title mb-1 flex items-center gap-2">
          <span>Environmental Sensor Array Log</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#45e0d0] animate-pulse" />
        </div>
        <div className="mono text-[11px] opacity-85 truncate tracking-wide text-[#45e0d0]">
          [{logTime}] SONAR: OBSTACLE_CLEAR &nbsp;|&nbsp; [{logTime.slice(0, 5)}:14] RADAR: NEW_CONTACT_IB042 &nbsp;|&nbsp; [{logTime}] TELEMETRY_SYNC_OK
        </div>
      </div>

      <div className="flex items-center gap-6 self-end md:self-center shrink-0">
        <div className="text-right">
          <div className="card-title mb-0.5">Barometer</div>
          <div className="mono font-bold text-sm text-[#f1f2fa]">
            {barometerHpa} <span className="text-xs font-normal text-[#9297b1]">hPa</span>
          </div>
        </div>

        <div className="text-right">
          <div className="card-title mb-0.5">Visibility</div>
          <div className="mono font-bold text-sm text-[#45e0d0]">
            {visibilityNm} <span className="text-xs font-normal text-[#9297b1]">NM</span>
          </div>
        </div>
      </div>
    </div>
  );
};
