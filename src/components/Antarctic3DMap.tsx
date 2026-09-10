import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Iceberg, VesselTelemetry, ResearchStation, MapWaypoint } from '../types';
import { researchStations, corridorWaypoints, corridors } from '../data/mockData';

interface Antarctic3DMapProps {
  icebergs: Iceberg[];
  vessel: VesselTelemetry;
  selectedIcebergId: string | null;
  onSelectIceberg: (id: string | null) => void;
  selectedCorridorId: string;
  onSelectCorridor?: (id: string) => void;
  onSelectStation?: (station: ResearchStation | null) => void;
  onSelectWaypoint?: (wp: MapWaypoint | null) => void;
  onToggleVesselCard?: () => void;
}

// Coordinate mapping helper: converts 2D projection coords (0..900, 0..520) into 3D world space (X, Z)
const svgTo3D = (svgX: number, svgY: number): { x: number; z: number } => {
  return {
    x: (svgX - 450) * 0.28,
    z: (svgY - 260) * 0.28,
  };
};

export const Antarctic3DMap: React.FC<Antarctic3DMapProps> = ({
  icebergs,
  vessel,
  selectedIcebergId,
  onSelectIceberg,
  selectedCorridorId,
  onSelectCorridor,
  onSelectStation,
  onSelectWaypoint,
  onToggleVesselCard,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // 3D Scene Interactive Controls State
  const [cameraPreset, setCameraPreset] = useState<'orbit' | 'vessel' | 'peninsula' | 'iceberg'>('orbit');
  const [simulationHour, setSimulationHour] = useState<number>(0);
  const [isPlayingSimulation, setIsPlayingSimulation] = useState<boolean>(false);
  const [seasonalIceMonth, setSeasonalIceMonth] = useState<number>(2); // 2 = Feb (Min), 9 = Sept (Max)
  const [showUnderKeels, setShowUnderKeels] = useState<boolean>(true);
  const [showSeasonalOverlay, setShowSeasonalOverlay] = useState<boolean>(false);

  // Refs for animation loop and Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  // Dynamic 3D Object Refs
  const vesselGroupRef = useRef<THREE.Group | null>(null);
  const icebergMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const seaIceMeshRef = useRef<THREE.Mesh | null>(null);
  const routeLineRef = useRef<THREE.Line | null>(null);
  const waypointPillarsRef = useRef<THREE.Group | null>(null);
  const proximityAlertRef = useRef<THREE.Mesh | null>(null);

  // Camera Orbit State
  const isInteractingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isRightClickRef = useRef<boolean>(false);
  const sphericalRef = useRef<{ radius: number; theta: number; phi: number }>({
    radius: 140,
    theta: -Math.PI / 4,
    phi: Math.PI / 3.5, // 50 degrees down from vertical
  });
  const targetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Current corridor waypoints
  const activeWaypoints = useMemo(() => {
    return corridorWaypoints[selectedCorridorId] || corridorWaypoints['corridor-a'];
  }, [selectedCorridorId]);

  // Selected iceberg
  const selectedBerg = useMemo(() => {
    return icebergs.find((b) => b.id === selectedIcebergId) || null;
  }, [icebergs, selectedIcebergId]);

  // Calculate simulated vessel position in 3D
  const currentVessel3D = useMemo(() => {
    if (simulationHour === 0 || activeWaypoints.length < 2) {
      const pos = svgTo3D(vessel.position.svgX, vessel.position.svgY);
      return { x: pos.x, z: pos.z, heading: vessel.heading };
    }

    const progressRatio = Math.min(1, simulationHour / 32);
    const totalSegments = activeWaypoints.length - 1;
    const segmentProgress = progressRatio * totalSegments;
    const currentSegIndex = Math.min(Math.floor(segmentProgress), totalSegments - 1);
    const segFraction = segmentProgress - currentSegIndex;

    const wp1 = activeWaypoints[currentSegIndex];
    const wp2 = activeWaypoints[currentSegIndex + 1];

    const currentSvgX = wp1.svgX + (wp2.svgX - wp1.svgX) * segFraction;
    const currentSvgY = wp1.svgY + (wp2.svgY - wp1.svgY) * segFraction;

    const angleDeg = (Math.atan2(wp2.svgY - wp1.svgY, wp2.svgX - wp1.svgX) * 180) / Math.PI + 90;
    const pos = svgTo3D(currentSvgX, currentSvgY);

    return { x: pos.x, z: pos.z, heading: Math.round((angleDeg + 360) % 360) };
  }, [vessel, simulationHour, activeWaypoints]);

  // Automated 48h simulation playback
  useEffect(() => {
    if (!isPlayingSimulation) return;
    const interval = setInterval(() => {
      setSimulationHour((prev) => {
        if (prev === 0) return 6;
        if (prev === 6) return 12;
        if (prev === 12) return 24;
        if (prev === 24) return 48;
        return 0;
      });
    }, 1800);
    return () => clearInterval(interval);
  }, [isPlayingSimulation]);

  // 1. Initialize Three.js WebGL Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 900;
    const height = container.clientHeight || 540;

    // SCENE
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x060c18);
    scene.fog = new THREE.FogExp2(0x071120, 0.0035);

    // CAMERA
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    cameraRef.current = camera;

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.replaceChildren(renderer.domElement);

    // LIGHTING
    // Ambient soft polar light
    const ambientLight = new THREE.AmbientLight(0x8ec7f5, 0.7);
    scene.add(ambientLight);

    // Sun / Low polar directional sunlight with shadows
    const sunLight = new THREE.DirectionalLight(0xfff3db, 1.4);
    sunLight.position.set(120, 160, 90);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 400;
    sunLight.shadow.camera.left = -120;
    sunLight.shadow.camera.right = 120;
    sunLight.shadow.camera.top = 120;
    sunLight.shadow.camera.bottom = -120;
    scene.add(sunLight);

    // Subtle blue rim light from South Pole
    const rimLight = new THREE.DirectionalLight(0x45e0d0, 0.5);
    rimLight.position.set(-100, 40, -100);
    scene.add(rimLight);

    // 2. Translucent Ocean Surface (Y = 0)
    const oceanGeo = new THREE.PlaneGeometry(360, 360, 64, 64);
    const oceanMat = new THREE.MeshPhysicalMaterial({
      color: 0x09223d,
      roughness: 0.15,
      metalness: 0.1,
      transmission: 0.65, // see-through to underwater iceberg keels!
      ior: 1.333,
      transparent: true,
      opacity: 0.88,
    });
    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    oceanMesh.rotation.x = -Math.PI / 2;
    oceanMesh.position.y = 0;
    oceanMesh.receiveShadow = true;
    scene.add(oceanMesh);

    // Ocean Seabed / Abyssal Floor (Y = -24)
    const seabedGeo = new THREE.PlaneGeometry(380, 380, 32, 32);
    const seabedMat = new THREE.MeshStandardMaterial({
      color: 0x040912,
      roughness: 0.9,
      metalness: 0.1,
    });
    const seabedMesh = new THREE.Mesh(seabedGeo, seabedMat);
    seabedMesh.rotation.x = -Math.PI / 2;
    seabedMesh.position.y = -24;
    scene.add(seabedMesh);

    // 3. 3D Antarctic Ice Sheet Continent Elevation Mesh
    // Procedural polar topography: central high polar plateau (up to +18 elevation),
    // sloping down to coastal ice cliffs (+3.5), and protruding peninsula
    const continentGeo = new THREE.PlaneGeometry(160, 140, 96, 96);
    const posAttr = continentGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const u = posAttr.getX(i);
      const v = posAttr.getY(i);
      const distFromCenter = Math.sqrt(u * u + v * v);

      // Antarctic Peninsula protrusion in upper right quadrant (u: 15..55, v: 0..50)
      const isPeninsula = u > 15 && u < 55 && v > -10 && v < 55;
      let elevation = 0;

      if (distFromCenter < 48) {
        // High inland ice dome (Dome C / South Pole Plateau)
        const domeFalloff = Math.cos((distFromCenter / 48) * (Math.PI / 2));
        elevation = 2.5 + Math.pow(domeFalloff, 1.4) * 14.5;
        // Natural ruggedness
        elevation += (Math.sin(u * 0.18) + Math.cos(v * 0.18)) * 0.4;
      } else if (isPeninsula) {
        // Mountainous peninsula spine
        const spineDist = Math.abs(v - (u * 0.9 - 5));
        if (spineDist < 16) {
          elevation = 2.0 + (16 - spineDist) * 0.45 + (Math.sin(v * 0.4) * 0.6);
        }
      }

      // Coastal cliff drop-off
      posAttr.setZ(i, Math.max(0, elevation));
    }
    continentGeo.computeVertexNormals();

    const continentMat = new THREE.MeshStandardMaterial({
      color: 0xf1f8fc,
      roughness: 0.65,
      metalness: 0.05,
      flatShading: false,
    });
    const continentMesh = new THREE.Mesh(continentGeo, continentMat);
    continentMesh.rotation.x = -Math.PI / 2;
    continentMesh.position.set(0, 0, 0);
    continentMesh.receiveShadow = true;
    continentMesh.castShadow = true;
    scene.add(continentMesh);

    // Floating Ice Shelves (Ross & Larsen C) - Flat sheets at Y = 0.5
    const shelfGeo = new THREE.CircleGeometry(24, 32, Math.PI * 0.8, Math.PI * 0.55);
    const shelfMat = new THREE.MeshStandardMaterial({
      color: 0xd6effb,
      roughness: 0.4,
      transparent: true,
      opacity: 0.92,
    });
    const rossShelf = new THREE.Mesh(shelfGeo, shelfMat);
    rossShelf.rotation.x = -Math.PI / 2;
    rossShelf.position.set(-18, 0.4, -12);
    scene.add(rossShelf);

    // 4. Seasonal Sea Ice Extent Dynamic Mesh
    const seaIceGeo = new THREE.RingGeometry(38, 95, 48, 8);
    const seaIceMat = new THREE.MeshStandardMaterial({
      color: 0xcfeaf8,
      roughness: 0.7,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
    });
    const seaIceMesh = new THREE.Mesh(seaIceGeo, seaIceMat);
    seaIceMesh.rotation.x = -Math.PI / 2;
    seaIceMesh.position.set(0, 0.2, 0);
    seaIceMesh.visible = false;
    scene.add(seaIceMesh);
    seaIceMeshRef.current = seaIceMesh;

    // 5. 3D Research Vessel Group
    const vesselGroup = new THREE.Group();
    vesselGroupRef.current = vesselGroup;

    // Hull (Polar icebreaker shape)
    const hullGeo = new THREE.ConeGeometry(2.0, 6.0, 4);
    hullGeo.rotateX(Math.PI / 2);
    hullGeo.scale(0.9, 0.5, 1.2);
    const hullMat = new THREE.MeshStandardMaterial({ color: 0x22364c, metalness: 0.3, roughness: 0.4 });
    const hullMesh = new THREE.Mesh(hullGeo, hullMat);
    hullMesh.position.y = 0.4;
    vesselGroup.add(hullMesh);

    // Cabin / Superstructure
    const cabinGeo = new THREE.BoxGeometry(1.4, 1.2, 2.2);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x45e0d0, emissive: 0x45e0d0, emissiveIntensity: 0.2 });
    const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
    cabinMesh.position.set(0, 1.2, -0.4);
    vesselGroup.add(cabinMesh);

    // Mast & Beacon Light
    const mastGeo = new THREE.CylinderGeometry(0.1, 0.1, 2.2);
    const mastMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const mastMesh = new THREE.Mesh(mastGeo, mastMat);
    mastMesh.position.set(0, 2.3, -0.4);
    vesselGroup.add(mastMesh);

    // Beacon light sphere
    const beaconGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x45e0d0 });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconMesh.position.set(0, 3.4, -0.4);
    vesselGroup.add(beaconMesh);

    // Set initial vessel position
    const initVesselPos = svgTo3D(vessel.position.svgX, vessel.position.svgY);
    vesselGroup.position.set(initVesselPos.x, 0, initVesselPos.z);
    vesselGroup.rotation.y = (-vessel.heading * Math.PI) / 180;
    scene.add(vesselGroup);

    // 6. 3D Proximity Warning Cylinder Dome (for collision alerts)
    const alertGeo = new THREE.CylinderGeometry(8, 8, 4, 24, 1, true);
    const alertMat = new THREE.MeshBasicMaterial({
      color: 0xff5064,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      wireframe: true,
    });
    const proximityAlert = new THREE.Mesh(alertGeo, alertMat);
    proximityAlert.position.set(initVesselPos.x, 2, initVesselPos.z);
    proximityAlert.visible = false;
    scene.add(proximityAlert);
    proximityAlertRef.current = proximityAlert;

    // 7. Research Stations 3D Pillars & Flags
    const stationsGroup = new THREE.Group();
    researchStations.forEach((st) => {
      const pos = svgTo3D(st.svgX, st.svgY);
      const stGroup = new THREE.Group();
      stGroup.position.set(pos.x, 0.2, pos.z);

      // Station beacon pillar
      const pillarGeo = new THREE.CylinderGeometry(0.3, 0.5, 3.5, 8);
      const pillarMat = new THREE.MeshStandardMaterial({
        color: st.country === 'India' ? 0xff9933 : 0x6ddcff,
        emissive: st.country === 'India' ? 0xff9933 : 0x6ddcff,
        emissiveIntensity: 0.3,
      });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.y = 1.75;
      stGroup.add(pillar);

      // Flag banner plate
      const flagPlateGeo = new THREE.PlaneGeometry(2.4, 1.4);
      const flagPlateMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      const flagPlate = new THREE.Mesh(flagPlateGeo, flagPlateMat);
      flagPlate.position.set(1.2, 3.2, 0);
      stGroup.add(flagPlate);

      // Add userData for raycasting clicks
      pillar.userData = { type: 'station', data: st };
      flagPlate.userData = { type: 'station', data: st };

      stationsGroup.add(stGroup);
    });
    scene.add(stationsGroup);

    // 8. 3D Navigation Route Spline & Waypoint Beacons
    const waypointPillars = new THREE.Group();
    waypointPillarsRef.current = waypointPillars;
    scene.add(waypointPillars);

    // 9. Render & Animation Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Update camera position from spherical coordinates
      const { radius, theta, phi } = sphericalRef.current;
      const target = targetRef.current;

      camera.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = target.y + radius * Math.cos(phi);
      camera.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(target);

      // Billboard all station flags towards camera
      stationsGroup.children.forEach((sg) => {
        const flag = sg.children[1];
        if (flag) flag.quaternion.copy(camera.quaternion);
      });

      // Pulse proximity alert if active
      if (proximityAlertRef.current && proximityAlertRef.current.visible) {
        proximityAlertRef.current.rotation.y += 0.02;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 10. Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update 3D Iceberg Meshes when icebergs or simulation hour changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear old iceberg groups
    icebergMeshesRef.current.forEach((grp) => scene.remove(grp));
    icebergMeshesRef.current.clear();

    icebergs.forEach((berg) => {
      // Calculate projected position in 3D
      const rad = (berg.driftHeadingDeg * Math.PI) / 180;
      const simDeltaX = Math.sin(rad) * (berg.driftSpeedKnots * simulationHour * 0.28);
      const simDeltaY = -Math.cos(rad) * (berg.driftSpeedKnots * simulationHour * 0.28);

      const pos = svgTo3D(berg.svgX + simDeltaX, berg.svgY + simDeltaY);
      const isSelected = berg.id === selectedIcebergId;

      const bergGroup = new THREE.Group();
      bergGroup.position.set(pos.x, 0, pos.z);

      // Above-Water Crown (Faceted irregular ice geometry)
      const crownGeo = new THREE.ConeGeometry(2.5, 3.8, 6);
      crownGeo.scale(1.2, 1.0, 0.9);
      const crownMat = new THREE.MeshStandardMaterial({
        color: isSelected ? 0xffffff : 0xffca72,
        roughness: 0.35,
        metalness: 0.1,
        emissive: isSelected ? 0xffca72 : 0x000000,
        emissiveIntensity: isSelected ? 0.3 : 0,
      });
      const crownMesh = new THREE.Mesh(crownGeo, crownMat);
      crownMesh.position.y = 1.9;
      crownMesh.castShadow = true;
      crownMesh.userData = { type: 'iceberg', id: berg.id };
      bergGroup.add(crownMesh);

      // Submerged Keel (Massive underwater ice draft extending down!)
      if (showUnderKeels) {
        const keelDepth = Math.min(18, (berg.draftM / 240) * 12 + 4);
        const keelGeo = new THREE.ConeGeometry(3.5, keelDepth, 6);
        keelGeo.rotateX(Math.PI);
        const keelMat = new THREE.MeshPhysicalMaterial({
          color: 0x4aa3df,
          roughness: 0.4,
          transmission: 0.3,
          transparent: true,
          opacity: 0.55,
        });
        const keelMesh = new THREE.Mesh(keelGeo, keelMat);
        keelMesh.position.y = -keelDepth / 2;
        bergGroup.add(keelMesh);
      }

      // Drift Vector Arrow in 3D
      const dirVector = new THREE.Vector3(Math.sin(rad), 0, -Math.cos(rad));
      const arrowHelper = new THREE.ArrowHelper(dirVector, new THREE.Vector3(0, 0.5, 0), 6, 0xffca72, 1.5, 0.8);
      bergGroup.add(arrowHelper);

      scene.add(bergGroup);
      icebergMeshesRef.current.set(berg.id, bergGroup);
    });
  }, [icebergs, simulationHour, selectedIcebergId, showUnderKeels]);

  // Update 3D Vessel Position & Heading
  useEffect(() => {
    if (!vesselGroupRef.current) return;
    vesselGroupRef.current.position.set(currentVessel3D.x, 0, currentVessel3D.z);
    vesselGroupRef.current.rotation.y = (-currentVessel3D.heading * Math.PI) / 180;

    // Check collision proximity alert in 3D
    if (proximityAlertRef.current) {
      let isNear = false;
      icebergs.forEach((b) => {
        const rad = (b.driftHeadingDeg * Math.PI) / 180;
        const simDeltaX = Math.sin(rad) * (b.driftSpeedKnots * simulationHour * 0.28);
        const simDeltaY = -Math.cos(rad) * (b.driftSpeedKnots * simulationHour * 0.28);
        const bergPos = svgTo3D(b.svgX + simDeltaX, b.svgY + simDeltaY);

        const dist = Math.hypot(bergPos.x - currentVessel3D.x, bergPos.z - currentVessel3D.z);
        if (dist < 12) isNear = true;
      });

      proximityAlertRef.current.visible = isNear;
      proximityAlertRef.current.position.set(currentVessel3D.x, 2, currentVessel3D.z);
    }
  }, [currentVessel3D, icebergs, simulationHour]);

  // Update 3D Route Spline & Waypoints
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (routeLineRef.current) scene.remove(routeLineRef.current);
    if (waypointPillarsRef.current) {
      waypointPillarsRef.current.clear();
    }

    // Generate smooth 3D spline through active waypoints
    const points3D = activeWaypoints.map((wp) => {
      const pos = svgTo3D(wp.svgX, wp.svgY);
      return new THREE.Vector3(pos.x, 0.6, pos.z);
    });

    if (points3D.length >= 2) {
      const curve = new THREE.CatmullRomCurve3(points3D);
      const splinePoints = curve.getPoints(80);
      const routeGeo = new THREE.BufferGeometry().setFromPoints(splinePoints);
      const routeColor = selectedCorridorId === 'corridor-b' ? 0xffca72 : selectedCorridorId === 'corridor-c' ? 0x8b7cff : 0x45e0d0;
      const routeMat = new THREE.LineBasicMaterial({ color: routeColor, linewidth: 2 });
      const routeLine = new THREE.Line(routeGeo, routeMat);
      scene.add(routeLine);
      routeLineRef.current = routeLine;
    }

    // Add vertical waypoint light pillars
    activeWaypoints.forEach((wp) => {
      const pos = svgTo3D(wp.svgX, wp.svgY);
      const pillarGeo = new THREE.CylinderGeometry(0.2, 0.2, 8, 8);
      const pillarMat = new THREE.MeshBasicMaterial({
        color: wp.status === 'Destination' ? 0xffca72 : 0x45e0d0,
        transparent: true,
        opacity: 0.45,
      });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(pos.x, 4, pos.z);
      pillar.userData = { type: 'waypoint', data: wp };
      waypointPillarsRef.current?.add(pillar);
    });
  }, [activeWaypoints, selectedCorridorId]);

  // Update Seasonal Sea Ice Mesh Extent
  useEffect(() => {
    if (!seaIceMeshRef.current) return;
    seaIceMeshRef.current.visible = showSeasonalOverlay;
    // Scale radius: Feb (min) is radius ~45, Sept (max) is radius ~105
    const scaleFactor = 0.5 + (seasonalIceMonth / 12) * 1.1;
    seaIceMeshRef.current.scale.set(scaleFactor, scaleFactor, 1);
  }, [seasonalIceMonth, showSeasonalOverlay]);

  // Camera Presets
  const applyCameraPreset = (preset: 'orbit' | 'vessel' | 'peninsula' | 'iceberg') => {
    setCameraPreset(preset);
    if (preset === 'orbit') {
      targetRef.current.set(0, 0, 0);
      sphericalRef.current = { radius: 140, theta: -Math.PI / 4, phi: Math.PI / 3.5 };
    } else if (preset === 'vessel') {
      targetRef.current.set(currentVessel3D.x, 0, currentVessel3D.z);
      sphericalRef.current = { radius: 45, theta: (-currentVessel3D.heading * Math.PI) / 180 + Math.PI, phi: Math.PI / 3.2 };
    } else if (preset === 'peninsula') {
      targetRef.current.set(35, 0, 30);
      sphericalRef.current = { radius: 75, theta: -Math.PI / 3, phi: Math.PI / 4 };
    } else if (preset === 'iceberg' && selectedBerg) {
      const pos = svgTo3D(selectedBerg.svgX, selectedBerg.svgY);
      targetRef.current.set(pos.x, 0, pos.z);
      sphericalRef.current = { radius: 35, theta: 0, phi: Math.PI / 3 };
    }
  };

  // Mouse / Pointer Event Handlers for 3D Orbiting & Raycasting
  const handlePointerDown = (e: React.PointerEvent) => {
    isInteractingRef.current = true;
    isRightClickRef.current = e.button === 2;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isInteractingRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    dragStartRef.current = { x: e.clientX, y: e.clientY };

    if (isRightClickRef.current) {
      // Pan camera target in X/Z plane
      const panSpeed = 0.18;
      targetRef.current.x -= deltaX * panSpeed;
      targetRef.current.z += deltaY * panSpeed;
    } else {
      // Orbit rotation
      const rotSpeed = 0.006;
      sphericalRef.current.theta -= deltaX * rotSpeed;
      sphericalRef.current.phi = Math.max(0.15, Math.min(Math.PI / 2.1, sphericalRef.current.phi - deltaY * rotSpeed));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isInteractingRef.current = false;

    // Raycast on click to select 3D objects
    if (!mountRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);

    if (intersects.length > 0) {
      for (const hit of intersects) {
        const data = hit.object.userData;
        if (data?.type === 'iceberg') {
          onSelectIceberg(data.id);
          break;
        } else if (data?.type === 'station') {
          onSelectStation?.(data.data);
          break;
        } else if (data?.type === 'waypoint') {
          onSelectWaypoint?.(data.data);
          break;
        }
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
    sphericalRef.current.radius = Math.max(20, Math.min(240, sphericalRef.current.radius * zoomFactor));
  };

  return (
    <div className="relative w-full h-[540px] overflow-hidden select-none bg-[#060c18]">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* 3D Camera Preset Toolbar */}
      <div className="absolute top-3 left-4 z-20 flex items-center gap-1.5 bg-[rgba(6,12,24,0.92)] border border-[rgba(165,177,224,0.18)] px-2.5 py-1.5 rounded-xl text-xs backdrop-blur-md">
        <span className="text-[10px] uppercase font-mono text-[#8892b0] pr-1">3D Views:</span>
        <button
          onClick={() => applyCameraPreset('orbit')}
          className={`px-2 py-1 rounded-md text-[10px] font-mono transition-all cursor-pointer ${
            cameraPreset === 'orbit' ? 'bg-[rgba(69,224,208,0.2)] text-[#45e0d0] border border-[rgba(69,224,208,0.4)]' : 'text-[#8892b0] hover:text-white'
          }`}
        >
          Polar Orbit
        </button>
        <button
          onClick={() => applyCameraPreset('vessel')}
          className={`px-2 py-1 rounded-md text-[10px] font-mono transition-all cursor-pointer ${
            cameraPreset === 'vessel' ? 'bg-[rgba(69,224,208,0.2)] text-[#45e0d0] border border-[rgba(69,224,208,0.4)]' : 'text-[#8892b0] hover:text-white'
          }`}
        >
          Follow Ship
        </button>
        <button
          onClick={() => applyCameraPreset('peninsula')}
          className={`px-2 py-1 rounded-md text-[10px] font-mono transition-all cursor-pointer ${
            cameraPreset === 'peninsula' ? 'bg-[rgba(69,224,208,0.2)] text-[#45e0d0] border border-[rgba(69,224,208,0.4)]' : 'text-[#8892b0] hover:text-white'
          }`}
        >
          Weddell Lead
        </button>
      </div>

      {/* 3D Feature Toggles (Top Right) */}
      <div className="absolute top-3 right-4 z-20 flex items-center gap-2 bg-[rgba(6,12,24,0.92)] border border-[rgba(165,177,224,0.18)] px-3 py-1.5 rounded-xl text-xs backdrop-blur-md">
        <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-mono text-[#b7bad0]">
          <input
            type="checkbox"
            checked={showUnderKeels}
            onChange={(e) => setShowUnderKeels(e.target.checked)}
            className="accent-[#45e0d0] cursor-pointer"
          />
          <span>Underwater Draft Keels</span>
        </label>
        <span className="text-[rgba(255,255,255,0.15)]">|</span>
        <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-mono text-[#b7bad0]">
          <input
            type="checkbox"
            checked={showSeasonalOverlay}
            onChange={(e) => setShowSeasonalOverlay(e.target.checked)}
            className="accent-[#6ddcff] cursor-pointer"
          />
          <span>Seasonal Ice Dynamics</span>
        </label>
      </div>

      {/* Seasonal Sea Ice Changes Slider (if enabled) */}
      {showSeasonalOverlay && (
        <div className="absolute top-14 right-4 z-20 w-64 bg-[rgba(6,12,24,0.94)] border border-[rgba(109,220,255,0.3)] p-3 rounded-xl backdrop-blur-md text-xs">
          <div className="flex justify-between items-center text-[10px] font-mono mb-1.5">
            <span className="text-[#6ddcff] font-bold">Sea Ice Extent:</span>
            <span className="text-[#f1f2fa]">
              {seasonalIceMonth === 2 ? 'Feb (Min 2.1M km²)' : seasonalIceMonth === 9 ? 'Sept (Max 18.8M km²)' : `Month ${seasonalIceMonth}`}
            </span>
          </div>
          <input
            type="range"
            min="2"
            max="9"
            step="1"
            value={seasonalIceMonth}
            onChange={(e) => setSeasonalIceMonth(Number(e.target.value))}
            className="w-full accent-[#6ddcff] cursor-pointer"
          />
          <div className="flex justify-between text-[8px] font-mono text-[#8892b0] mt-1">
            <span>Summer Min (Feb)</span>
            <span>Winter Max (Sept)</span>
          </div>
        </div>
      )}

      {/* 3D Navigation Controls Hint (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-[rgba(6,12,24,0.85)] border border-[rgba(165,177,224,0.14)] px-2.5 py-1 rounded-lg text-[9px] font-mono text-[#8892b0] pointer-events-none">
        <span>Left-click: Orbit 360°</span>
        <span>·</span>
        <span>Right-click: Pan</span>
        <span>·</span>
        <span>Scroll: Zoom In/Out</span>
      </div>

      {/* Live 48h Drift Simulation Scrubber (Bottom Right) */}
      <div className="absolute right-4 bottom-4 z-20 flex items-center gap-2 bg-[rgba(6,12,24,0.92)] border border-[rgba(165,177,224,0.18)] p-1.5 rounded-xl text-xs backdrop-blur-md">
        <button
          onClick={() => setIsPlayingSimulation(!isPlayingSimulation)}
          className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs cursor-pointer transition-all ${
            isPlayingSimulation ? 'bg-[#ffca72] text-[#080a14] font-bold' : 'bg-[rgba(255,255,255,0.06)] text-[#45e0d0]'
          }`}
          title={isPlayingSimulation ? 'Pause' : 'Play 48h Drift Progression'}
        >
          {isPlayingSimulation ? '⏸' : '▶'}
        </button>

        <span className="text-[10px] uppercase font-mono text-[#8892b0] px-1">Live Projection:</span>

        <div className="flex items-center gap-1">
          {[0, 6, 12, 24, 48].map((hr) => (
            <button
              key={hr}
              onClick={() => {
                setSimulationHour(hr);
                setIsPlayingSimulation(false);
              }}
              className={`px-2 py-1 rounded-md text-[10px] font-mono transition-all cursor-pointer ${
                simulationHour === hr
                  ? 'bg-[rgba(69,224,208,0.2)] text-[#45e0d0] border border-[rgba(69,224,208,0.4)] font-bold'
                  : 'text-[#8892b0] hover:text-white'
              }`}
            >
              {hr === 0 ? 'NOW' : `+${hr}h`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
