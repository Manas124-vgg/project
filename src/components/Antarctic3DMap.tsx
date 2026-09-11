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
  const routeFlowMeshesRef = useRef<THREE.Mesh[]>([]);
  const routeCurveRef = useRef<THREE.CatmullRomCurve3 | null>(null);
  const selectionRingRef = useRef<THREE.Mesh | null>(null);

  // Camera Orbit State
  const isInteractingRef = useRef<boolean>(false);
  const lastInteractionRef = useRef<number>(0);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isRightClickRef = useRef<boolean>(false);
  const compassRef = useRef<HTMLSpanElement>(null);
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
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
    cameraRef.current = camera;

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    rendererRef.current = renderer;
    container.replaceChildren(renderer.domElement);

    // ATMOSPHERE: Southern-hemisphere starfield dome
    const starCount = 900;
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      // Stars live on the upper hemisphere only (polar night sky)
      const azimuth = Math.random() * Math.PI * 2;
      const elevation = 0.08 + Math.random() * 1.35; // radians above horizon
      const r = 650;
      starPositions[i * 3] = r * Math.cos(elevation) * Math.cos(azimuth);
      starPositions[i * 3 + 1] = r * Math.sin(elevation);
      starPositions[i * 3 + 2] = r * Math.cos(elevation) * Math.sin(azimuth);
      starSizes[i] = 0.8 + Math.random() * 2.2;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    const starMat = new THREE.PointsMaterial({
      color: 0xcfe4ff,
      size: 1.6,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.85,
      fog: false,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

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

    // AURORA AUSTRALIS: custom shader curtain on the southern sky
    const auroraUniforms = { uTime: { value: 0 } };
    const auroraMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      fog: false,
      uniforms: auroraUniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          // Vertical falloff: bright at the curtain base, fading upward
          float vertical = smoothstep(0.0, 0.25, vUv.y) * (1.0 - smoothstep(0.35, 1.0, vUv.y));
          // Layered flowing curtains drifting at different speeds
          float wave1 = sin(vUv.x * 14.0 + uTime * 0.45) * 0.5 + 0.5;
          float wave2 = sin(vUv.x * 27.0 - uTime * 0.3 + 2.0) * 0.5 + 0.5;
          float wave3 = sin(vUv.x * 6.0 + uTime * 0.2 + 4.5) * 0.5 + 0.5;
          float curtain = wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.4;
          // Shimmering vertical striations
          float striations = 0.75 + 0.25 * sin(vUv.x * 90.0 + uTime * 1.4 + curtain * 6.0);
          // Teal-green aurora with violet fringe
          vec3 col = mix(vec3(0.18, 0.95, 0.62), vec3(0.45, 0.35, 0.95), vUv.y * 1.4);
          float alpha = vertical * curtain * striations * 0.34;
          gl_FragColor = vec4(col * alpha, alpha);
        }
      `,
    });
    const auroraGeo = new THREE.PlaneGeometry(520, 130, 1, 1);
    const aurora = new THREE.Mesh(auroraGeo, auroraMat);
    aurora.position.set(0, 95, -230);
    scene.add(aurora);

    // OCEAN GRATICULE: faint lat/long rings + meridians for navigational context
    const graticule = new THREE.Group();
    const gridMat = new THREE.LineBasicMaterial({ color: 0x6ddcff, transparent: true, opacity: 0.08 });
    [30, 60, 90, 120].forEach((radius) => {
      const pts: THREE.Vector3[] = [];
      for (let a = 0; a <= 64; a++) {
        const t = (a / 64) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(t) * radius, 0.05, Math.sin(t) * radius));
      }
      graticule.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
    });
    for (let m = 0; m < 12; m++) {
      const t = (m / 12) * Math.PI * 2;
      graticule.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(Math.cos(t) * 120, 0.05, Math.sin(t) * 120),
          new THREE.Vector3(Math.cos(t) * 30, 0.05, Math.sin(t) * 30),
        ]),
        gridMat,
      ));
    }
    scene.add(graticule);

    // DISTANT ICE WALL: low fog-bank ring at the horizon so the ocean edge reads as distance
    const iceWallMat = new THREE.MeshBasicMaterial({ color: 0x1d3350, transparent: true, opacity: 0.5, fog: false });
    const iceWallGeo = new THREE.CylinderGeometry(178, 178, 6, 64, 1, true);
    const iceWall = new THREE.Mesh(iceWallGeo, iceWallMat);
    iceWall.position.y = 2;
    scene.add(iceWall);

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

    // Floating Ice Shelves — extruded slabs with real thickness: surface at the waterline,
    // an exposed ice-front cliff, and a submerged base sinking toward the seabed.
    const buildIceShelf = (
      radius: number,
      thetaStart: number,
      thetaLength: number,
      surfaceY: number,
      depthM: number,
      pos: { x: number; z: number },
    ) => {
      // 1 world unit ≈ 12 m: scale the real-world draft into scene depth
      const thickness = Math.max(1.2, depthM / 12);
      const shelfGroup = new THREE.Group();

      // Surface slab
      const topGeo = new THREE.CylinderGeometry(radius, radius, thickness, 40, 1, false, thetaStart, thetaLength);
      const topMat = new THREE.MeshStandardMaterial({
        color: 0xd6effb,
        roughness: 0.4,
        transparent: true,
        opacity: 0.94,
      });
      const top = new THREE.Mesh(topGeo, topMat);
      top.position.y = surfaceY - thickness / 2;
      top.receiveShadow = true;
      top.castShadow = true;
      shelfGroup.add(top);

      // Submerged base: slightly wider, bluer, reaching down toward the seabed
      const baseGeo = new THREE.CylinderGeometry(radius * 1.04, radius * 0.9, thickness * 2.6, 40, 1, false, thetaStart, thetaLength);
      const baseMat = new THREE.MeshPhysicalMaterial({
        color: 0x5db3e8,
        roughness: 0.5,
        transmission: 0.35,
        transparent: true,
        opacity: 0.5,
      });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = surfaceY - thickness - (thickness * 2.6) / 2;
      shelfGroup.add(base);

      // Dredged grounding line hint: darker ring at the keel floor
      const groundGeo = new THREE.RingGeometry(radius * 0.85, radius * 1.15, 40, 1, thetaStart, thetaLength);
      const groundMat = new THREE.MeshBasicMaterial({ color: 0x0a1a30, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
      const grounding = new THREE.Mesh(groundGeo, groundMat);
      grounding.rotation.x = -Math.PI / 2;
      grounding.position.y = -depthM / 12 + 0.1;
      shelfGroup.add(grounding);

      shelfGroup.position.set(pos.x, 0, pos.z);
      return shelfGroup;
    };

    // Ronne–Filchner shelf to the southwest (330 m class) and Larsen C to the northeast (180 m class)
    const ronneShelf = buildIceShelf(26, Math.PI * 0.8, Math.PI * 0.55, 0.5, 330, { x: -30, z: -16 });
    const larsenShelf = buildIceShelf(16, Math.PI * 1.45, Math.PI * 0.4, 0.45, 180, { x: 42, z: 28 });
    scene.add(ronneShelf);
    scene.add(larsenShelf);
    const rossShelf = ronneShelf;

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

    // Beacon light sphere (material made transparent so the loop can pulse it)
    const beaconGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x45e0d0, transparent: true });
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
    const clockStart = performance.now();

    // Freeze ocean surface vertices so the swell can undulate them each frame
    const oceanBasePositions = Float32Array.from(oceanGeo.attributes.position.array);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const t = (performance.now() - clockStart) / 1000;

      // Idle auto-orbit: after 4s without input the camera drifts around the scene
      if (!isInteractingRef.current && performance.now() - lastInteractionRef.current > 4000) {
        sphericalRef.current.theta += 0.0007;
      }

      // Update camera position from spherical coordinates
      const { radius, theta, phi } = sphericalRef.current;
      const target = targetRef.current;

      camera.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = target.y + radius * Math.cos(phi);
      camera.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(target);

      // Ocean swell: gentle multi-directional undulation of the surface mesh
      const oceanPos = oceanGeo.attributes.position;
      for (let i = 0; i < oceanPos.count; i++) {
        const bx = oceanBasePositions[i * 3];
        const by = oceanBasePositions[i * 3 + 1];
        oceanPos.setZ(
          i,
          Math.sin(bx * 0.06 + t * 0.9) * 0.35 +
          Math.cos(by * 0.05 - t * 0.7) * 0.3 +
          Math.sin((bx + by) * 0.03 + t * 0.45) * 0.4,
        );
      }
      oceanPos.needsUpdate = true;
      oceanGeo.computeVertexNormals();

      // Sky life: aurora shimmer + slow starfield rotation
      auroraUniforms.uTime.value = t;
      stars.rotation.y = t * 0.004;

      // Vessel beacon pulse
      const pulse = 0.55 + Math.sin(t * 3.2) * 0.45;
      beaconMesh.material.opacity = pulse;

      // Route chevron flow: markers drifting along the corridor toward the destination
      const flowCurve = routeCurveRef.current;
      if (flowCurve) {
        routeFlowMeshesRef.current.forEach((chevron) => {
          const offset = ((chevron.userData.flowOffset as number) + t * 0.045) % 1;
          const p = flowCurve.getPointAt(offset);
          const tangent = flowCurve.getTangentAt(offset);
          chevron.position.set(p.x, 1.1, p.z);
          chevron.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
          (chevron.material as THREE.MeshBasicMaterial).opacity = 0.25 + Math.sin(offset * Math.PI) * 0.55;
        });
      }

      // Selection ring pulse + gentle scale breathe
      const selRing = selectionRingRef.current;
      if (selRing) {
        const s = 1 + Math.sin(t * 2.6) * 0.08;
        selRing.scale.set(s, s, 1);
        (selRing.material as THREE.MeshBasicMaterial).opacity = 0.55 + Math.sin(t * 2.6) * 0.25;
      }

      // Ice shelf slow bob (floating ice breathes with the swell)
      rossShelf.position.y = 0.4 + Math.sin(t * 0.6) * 0.12;

      // Billboard all station flags towards camera
      stationsGroup.children.forEach((sg) => {
        const flag = sg.children[1];
        if (flag) flag.quaternion.copy(camera.quaternion);
      });

      // Pulse proximity alert if active
      if (proximityAlertRef.current && proximityAlertRef.current.visible) {
        proximityAlertRef.current.rotation.y += 0.02;
        const alertMat = proximityAlertRef.current.material as THREE.MeshBasicMaterial;
        alertMat.opacity = 0.18 + Math.abs(Math.sin(t * 2.4)) * 0.16;
      }

      // Compass HUD: current camera bearing over the polar grid
      if (compassRef.current) {
        const bearing = Math.round(((theta * 180) / Math.PI) % 360 + 360) % 360;
        compassRef.current.textContent = `${String(bearing).padStart(3, '0')}°`;
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

    // Native non-passive wheel listener so preventDefault works (React's onWheel is passive)
    const nativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
      sphericalRef.current.radius = Math.max(20, Math.min(240, sphericalRef.current.radius * zoomFactor));
      lastInteractionRef.current = performance.now();
    };
    container.addEventListener('wheel', nativeWheel, { passive: false });

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('wheel', nativeWheel);
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) mat.dispose();
      });
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
    if (selectionRingRef.current) {
      scene.remove(selectionRingRef.current);
      selectionRingRef.current = null;
    }

    // Deterministic pseudo-random from iceberg id: stable variety across re-renders
    const seedFrom = (id: string) => {
      let h = 0;
      for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
      return () => {
        h = (h * 1664525 + 1013904223) | 0;
        return ((h >>> 8) & 0xffff) / 0xffff;
      };
    };

    icebergs.forEach((berg) => {
      // Calculate projected position in 3D
      const rad = (berg.driftHeadingDeg * Math.PI) / 180;
      const simDeltaX = Math.sin(rad) * (berg.driftSpeedKnots * simulationHour * 0.28);
      const simDeltaY = -Math.cos(rad) * (berg.driftSpeedKnots * simulationHour * 0.28);

      const pos = svgTo3D(berg.svgX + simDeltaX, berg.svgY + simDeltaY);
      const isSelected = berg.id === selectedIcebergId;
      const rand = seedFrom(berg.id);

      // Per-berg silhouette variation so the fleet doesn't look cloned
      const scaleSx = 0.75 + rand() * 0.7;
      const scaleSz = 0.75 + rand() * 0.7;
      const scaleH = 0.7 + rand() * 0.9;
      const crownRotation = rand() * Math.PI * 2;
      const pinnacles = 1 + Math.floor(rand() * 2);

      const bergGroup = new THREE.Group();
      bergGroup.position.set(pos.x, 0, pos.z);

      // Above-Water Crown (Faceted irregular ice geometry)
      const crownGeo = new THREE.ConeGeometry(2.5, 3.8, 6);
      crownGeo.scale(1.2 * scaleSx, 1.0 * scaleH, 0.9 * scaleSz);
      const crownMat = new THREE.MeshStandardMaterial({
        color: isSelected ? 0xffffff : 0xeef6fd,
        roughness: 0.35,
        metalness: 0.1,
        emissive: isSelected ? 0x45e0d0 : 0x000000,
        emissiveIntensity: isSelected ? 0.35 : 0,
      });
      const crownMesh = new THREE.Mesh(crownGeo, crownMat);
      crownMesh.position.y = 1.9 * scaleH;
      crownMesh.rotation.y = crownRotation;
      crownMesh.castShadow = true;
      crownMesh.userData = { type: 'iceberg', id: berg.id };
      bergGroup.add(crownMesh);

      // Secondary pinnacle(s): smaller satellite peaks for a natural skyline
      for (let p = 0; p < pinnacles; p++) {
        const pScale = 0.45 + rand() * 0.35;
        const pGeo = new THREE.ConeGeometry(1.4, 2.6, 5);
        pGeo.scale(1, pScale * 1.6, 1);
        const pMesh = new THREE.Mesh(pGeo, crownMat);
        const ang = rand() * Math.PI * 2;
        pMesh.position.set(Math.cos(ang) * 1.6 * scaleSx, 1.1 + pScale * 1.1, Math.sin(ang) * 1.4 * scaleSz);
        pMesh.rotation.y = rand() * Math.PI;
        pMesh.castShadow = true;
        pMesh.userData = { type: 'iceberg', id: berg.id };
        bergGroup.add(pMesh);
      }

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

      // Pulsing selection ring at the waterline of the chosen berg
      if (isSelected) {
        const ringGeo = new THREE.RingGeometry(4.2, 5.2, 40);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x45e0d0,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(pos.x, 0.25, pos.z);
        ring.userData.isSelectionRing = true;
        scene.add(ring);
        selectionRingRef.current = ring;
      }
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
    // Clear chevron flow meshes
    routeFlowMeshesRef.current.forEach((m) => scene.remove(m));
    routeFlowMeshesRef.current = [];
    routeCurveRef.current = null;

    // Generate smooth 3D spline through active waypoints
    const points3D = activeWaypoints.map((wp) => {
      const pos = svgTo3D(wp.svgX, wp.svgY);
      return new THREE.Vector3(pos.x, 0.6, pos.z);
    });

    if (points3D.length >= 2) {
      // Glowing tube: a real-width route ribbon that reads at any camera angle
      // (the old 1px LineBasicMaterial collapsed to near-invisible when viewed end-on)
      const curve = new THREE.CatmullRomCurve3(points3D);
      routeCurveRef.current = curve;
      const routeColor = selectedCorridorId === 'corridor-b' ? 0xffca72 : selectedCorridorId === 'corridor-c' ? 0x8b7cff : 0x45e0d0;
      const tubeGeo = new THREE.TubeGeometry(curve, 80, 0.45, 10, false);
      const tubeMat = new THREE.MeshBasicMaterial({ color: routeColor, transparent: true, opacity: 0.85 });
      const routeLine = new THREE.Mesh(tubeGeo, tubeMat);
      scene.add(routeLine);
      routeLineRef.current = routeLine as unknown as THREE.Line;

      // Animated chevron flow: small cones drifting along the curve toward the destination
      const flowCount = 14;
      const flowMeshes: THREE.Mesh[] = [];
      const flowGeo = new THREE.ConeGeometry(0.55, 1.6, 6);
      for (let i = 0; i < flowCount; i++) {
        const chevronMat = new THREE.MeshBasicMaterial({ color: routeColor, transparent: true, opacity: 0.7 });
        const chevron = new THREE.Mesh(flowGeo, chevronMat);
        chevron.userData.flowOffset = i / flowCount;
        scene.add(chevron);
        routeFlowMeshesRef.current.push(chevron);
      }
    }

    // Add vertical waypoint light pillars
    if (waypointPillarsRef.current) waypointPillarsRef.current.clear();
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
    lastInteractionRef.current = performance.now();
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
    lastInteractionRef.current = performance.now();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isInteractingRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    lastInteractionRef.current = performance.now();
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

  // Double-click: smart-focus the camera onto a clicked iceberg
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!mountRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);
    for (const hit of intersects) {
      const data = hit.object.userData;
      if (data?.type === 'iceberg') {
        const berg = icebergs.find((b) => b.id === data.id);
        if (berg) {
          const pos = svgTo3D(berg.svgX, berg.svgY);
          targetRef.current.set(pos.x, 0, pos.z);
          sphericalRef.current = { ...sphericalRef.current, radius: 35 };
          setCameraPreset('iceberg');
          onSelectIceberg(berg.id);
          lastInteractionRef.current = performance.now();
        }
        break;
      }
    }
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
        onDoubleClick={handleDoubleClick}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* 3D Camera Preset Toolbar */}
      <div className="absolute top-3 left-4 z-20 flex items-center gap-1.5 bg-[rgba(6,12,24,0.92)] border border-[rgba(165,177,224,0.18)] px-2.5 py-1.5 rounded-xl text-xs backdrop-blur-md">
        <span className="text-[10px] uppercase font-mono text-[#8892b0] pr-1">3D Views:</span>
        <span ref={compassRef} className="text-[10px] font-mono text-[#6ddcff] px-1.5 border-r border-[rgba(165,177,224,0.2)] mr-0.5" title="Camera bearing">000°</span>
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
        <span>Scroll: Zoom</span>
        <span>·</span>
        <span>Dbl-click berg: Focus</span>
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
