import { EnvironmentalCondition } from '../types';

function degreesToCardinal(deg: number): string {
  const directions = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW'
  ];
  const index = Math.round(((deg % 360) / 22.5)) % 16;
  return directions[index];
}

export interface LiveWeatherResult {
  airTempC: number;
  windSpeedKn: number;
  windGustKn: number;
  windDir: string;
  barometricPressureHpa: number;
  waterTempC: number;
  freezeUpRisk: 'Low' | 'Moderate' | 'High';
  isLive: boolean;
  timestamp: string;
}

/**
 * Fetches real-time meteorological conditions for Antarctic coordinates
 * using the Open-Meteo free weather API (no API key required).
 */
export async function fetchLiveAntarcticWeather(
  lat: number = -64.42,
  lon: number = -57.18
): Promise<Partial<EnvironmentalCondition> & { isLive: boolean }> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&wind_speed_unit=kn`;
    
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Weather API returned HTTP ${res.status}`);
    }

    const data = await res.json();
    const current = data.current;

    if (!current) {
      throw new Error('No current weather payload received');
    }

    const airTemp = Math.round(current.temperature_2m ?? -12);
    const windSpeed = Math.round(current.wind_speed_10m ?? 24);
    const windGusts = Math.round(current.wind_gusts_10m ?? windSpeed * 1.3);
    const windDir = degreesToCardinal(current.wind_direction_10m ?? 210);
    const pressure = Math.round(current.surface_pressure ?? 992);

    // Dynamic polar sea water calculation (saline ocean freezes around -1.8C)
    const waterTemp = airTemp < -10 ? -1.8 : -1.2;
    const freezeUpRisk: 'Low' | 'Moderate' | 'High' =
      airTemp < -15 || windSpeed > 30 ? 'High' : airTemp < -8 ? 'Moderate' : 'Low';

    return {
      airTempC: airTemp,
      windSpeedKn: windSpeed,
      windGustKn: windGusts,
      windDir: windDir,
      barometricPressureHpa: pressure,
      waterTempC: waterTemp,
      freezeUpRisk,
      isLive: true,
    };
  } catch (error) {
    console.warn('Could not fetch live weather from Open-Meteo, using fallback:', error);
    return {
      isLive: false,
    };
  }
}
