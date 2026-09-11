import React, { useState, useEffect } from 'react';
import { NavSection, MapLayers, Iceberg, VesselTelemetry, EnvironmentalCondition } from './types';
import {
  mockIcebergs,
  mockVessel,
  mockEnvironment,
  mockCorridors,
} from './data/mockData';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Hero } from './components/Hero';
import { KpiStrip } from './components/KpiStrip';
import { AntarcticMap } from './components/AntarcticMap';
import { EnvironmentalPanel } from './components/EnvironmentalPanel';
import { RoutePanel } from './components/RoutePanel';
import { SeaIceChart } from './components/SeaIceChart';
import { IcebergList } from './components/IcebergList';
import { SensorArrayLog } from './components/SensorArrayLog';
import { Footer } from './components/Footer';
import ChatWidget from './components/ChatWidget';
import { fetchLiveAntarcticWeather } from './services/weatherService';
import { getSettings, onSettingsChanged } from './services/settingsService';

// Section Views
import { IceConditionsView } from './components/views/IceConditionsView';
import { IcebergTrackingView } from './components/views/IcebergTrackingView';
import { RouteAnalysisView } from './components/views/RouteAnalysisView';
import { EnvironmentalDataView } from './components/views/EnvironmentalDataView';
import { VesselStatusView } from './components/views/VesselStatusView';
import { SystemSettingsView } from './components/views/SystemSettingsView';

export default function App() {
  const [currentSection, setCurrentSection] = useState<NavSection>('overview');
  const [systemMode, setSystemMode] = useState<'live' | 'simulation' | 'standby'>(() => {
    // Restore the operator's last session mode
    const saved = localStorage.getItem('polarnav-system-mode');
    return saved === 'simulation' || saved === 'standby' ? saved : 'live';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Persist mode across reloads
  useEffect(() => {
    localStorage.setItem('polarnav-system-mode', systemMode);
  }, [systemMode]);

  // Bridge night-dimming (Settings view) — dims the whole command shell
  const [bridgeDimming, setBridgeDimming] = useState<boolean>(() => getSettings().bridgeDimming);
  useEffect(() => onSettingsChanged((s) => setBridgeDimming(s.bridgeDimming)), []);

  // Map layer controls
  const [mapLayers, setMapLayers] = useState<MapLayers>({
    ice: true,
    bergs: true,
    route: true,
    driftVectors: false,
    grid: true,
    radarSweep: true,
    stations: true,
    bathymetry: false,
    dangerCones: true,
  });

  // Selected item states
  const [selectedIcebergId, setSelectedIcebergId] = useState<string | null>(null);
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>('corridor-a');

  // Operational telemetry state
  const [icebergs, setIcebergs] = useState<Iceberg[]>(mockIcebergs);
  const [vessel, setVessel] = useState<VesselTelemetry>(mockVessel);
  const [environment, setEnvironment] = useState<EnvironmentalCondition>(mockEnvironment);

  // Toggle map layers
  const handleToggleLayer = (layer: keyof MapLayers) => {
    setMapLayers((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  };

  // Toggle full screen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Ingest latest telemetry simulation
  const handleRefreshTelemetry = () => {
    setVessel((v) => ({
      ...v,
      speedKnots: Number((10.0 + (Math.random() * 1.5 - 0.7)).toFixed(1)),
      heading: 215 + Math.floor(Math.random() * 4 - 2),
      hullStrainPercent: Math.min(65, Math.max(25, v.hullStrainPercent + (Math.floor(Math.random() * 5) - 2))),
    }));

    setEnvironment((env) => ({
      ...env,
      windSpeedKn: Math.round(env.windSpeedKn + (Math.random() * 4 - 2)),
      airTempC: Number((env.airTempC + (Math.random() * 0.4 - 0.2)).toFixed(1)),
      seaIceCoveragePct: Math.round(env.seaIceCoveragePct + (Math.random() * 2 - 1)),
    }));
  };

  // Fetch real-world live Antarctic weather from Open-Meteo
  useEffect(() => {
    let isMounted = true;
    async function loadLiveWeather() {
      const liveData = await fetchLiveAntarcticWeather(-64.42, -57.18);
      if (isMounted && liveData.isLive) {
        setEnvironment((prev) => ({
          ...prev,
          airTempC: liveData.airTempC ?? prev.airTempC,
          windSpeedKn: liveData.windSpeedKn ?? prev.windSpeedKn,
          windGustKn: liveData.windGustKn ?? prev.windGustKn,
          windDir: liveData.windDir ?? prev.windDir,
          barometricPressureHpa: liveData.barometricPressureHpa ?? prev.barometricPressureHpa,
          waterTempC: liveData.waterTempC ?? prev.waterTempC,
          freezeUpRisk: liveData.freezeUpRisk ?? prev.freezeUpRisk,
        }));
      }
    }
    loadLiveWeather();
    const weatherInterval = setInterval(loadLiveWeather, 300000); // refresh every 5 mins
    return () => {
      isMounted = false;
      clearInterval(weatherInterval);
    };
  }, []);

  // Telemetry stream: cadence and jitter depend on the system mode.
  //   live       — gentle real-time drift every 8s (operational truth)
  //   simulation — accelerated 48h-style forecast playback every 2.5s, larger deltas
  //   standby    — displays frozen; sensors idle
  useEffect(() => {
    if (systemMode === 'standby') return;
    const tickMs = systemMode === 'simulation' ? 2500 : 8000;
    const drift = systemMode === 'simulation' ? 2.2 : 1;

    const streamInterval = setInterval(() => {
      // 1. Vessel dynamic fluctuations
      setVessel((v) => {
        const speedDelta = Number((Math.random() * 0.4 * drift - 0.2 * drift).toFixed(1));
        const newSpeed = Math.max(8.5, Math.min(systemMode === 'simulation' ? 14.5 : 12.5, Number((v.speedKnots + speedDelta).toFixed(1))));
        const headingDelta = Math.floor(Math.random() * 3 * drift - 1 * drift);
        const newHeading = (v.heading + headingDelta + 360) % 360;
        const strainDelta = Math.floor(Math.random() * 3 - 1);
        const newStrain = Math.min(58, Math.max(28, v.hullStrainPercent + strainDelta));

        return {
          ...v,
          speedKnots: newSpeed,
          heading: newHeading,
          hullStrainPercent: newStrain,
        };
      });

      // 2. Micro-updates to environment
      setEnvironment((env) => {
        const windDrift = Math.floor(Math.random() * 3 * drift - 1 * drift);
        return {
          ...env,
          windSpeedKn: Math.max(10, Math.min(45, env.windSpeedKn + windDrift)),
        };
      });

      // 3. Keep iceberg telemetry stable (no coordinate jitter)
      setIcebergs((prevBergs) =>
        prevBergs.map((b) => {
          const speedFlux = Number((Math.random() * 0.04 * drift - 0.02 * drift).toFixed(2));
          return {
            ...b,
            driftSpeedKnots: Math.max(0.4, Number((b.driftSpeedKnots + speedFlux).toFixed(1))),
          };
        })
      );
    }, tickMs);

    return () => clearInterval(streamInterval);
  }, [systemMode]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setSelectedIcebergId(null);
      }
      // M: cycle system mode (live -> simulation -> standby -> live)
      if ((e.key === 'm' || e.key === 'M') &&
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA') {
        setSystemMode((prev) => (prev === 'live' ? 'simulation' : prev === 'simulation' ? 'standby' : 'live'));
      }
      if (e.key === 'f' || e.key === 'F') {
        if (
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA'
        ) {
          handleToggleFullscreen();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className="min-h-screen flex bg-[#080914] text-[#f1f2fa] relative selection:bg-[#45e0d0] selection:text-[#080914] transition-[filter] duration-500"
      style={bridgeDimming ? { filter: 'brightness(0.55) saturate(0.85)' } : undefined}
    >
      {/* Background ambient radial gradients */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(circle at 10% 20%, rgba(139,124,255,0.06), transparent 45%),
            radial-gradient(circle at 85% 75%, rgba(69,224,208,0.05), transparent 45%)
          `,
        }}
      />

      {/* Sidebar Navigation */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={(sec) => {
          setCurrentSection(sec);
          setMobileMenuOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isMobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        systemMode={systemMode}
        onChangeSystemMode={setSystemMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 md:ml-[250px] p-4 sm:p-6 lg:p-[26px_30px] min-w-0 z-10 transition-all">
        {/* Top Header Bar */}
        <Topbar
          currentSection={currentSection}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          systemMode={systemMode}
        />

        {/* Section Route Switching */}
        {currentSection === 'overview' && (
          <div className="space-y-4">
            {/* Mission Hero Banner */}
            <Hero onRefreshData={handleRefreshTelemetry} />

            {/* Tactical Key Performance Indicator Strip (Bento Cards) */}
            <KpiStrip
              seaIceCoverage={environment.seaIceCoveragePct}
              icebergCount={icebergs.length}
              routeConfidence={89}
              vesselStatus={vessel.operationalState}
              ambientTempC={environment.airTempC}
              windKnots={environment.windSpeedKn}
            />

            {/* Middle Bento Grid: Tactical Map Projection (2.1fr) & Sensor/Route Alert Stack (1fr) */}
            <div className="grid grid-cols-1 xl:grid-cols-[2.1fr_1fr] gap-4 items-start">
              <AntarcticMap
                icebergs={icebergs}
                vessel={vessel}
                selectedIcebergId={selectedIcebergId}
                onSelectIceberg={setSelectedIcebergId}
                layers={mapLayers}
                onToggleLayer={handleToggleLayer}
                selectedCorridorId={selectedCorridorId}
                onSelectCorridor={setSelectedCorridorId}
              />

              <div className="flex flex-col gap-4">
                <EnvironmentalPanel environment={environment} />
                <RoutePanel
                  corridors={mockCorridors}
                  selectedCorridorId={selectedCorridorId}
                  onSelectCorridor={setSelectedCorridorId}
                  vesselSpeed={vessel.speedKnots}
                  fuelReserve={86}
                />
              </div>
            </div>

            {/* Environmental Sensor Array Log Wide Bento Card */}
            <SensorArrayLog
              barometerHpa={984}
              visibilityNm={0.8}
            />

            {/* Lower Bento Grid: Sea Ice Trend & Iceberg Objects List */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
              <SeaIceChart />
              <IcebergList
                icebergs={icebergs}
                selectedIcebergId={selectedIcebergId}
                onSelectIceberg={setSelectedIcebergId}
                onNavigateToCatalog={() => setCurrentSection('icebergs')}
              />
            </div>
          </div>
        )}

        {/* Dedicated Views */}
        {currentSection === 'ice' && (
          <IceConditionsView environment={environment} />
        )}

        {currentSection === 'icebergs' && (
          <IcebergTrackingView
            icebergs={icebergs}
            selectedIcebergId={selectedIcebergId}
            onSelectIceberg={setSelectedIcebergId}
          />
        )}

        {currentSection === 'routes' && (
          <RouteAnalysisView
            corridors={mockCorridors}
            selectedCorridorId={selectedCorridorId}
            onSelectCorridor={setSelectedCorridorId}
            icebergs={icebergs}
            vessel={vessel}
            selectedIcebergId={selectedIcebergId}
            onSelectIceberg={setSelectedIcebergId}
            layers={mapLayers}
            onToggleLayer={handleToggleLayer}
          />
        )}

        {currentSection === 'environment' && (
          <EnvironmentalDataView environment={environment} />
        )}

        {currentSection === 'vessel' && (
          <VesselStatusView vessel={vessel} />
        )}

        {currentSection === 'settings' && (
          <SystemSettingsView />
        )}

        {/* Footer */}
        <Footer />
      </main>

      {/* AI Decision Assistant Chat Widget with Real-time Situational Context */}
      <ChatWidget
        telemetry={{
          vessel,
          environment,
          icebergs,
          corridors: mockCorridors,
        }}
      />
    </div>
  );
}
