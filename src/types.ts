export type NavSection =
  | 'overview'
  | 'ice'
  | 'icebergs'
  | 'routes'
  | 'environment'
  | 'vessel'
  | 'settings';

export type HazardLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface Iceberg {
  id: string;
  code: string;
  name: string;
  sizeCategory: 'Small' | 'Medium' | 'Large' | 'Very Large' | 'Giant Tabular';
  dimensions: string; // e.g. "4.2 km × 1.8 km"
  draftM: number;
  lat: number;
  lon: number;
  latDisplay: string;
  lonDisplay: string;
  svgX: number;
  svgY: number;
  driftSpeedKnots: number;
  driftHeadingDeg: number;
  distanceNm: number;
  hazardLevel: HazardLevel;
  status: string;
  radarCrossSection: string;
  notes: string;
}

export interface MapLayers {
  ice: boolean;
  bergs: boolean;
  route: boolean;
  driftVectors: boolean;
  grid: boolean;
  radarSweep?: boolean;
  stations?: boolean;
  bathymetry?: boolean;
  dangerCones?: boolean;
}

export interface ResearchStation {
  id: string;
  code: string;
  name: string;
  country: string;
  countryCode: string;
  flag: string;
  latDisplay: string;
  lonDisplay: string;
  svgX: number;
  svgY: number;
  personnelWinter: number;
  personnelSummer: number;
  mission: string;
  establishedYear: number;
  elevationM: number;
}

export interface MapWaypoint {
  id: string;
  name: string;
  corridorId: string;
  lat: string;
  lon: string;
  svgX: number;
  svgY: number;
  distNm: number;
  depthM: number;
  iceThicknessM: number;
  eta: string;
  status: 'Passed' | 'Next' | 'En Route' | 'Planned' | 'Destination';
}


export interface VesselTelemetry {
  name: string;
  type: string;
  callSign: string;
  flag: string;
  iceClass: string;
  operationalState: 'NOMINAL' | 'ADVISORY' | 'RESTRICTED';
  heading: number;
  speedKnots: number;
  destination: string;
  distanceRemainingNm: number;
  etaHours: number;
  fuelRemainingPercent: number;
  hullStrainPercent: number;
  engineLoadPercent: number;
  position: {
    lat: string;
    lon: string;
    svgX: number;
    svgY: number;
  };
}

export interface EnvironmentalCondition {
  seaIceCoveragePct: number;
  seaIceStatus: string;
  seaIceThicknessM: number;
  oceanCurrentSpeedKn: number;
  oceanCurrentDir: string;
  windSpeedKn: number;
  windGustKn: number;
  windDir: string;
  visibilityKm: number;
  visibilityStatus: string;
  airTempC: number;
  waterTempC: number;
  barometricPressureHpa: number;
  freezeUpRisk: 'Low' | 'Moderate' | 'High';
}

export interface RouteCorridor {
  id: string;
  name: string;
  status: 'Recommended' | 'Caution' | 'Contingency';
  distanceNm: number;
  etaFormatted: string;
  fuelConsumptionPct: number;
  riskScore: 'Low' | 'Moderate' | 'High' | 'Validate';
  description: string;
  packIceThicknessAvg: number;
  icebreakerEscortReq: boolean;
  waypointsCount: number;
}
