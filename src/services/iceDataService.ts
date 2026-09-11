export interface IceGridPoint {
  lat: number;
  lon: number;
  concentration: number;
}

export interface Iceberg {
  id: string;
  lat: number;
  lon: number;
  sizeKm: number;
}

export interface SeaIceData {
  generated: string;
  region: string;
  gridPoints: IceGridPoint[];
  icebergs: Iceberg[];
}

export async function getSeaIceData(): Promise<IceGridPoint[]> {
  try {
    const res = await fetch("/data/seaIce.json");
    if (!res.ok) throw new Error("No real data file found");
    const data = await res.json();
    return data.gridPoints;
  } catch {
    // Falls back to mock data if the real file isn't there yet —
    // keeps your app working even before you've run the Python script
    const mock = await import("../data/mockSeaIce.json");
    return mock.gridPoints;
  }
}

export async function getIcebergs(): Promise<Iceberg[]> {
  try {
    const res = await fetch("/data/seaIce.json");
    if (res.ok) {
      const data = await res.json();
      if (data.icebergs && data.icebergs.length > 0) {
        return data.icebergs;
      }
    }
  } catch {
    // Fallback to mock
  }
  const mock = await import("../data/mockSeaIce.json");
  return mock.icebergs;
}

export async function getFullSeaIceDataset(): Promise<SeaIceData> {
  try {
    const res = await fetch("/data/seaIce.json");
    if (res.ok) {
      const data = await res.json();
      if (data.gridPoints) {
        return {
          generated: data.generated || new Date().toISOString(),
          region: data.region || "Weddell Sea approach",
          gridPoints: data.gridPoints,
          icebergs: data.icebergs || (await import("../data/mockSeaIce.json")).icebergs,
        };
      }
    }
  } catch {
    // Fallback to mock
  }
  const mock = await import("../data/mockSeaIce.json");
  return mock as unknown as SeaIceData;
}

export default {
  getSeaIceData,
  getIcebergs,
  getFullSeaIceDataset,
};