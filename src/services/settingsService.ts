// Mission settings persistence: previously these controls were pure local
// state that evaporated on reload and nothing consumed the values. Now they
// persist and broadcast so views (IceMap, App shell) can actually honor them.

export type DistanceUnit = 'nm' | 'km';
export type SpeedUnit = 'knots' | 'ms';

export interface MissionSettings {
  distanceUnit: DistanceUnit;
  speedUnit: SpeedUnit;
  cpaThresholdNm: number;
  sarRefreshMinutes: number;
  soundAlerts: boolean;
  bridgeDimming: boolean;
}

const STORAGE_KEY = 'polarnav-mission-settings';

export const DEFAULT_SETTINGS: MissionSettings = {
  distanceUnit: 'nm',
  speedUnit: 'knots',
  cpaThresholdNm: 25,
  sarRefreshMinutes: 30,
  soundAlerts: true,
  bridgeDimming: false,
};

type Listener = (s: MissionSettings) => void;
const listeners = new Set<Listener>();

export function getSettings(): MissionSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function updateSettings(patch: Partial<MissionSettings>): MissionSettings {
  const next = { ...getSettings(), ...patch };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (err) {
    console.error('Failed saving mission settings:', err);
  }
  listeners.forEach((l) => l(next));
  return next;
}

export function onSettingsChanged(cb: Listener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
