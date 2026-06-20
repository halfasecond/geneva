import React, { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

// @google/model-viewer registers the <model-viewer> web component globally (side-effect import required).
// React/TSX integration notes (addressing the SO link you posted and typical gotchas):
// - camelCase props in JSX (React converts to attributes on the custom element).
// - The declare global below provides TSX types so no "unknown element" errors.
// - Camera/size changes often don't respond to attributes alone because the viewer's camera controller is async — we use ref + onLoad + imperative API (set cameraOrbit + jumpCameraToGoal) as recommended in those threads.
// - This makes the % orbit value actually take effect for model size.
// - Removed min/max pinning (was causing breakage/TS issues in some renders) and rely on controls=false + forced orbit.
// Side-effect import that registers the <model-viewer> custom element globally.
// Required for the VECH ship preview panel to actually render the 3D model.
// We also added '@google/model-viewer' to optimizeDeps in vite.config.ts to help with bundling in both dev and `yarn build:elite`.
import '@google/model-viewer'

// TypeScript support for the custom element in TSX (common pattern for model-viewer + React)
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string
        alt?: string
        cameraControls?: boolean | string
        autoRotate?: boolean | string
        disableZoom?: boolean | string
        disablePan?: boolean | string
        interactionPrompt?: string
        shadowIntensity?: number | string
        exposure?: number | string
        cameraOrbit?: string
        onLoad?: () => void
        style?: React.CSSProperties
        ref?: React.Ref<HTMLElement>
      }
    }
  }
}
import type { VechNft } from '../../types/vech'
import { EliteSim } from '../sim/EliteSim'
import type { EliteSnapshot, NpcAgent } from '../sim/core/types'
import { length } from '../sim/core/vector'
import {
  EMPTY_ROUTE,
  canInitiateHyperspace,
  getBodyById,
  getFrozenCartographyBodies,
  getRouteJumpCost,
} from '../sim/cartography'
import {
  COLORS, MIND_RADAR, SCANNER_2D, VECH, VIEW, WORLD, HYPERSPACE, NPC, FUEL, MARKET, Z, DASHBOARD, WAYPOINTS,
  roleColor, npcSizeForRole, BOREAL_STATION, DOCKED_RADAR,
} from '../config'
import {
  activateDockedService,
  buildDockedStationServices,
  firstSelectableServiceIndex,
  stepDockedServiceIndex,
} from '../render/dockedRadar'
import { projectContacts } from '../sim/contacts'
import { getCargoUsed } from '../sim/market'
import { isBorealFreighterInBubble } from '../sim/borealDock'
import { bodyLocalPos, isInsideBubble, viewBasisFromAttitude } from '../sim/systemSpace'
import { computeWaypoints, type WaypointIndicator } from '../sim/waypoints'
import type { CartographyBody } from '../sim/cartography'
import { useFlightInput } from '../useFlightInput'
import { useRadar2D } from '../useRadar2D'
import * as CockpitRender from '../render/cockpit'
import { createVechHoloIcon, loadVechShipModel } from '../render/vech'
import * as HyperspaceRender from '../render/hyperspace'
import * as StationRender from '../render/station'
import {
  BIG_SHIP_MESH_VERSION,
  createBigShipMesh,
  isBigShipMesh,
  updateBigShipCityLights,
} from '../render/bigShip'
import {
  hasBorealDockBay,
  updateBorealDockBay,
} from '../render/borealDockBay'
import CartographyOverlay from './Cartography/CartographyOverlay'
import HyperspacePanel from './Cartography/HyperspacePanel'
import HyperspaceCountdown from './Cartography/HyperspaceCountdown'
import HyperspaceTunnel from './Cartography/HyperspaceTunnel'
import MarketOverlay from './Market/MarketOverlay'
import ShipUpgradesOverlay from './ShipUpgradesOverlay'
import HangarOverlay from './Hangar/HangarOverlay'
import VechPreview from './VechPreview'
import ShipHoldPanel from './ShipHoldPanel'
import WaypointOverlay from './WaypointOverlay'
import PositionDebug from './PositionDebug'
import {
  fetchSave,
  flushPersistSave,
  persistSave,
  persistSaveDebounced,
} from '../persistence/save'
import type { VechSavePlayer } from '../../types/vechSave'

type EliteProps = {
  currentShip: VechNft
  ownedShips: VechNft[]
  shipsLoading?: boolean
  initialSave: VechSavePlayer
  authToken?: string
  onSelectShip: (ship: VechNft) => void | Promise<void>
  showPositionDebug?: boolean
}

const Elite: React.FC<EliteProps> = ({
  currentShip,
  ownedShips,
  shipsLoading = false,
  initialSave,
  authToken,
  onSelectShip,
  showPositionDebug = false,
}) => {
  const glbUrl = currentShip.animation_url || ''
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const simRef = useRef<EliteSim>(null!)
  if (!simRef.current) {
    const sim = new EliteSim(2)
    sim.fromSave(initialSave)
    simRef.current = sim
  }
  const authTokenRef = useRef(authToken)
  authTokenRef.current = authToken
  const hullTokenIdRef = useRef(currentShip.tokenId)
  hullTokenIdRef.current = currentShip.tokenId
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const frameRef = useRef<number | null>(null)
  const lastTimeRef = useRef(performance.now())

  // Three objects we update every frame
  const playerMeshRef = useRef<THREE.Group | null>(null)
  const npcGroupRef = useRef<THREE.Group | null>(null)
  const npcMeshesRef = useRef<THREE.Object3D[]>([])   // persistent meshes - no per-frame allocation
  const starFieldRef = useRef<THREE.Points | null>(null)
  const bodiesGroupRef = useRef<THREE.Group | null>(null)
  const hyperspaceStreaksRef = useRef<THREE.Group | null>(null)
  const snapRef = useRef<EliteSnapshot | null>(null)
  const prevFlightModeRef = useRef<string>('normal')
  const sunMeshRef = useRef<THREE.Mesh | null>(null)
  const [waypoints, setWaypoints] = useState<WaypointIndicator[]>([])
  const hyperspacePhaseRef = useRef<'idle' | 'countdown' | 'jump'>('idle')
  const hyperspaceSequenceStartRef = useRef(0)
  const hyperspaceLastCountdownRef = useRef(-1)

  // Cockpit 3D elements
  const radarRef = useRef<THREE.Group | null>(null)
  const radarBlipsRef = useRef<THREE.Object3D[]>([])
  const radar2DCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const fuelBarsRef = useRef<THREE.Object3D[]>([])
  const reticleRef = useRef<THREE.Group | null>(null)

  const [hud, setHud] = useState({
    speed: 0,
    npcs: 2,
    time: 0,
    playerPos: { x: 0, y: 0, z: 0 },
    systemPos2d: { x: 0, y: 0 },
    fuel: FUEL.starting,
    credits: 12000,
    cargoUsed: 0,
    cargoCapacity: MARKET.cargoCapacity,
    flightMode: 'normal' as const,
    dockedAtStationId: null as string | null,

    systemId: 'helios',
    borealDist: null as number | null,
    borealDelta: null as { x: number; y: number; z: number } | null,
  })

  const [marketOpen, setMarketOpen] = useState(false)
  const marketOpenRef = useRef(false)
  marketOpenRef.current = marketOpen
  const [upgradesOpen, setUpgradesOpen] = useState(false)
  const upgradesOpenRef = useRef(false)
  upgradesOpenRef.current = upgradesOpen
  const [hangarOpen, setHangarOpen] = useState(false)
  const hangarOpenRef = useRef(false)
  hangarOpenRef.current = hangarOpen
  const dockedServiceIndexRef = useRef(0)
  const [marketSnap, setMarketSnap] = useState<EliteSnapshot | null>(() => simRef.current.getSnapshot())

  // Cartography + hyperspace overlay state
  const [mapOpen, setMapOpen] = useState(false)
  const [route, setRoute] = useState(EMPTY_ROUTE)
  const routeRef = useRef(route)
  routeRef.current = route

  const [isHyperspacing, setIsHyperspacing] = useState(false)
  const [hyperspaceCountdown, setHyperspaceCountdown] = useState<number | null>(null)
  const hyperspaceJumpStartRef = useRef(0)
  const hyperspaceDestinationRef = useRef<string | null>(null)
  const hyperspaceCostRef = useRef(0)

  // Use the extracted flight input hook (replaces the old keysRef + onKeyDown/Up + getPlayerInput)
  const { getInput: getPlayerInput } = useFlightInput()

  const queuePersist = useCallback(() => {
    const token = authTokenRef.current
    if (!token) return
    persistSaveDebounced(hullTokenIdRef.current, token, simRef.current.toSave())
  }, [])
  const queuePersistRef = useRef(queuePersist)
  queuePersistRef.current = queuePersist

  const handleHullSelect = useCallback(async (ship: VechNft) => {
    if (ship.tokenId === hullTokenIdRef.current) return
    const token = authTokenRef.current
    if (token) {
      await flushPersistSave()
      await persistSave(hullTokenIdRef.current, token, simRef.current.toSave())
      const next = await fetchSave(ship.tokenId, token)
      simRef.current.fromSave(next ?? EliteSim.defaultSave())
    } else {
      simRef.current.fromSave(EliteSim.defaultSave())
    }
    await onSelectShip(ship)
  }, [onSelectShip])

  useEffect(() => {
    const onHide = () => { void flushPersistSave() }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('beforeunload', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('beforeunload', onHide)
      void flushPersistSave()
    }
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => queuePersist(), 30000)
    return () => clearInterval(interval)
  }, [queuePersist])

  // Keyboard "action" keys (m) that affect React state are handled in this dedicated effect.
  // Flight controls (thrust/yaw/pitch/roll) + their preventDefaults are handled inside useFlightInput.
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k === 'm' && hyperspacePhaseRef.current === 'idle') setMapOpen(o => !o)
      if (
        k === 'h'
        && hyperspacePhaseRef.current === 'idle'
        && !mapOpen
        && snapRef.current?.player.flightMode === 'docked'
      ) {
        const result = activateDockedService('hangar', {
          marketOpen: marketOpenRef.current,
          upgradesOpen: upgradesOpenRef.current,
          hangarOpen: hangarOpenRef.current,
        })
        setMarketOpen(result.marketOpen)
        setUpgradesOpen(result.upgradesOpen)
        setHangarOpen(result.hangarOpen)
      }
      if (k === 'escape' && mapOpen && hyperspacePhaseRef.current === 'idle') setMapOpen(false)
      if (k === 'f' && hyperspacePhaseRef.current === 'idle') {
        const mode = snapRef.current?.player.flightMode
        if (mode === 'docked') {
          simRef.current.startUndocking()
          setMarketOpen(false)
          setUpgradesOpen(false)
          setHangarOpen(false)
        } else if (mode === 'normal' || mode === 'supercruise') {
          simRef.current.startDocking()
        }
      }
      if (k === 'escape' && snapRef.current?.player.flightMode === 'docked') {
        if (marketOpen) setMarketOpen(false)
        else if (upgradesOpen) setUpgradesOpen(false)
        else if (hangarOpen) setHangarOpen(false)
      }

      const docked = snapRef.current?.player.flightMode === 'docked'
      if (docked && !e.repeat) {
        const snap = snapRef.current
        if (!snap) return

        const dockedServices = () => buildDockedStationServices({
          fuel: snap.player.fuel ?? FUEL.starting,
          fuelMax: FUEL.max,
          marketOpen: marketOpenRef.current,
          upgradesOpen: upgradesOpenRef.current,
          hangarOpen: hangarOpenRef.current,
        })

        if (k === 'arrowup' || k === 'arrowdown') {
          e.preventDefault()
          e.stopPropagation()
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
          dockedServiceIndexRef.current = stepDockedServiceIndex(
            dockedServices(),
            dockedServiceIndexRef.current,
            k === 'arrowdown' ? 1 : -1,
          )
        }

        if (k === 'enter') {
          e.preventDefault()
          e.stopPropagation()
          const selected = dockedServices()[dockedServiceIndexRef.current]
          if (!selected?.available) return
          const result = activateDockedService(selected.id, {
            marketOpen: marketOpenRef.current,
            upgradesOpen: upgradesOpenRef.current,
            hangarOpen: hangarOpenRef.current,
          })
          if (result.undock) {
            simRef.current.startUndocking()
            setMarketOpen(false)
            setUpgradesOpen(false)
            setHangarOpen(false)
            setMarketSnap(simRef.current.getSnapshot())
            return
          }
          if (result.refuel) simRef.current.refuel()
          setMarketOpen(result.marketOpen)
          setUpgradesOpen(result.upgradesOpen)
          setHangarOpen(result.hangarOpen)
          setMarketSnap(simRef.current.getSnapshot())
        }
      }
    }
    window.addEventListener('keydown', handleGlobalKeys, true)
    return () => window.removeEventListener('keydown', handleGlobalKeys, true)
  }, [mapOpen, marketOpen, upgradesOpen, hangarOpen])

  // Initialize Three.js scene (inspired by Flocker FlockScene + cartography aesthetic)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    rendererRef.current = renderer

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(COLORS.spaceBg, 0.0018)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(
      VIEW.fov,
      window.innerWidth / window.innerHeight,
      VIEW.near,
      VIEW.far
    )
    camera.position.set(VIEW.initialPos.x, VIEW.initialPos.y, VIEW.initialPos.z)
    cameraRef.current = camera

    // Stars (cheap dense starfield)
    const starCount = WORLD.starCount
    const starPositions = new Float32Array(starCount * 3)
    const starColors = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
      const r = WORLD.starRadiusMin + Math.random() * WORLD.starRadiusVar
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7
      starPositions[i * 3 + 2] = r * Math.cos(phi)
      const c = 0.75 + Math.random() * 0.25
      starColors[i * 3] = c
      starColors[i * 3 + 1] = c * 0.92
      starColors[i * 3 + 2] = c * 0.98
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3))
    const starMat = new THREE.PointsMaterial({
      size: WORLD.starSize,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    })
    const stars = new THREE.Points(starGeo, starMat)
    scene.add(stars)
    starFieldRef.current = stars

    // Central sun (glowing)
    const sunGeo = new THREE.SphereGeometry(WORLD.sunRadius, 32, 32)
    const sunMat = new THREE.MeshBasicMaterial({ color: WORLD.sunColor })
    const sun = new THREE.Mesh(sunGeo, sunMat)
    scene.add(sun)
    sunMeshRef.current = sun

    // System bodies — frozen ephemeris in world space (same frame as radar + player nav)
    const bodiesGroup = new THREE.Group()
    const cartoInitial = getFrozenCartographyBodies()
    cartoInitial.forEach((b) => {
      if (b.type === 'star') return
      const mesh = b.type === 'station'
        ? StationRender.createStationMesh(b.color, b.radius)
        : StationRender.createPlanetMesh(b.color, b.radius)
      mesh.userData.bodyId = b.id
      mesh.position.set(0, 0, 0)
      bodiesGroup.add(mesh)
    })
    scene.add(bodiesGroup)
    bodiesGroupRef.current = bodiesGroup

    // Hyperspace tunnel — camera-attached so streaks align with the cockpit forward view
    const { group: streaksGroup, streaks } = HyperspaceRender.createHyperspaceStreaks(camera)
    hyperspaceStreaksRef.current = streaksGroup
      ; (streaksGroup as any)._streaks = streaks

    // === COCKPIT + 3D HOLO ELEMENTS (now built via extracted render helpers) ===
    // The create* functions add the groups directly to the camera (exact same parenting
    // as the original inline code). Refs are still populated for the animate loop.
    const { cockpit } = CockpitRender.createCockpitFrame(camera)
    playerMeshRef.current = cockpit

    const { reticleGroup, radarGroup, blips } = CockpitRender.createHoloRadarAndReticle(camera)
    reticleRef.current = reticleGroup
    radarRef.current = radarGroup
    radarBlipsRef.current = blips

    const { shipIcon } = createVechHoloIcon(camera)
    if (glbUrl) {
      loadVechShipModel(glbUrl, shipIcon).catch(() => {})
    }

    const { fuelBars } = CockpitRender.createFuelBars(camera)
    fuelBarsRef.current = fuelBars

    // NPC container (world space)
    const npcGroup = new THREE.Group()
    scene.add(npcGroup)
    npcGroupRef.current = npcGroup

    // Lighting (subtle, mostly emissive world)
    const hemi = new THREE.HemisphereLight(WORLD.hemi.sky, WORLD.hemi.ground, WORLD.hemi.intensity)
    scene.add(hemi)

    renderer.setClearColor(COLORS.spaceBg, 1)

    // Give the camera an initial look toward the starting area so something is visible immediately
    camera.lookAt(0, 80, 20)

    // Immediate first render of the static scene (stars, sun, bodies) before the sim loop kicks in
    renderer.render(scene, camera)

    const handleResize = () => {
      if (!renderer || !camera) return
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    // Keyboard listeners are now managed by useFlightInput() hook (for flight controls)
    // and a separate small useEffect (for h/m/r actions). No need to attach here.

    // Main render + sim loop
    const animate = () => {
      const now = performance.now()
      const dt = Math.min(0.066, (now - lastTimeRef.current) / 1000) // matches former DT.max
      lastTimeRef.current = now

      const sim = simRef.current
      const rawInput = getPlayerInput()
      const input = snapRef.current?.player.flightMode === 'docked'
        ? { ...rawInput, thrust: 0, yaw: 0 }
        : rawInput
      sim.step(dt, input)

      const snap = sim.getSnapshot()
      snapRef.current = snap

      const viewport = { width: window.innerWidth, height: window.innerHeight }
      const systemPos2d = snap.player.systemPos2d
      const carto = getFrozenCartographyBodies()
      const cartoById = new Map(carto.map(b => [b.id, b]))

      const bodiesForContacts: Array<Pick<CartographyBody, 'pos3d' | 'type' | 'name' | 'id'>> = []

      if (sunMeshRef.current) {
        const helios = cartoById.get('helios')
        if (helios) {
          const local = bodyLocalPos(helios, systemPos2d)
          sunMeshRef.current.position.set(local.x, local.y, local.z)
          sunMeshRef.current.visible = isInsideBubble(local)
        }
      }

      if (bodiesGroupRef.current) {
        bodiesGroupRef.current.children.forEach((child) => {
          const bodyId = child.userData.bodyId as string | undefined
          const body = bodyId ? cartoById.get(bodyId) : undefined
          if (!body) return
          const local = bodyLocalPos(body, systemPos2d)
          child.position.set(local.x, local.y, local.z)
          // Boreal Station is the BOREAL hull — hide the cartography torus marker.
          child.visible = body.id !== 'boreal-station' && isInsideBubble(local)
          if (child.visible) {
            bodiesForContacts.push({
              id: body.id,
              name: body.name,
              type: body.type,
              pos3d: local,
            })
          }
        })
        StationRender.updateStationAnimations(bodiesGroupRef.current, snap.time)
      }

      // COCKPIT CAMERA (first-person Elite style)
      // The camera *is* your viewpoint from inside the ship.
      // The cockpit frame (cloned ship model) is a child of the camera so it stays fixed in view.
      const cam = cameraRef.current
      if (cam) {
        const p = snap.player
        const upHint = p.up || { x: 0, y: 1, z: 0 }
        const axes = viewBasisFromAttitude(p.heading, upHint)

        // Floating origin + orthonormal basis (same as waypoint projection).
        cam.position.set(
          -axes.forward.x * VIEW.cockpitBack + axes.up.x * VIEW.eyeHeight,
          -axes.forward.y * VIEW.cockpitBack + axes.up.y * VIEW.eyeHeight,
          -axes.forward.z * VIEW.cockpitBack + axes.up.z * VIEW.eyeHeight
        )
        cam.up.set(axes.up.x, axes.up.y, axes.up.z)
        cam.lookAt(
          cam.position.x + axes.forward.x * VIEW.lookFar,
          cam.position.y + axes.forward.y * VIEW.lookFar,
          cam.position.z + axes.forward.z * VIEW.lookFar
        )
      }

      if (snap.player.flightMode !== 'hyperspace' && snap.player.flightMode !== 'docked') {
        const p = snap.player
        setWaypoints(computeWaypoints(
          { heading: p.heading, systemPos2d: p.systemPos2d },
          { destinationId: routeRef.current.destinationId, viewport },
        ))
      } else {
        setWaypoints([])
      }

      // === 3D Holo Radar (now uses the shared projectContacts util + extracted updater) ===
      if (radarRef.current && radarBlipsRef.current && radarBlipsRef.current.length > 0) {
        const p = snap.player
        const fwd = p.heading
        const upv = p.up || { x: 0, y: 1, z: 0 }

        const contacts = p.flightMode === 'docked'
          ? []
          : projectContacts(
            { pos: p.pos, heading: fwd, up: upv },
            snap.npcs,
            bodiesForContacts.length > 0 ? bodiesForContacts : carto.map(b => ({
              id: b.id,
              name: b.name,
              type: b.type,
              pos3d: bodyLocalPos(b, systemPos2d),
            })),
            { maxShip: SCANNER_2D.maxRangeShip, maxBody: SCANNER_2D.maxRangeBody, maxMind: MIND_RADAR.maxRange }
          )

        CockpitRender.update3DRadar(radarBlipsRef.current, contacts)
      }

      // Fuel bars on the left (simple 3D holo representation)
      if (fuelBarsRef.current && fuelBarsRef.current.length > 0) {
        const fuel = snap.player.fuel ?? FUEL.max
        const level = Math.max(0, Math.min(1, fuel / FUEL.max))
        const bars = fuelBarsRef.current
        const onCount = Math.floor(level * bars.length)
        bars.forEach((bar, i) => {
          const m = bar as THREE.Mesh
          const mat = m.material as THREE.MeshBasicMaterial
          if (i < onCount) {
            mat.opacity = 0.85
            mat.color.set(i < onCount - 2 ? 0xffaa00 : COLORS.warning)
          } else {
            mat.opacity = 0.2
            mat.color.set(0xffaa00)
          }
        })
      }

      // Reticle charge pulse during countdown + jump
      const hyperspaceActive = hyperspacePhaseRef.current !== 'idle'
      if (reticleRef.current && hyperspaceActive) {
        const t = (snap.time * 8) % (Math.PI * 2)
        reticleRef.current.scale.setScalar(1 + Math.sin(t) * 0.15)
        reticleRef.current.children.forEach((c: any) => {
          if (c.material && c.material.color) c.material.color.set(0xff6644)
        })
      } else if (reticleRef.current) {
        reticleRef.current.scale.setScalar(1)
        reticleRef.current.children.forEach((c: any) => {
          if (c.material && c.material.color) c.material.color.set(0xffaa00)
        })
      }

      // Hyperspace sequence: countdown (3…2…1) then camera-aligned tunnel rush
      const streaksGrp: any = hyperspaceStreaksRef.current
      if (hyperspaceActive && streaksGrp?._streaks) {
        const now = performance.now()
        const elapsed = (now - hyperspaceSequenceStartRef.current) / 1000

        if (hyperspacePhaseRef.current === 'countdown') {
          const remaining = Math.ceil(HYPERSPACE.countdown - elapsed)
          if (remaining > 0 && remaining !== hyperspaceLastCountdownRef.current) {
            hyperspaceLastCountdownRef.current = remaining
            setHyperspaceCountdown(remaining)
          }
          if (elapsed >= HYPERSPACE.countdown) {
            hyperspacePhaseRef.current = 'jump'
            hyperspaceJumpStartRef.current = now
            hyperspaceLastCountdownRef.current = -1
            setHyperspaceCountdown(null)
            setIsHyperspacing(true)
            streaksGrp.visible = true
          }
        }

        if (hyperspacePhaseRef.current === 'jump') {
          const phase = (now - hyperspaceJumpStartRef.current) / 1000 / HYPERSPACE.duration
          HyperspaceRender.updateHyperspaceStreaks(streaksGrp._streaks as THREE.Mesh[], phase, dt)
          streaksGrp.visible = true

          if (phase >= 1.0) {
            const destId = hyperspaceDestinationRef.current
            if (destId) simRef.current.performHyperspaceJump(destId, hyperspaceCostRef.current)
            streaksGrp.visible = false
            hyperspacePhaseRef.current = 'idle'
            hyperspaceSequenceStartRef.current = 0
            hyperspaceJumpStartRef.current = 0
            hyperspaceDestinationRef.current = null
            setIsHyperspacing(false)
          }
        }
      }

      // Sync NPCs - efficient persistent meshes (critical for memory stability)
      // We create meshes once and just update transforms each frame. No GC churn.
      const npcContainer = npcGroupRef.current
      const npcMeshes = npcMeshesRef.current
      if (npcContainer) {
        const current = snap.npcs

        // Grow the pool if needed (cheap for small N like 2)
        while (npcMeshes.length < current.length) {
          const idx = npcMeshes.length
          const npc = current[idx] || current[0]
          const m = npc.role === 'freighter'
            ? createBigShipMesh()
            : (() => {
                const size = npcSizeForRole(npc.role)
                const { r, h } = NPC.cone(size)
                const cone = new THREE.Mesh(
                  new THREE.ConeGeometry(r, h, 3),
                  new THREE.MeshBasicMaterial({ color: roleColor(npc.role), wireframe: true }),
                )
                const dot = new THREE.Mesh(
                  new THREE.SphereGeometry(NPC.dot.r, 8, 8),
                  new THREE.MeshBasicMaterial({ color: 0xffee66, transparent: true, opacity: NPC.dot.opacity }),
                )
                dot.position.y = size * NPC.dot.yOffset
                dot.visible = false
                cone.add(dot)
                return cone
              })()

          npcContainer.add(m)
          npcMeshes.push(m)
        }

        // Update existing meshes (or hide extras)
        const playerPos = snap.player.pos
        current.forEach((npc: NpcAgent, i: number) => {
          let m = npcMeshes[i]
          if (!m) return

          if (
            npc.role === 'freighter'
            && (m.userData.meshVersion !== BIG_SHIP_MESH_VERSION || !hasBorealDockBay(m))
          ) {
            npcContainer.remove(m)
            m = createBigShipMesh()
            npcContainer.add(m)
            npcMeshes[i] = m
          }

          const isBoreal = npc.role === 'freighter' || !!npc.designation
          m.visible = !isBoreal || isBorealFreighterInBubble(playerPos, npc.pos)
          m.position.set(
            npc.pos.x - playerPos.x,
            npc.pos.y - playerPos.y,
            npc.pos.z - playerPos.z,
          )

          if (isBoreal) {
            m.rotation.set(0, BOREAL_STATION.freighterYaw, 0)
          } else {
            const vlen = length(npc.vel)
            if (vlen > 0.3) {
              const vx = npc.vel.x / vlen
              const vy = npc.vel.y / vlen
              const vz = npc.vel.z / vlen
              m.lookAt(
                m.position.x + vx * NPC.lookAhead,
                m.position.y + vy * NPC.lookAhead,
                m.position.z + vz * NPC.lookAhead,
              )
            }
          }

          if (isBigShipMesh(m)) {
            updateBigShipCityLights(m, snap.time, npc.id)
            updateBorealDockBay(m, snap.time)
          }

          // pressure glow dot
          const dot = m.children.find(
            c => (c as THREE.Mesh).geometry instanceof THREE.SphereGeometry,
          ) as THREE.Mesh | undefined
          if (dot) {
            dot.visible = npc.pressure > NPC.pressureThreshold
            if (dot.visible && !isBigShipMesh(m)) {
              dot.position.y = npcSizeForRole(npc.role) * NPC.dot.yOffset
            }
          }
        })

        // Hide any extra pooled meshes (won't happen with N=2)
        for (let i = current.length; i < npcMeshes.length; i++) {
          npcMeshes[i].visible = false
        }
      }

      if (snap.player.flightMode === 'docked' && prevFlightModeRef.current !== 'docked') {
        setMarketOpen(false)
        setUpgradesOpen(false)
        setHangarOpen(false)
        const services = buildDockedStationServices({
          fuel: snap.player.fuel ?? FUEL.starting,
          fuelMax: FUEL.max,
          marketOpen: false,
          upgradesOpen: false,
          hangarOpen: false,
        })
        dockedServiceIndexRef.current = firstSelectableServiceIndex(services)
        queuePersistRef.current()
      }
      prevFlightModeRef.current = snap.player.flightMode

      // HUD state (throttled a bit)
      if (Math.random() < 0.6) {
        const freighter = snap.npcs.find(n => n.designation || n.role === 'freighter')
        let borealDist: number | null = null
        let borealDelta: { x: number; y: number; z: number } | null = null
        if (freighter) {
          const dx = snap.player.pos.x - freighter.pos.x
          const dy = snap.player.pos.y - freighter.pos.y
          const dz = snap.player.pos.z - freighter.pos.z
          borealDist = Math.round(Math.hypot(dx, dy, dz))
          borealDelta = {
            x: Math.round(dx),
            y: Math.round(dy),
            z: Math.round(dz),
          }
        }

        setHud({
          speed: Math.round(snap.player.speed),
          npcs: snap.npcs.length,
          time: Math.floor(snap.time),
          playerPos: {
            x: Math.round(snap.player.pos.x),
            y: Math.round(snap.player.pos.y),
            z: Math.round(snap.player.pos.z),
          },
          fuel: Math.round(snap.player.fuel ?? 0),
          credits: Math.round(snap.player.credits),
          cargoUsed: getCargoUsed(snap.player.cargo),
          cargoCapacity: snap.player.cargoCapacity,
          systemPos2d: {
            x: Math.round(snap.player.systemPos2d.x),
            y: Math.round(snap.player.systemPos2d.y),
          },
          flightMode: snap.player.flightMode,
          dockedAtStationId: snap.player.dockedAtStationId,

          systemId: snap.player.systemId,
          borealDist,
          borealDelta,
        })
        if (snap.player.flightMode === 'docked') setMarketSnap(snap)
      }

      if (renderer && scene && cam) {
        renderer.render(scene, cam)
      }

      frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      // Keyboard listeners are cleaned up inside useFlightInput hook and the action-keys useEffect.
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      renderer.dispose()
      // more thorough cleanup could be added
    }
  }, [])  // No longer depends on keyboard handlers (now in dedicated hooks)



  useRadar2D({
    canvasRef: radar2DCanvasRef,
    snapRef,
    marketOpenRef,
    upgradesOpenRef,
    hangarOpenRef,
    dockedServiceIndexRef,
    mapOpen,
  })

  const handleInitiateHyperspace = () => {
    if (hyperspacePhaseRef.current !== 'idle') return
    const snap = simRef.current.getSnapshot()
    const cost = getRouteJumpCost(snap.player.systemPos2d, snap.player.systemId, route)
    if (!canInitiateHyperspace({
      destinationId: route.destinationId,
      flightMode: snap.player.flightMode,
      fuel: hud.fuel,
      cost,
      isHyperspacing: hyperspacePhaseRef.current !== 'idle',
    })) return

    setMapOpen(false)
    hyperspaceDestinationRef.current = route.destinationId
    hyperspaceCostRef.current = cost
    simRef.current.setFlightMode('hyperspace')
    hyperspaceSequenceStartRef.current = performance.now()
    hyperspaceJumpStartRef.current = 0
    hyperspaceLastCountdownRef.current = -1
    hyperspacePhaseRef.current = 'countdown'
    setHyperspaceCountdown(HYPERSPACE.countdown)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#00040a',
      color: '#aaccdd',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      overflow: 'hidden',
    }}>
      {/* Three.js Canvas */}
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />

      {isHyperspacing && <HyperspaceTunnel />}

      <WaypointOverlay
        waypoints={waypoints}
        hidden={
          !WAYPOINTS.debugHardcoded
          && (mapOpen || marketOpen || isHyperspacing || hyperspaceCountdown !== null || hud.flightMode === 'docked')
        }
      />

      {showPositionDebug && !mapOpen && (
        <PositionDebug
          pos={hud.playerPos}
          speed={hud.speed}
          flightMode={hud.flightMode}
          borealDist={hud.borealDist}
          borealDelta={hud.borealDelta}
        />
      )}

      {hud.flightMode !== 'docked' && (
        <img src={'https://cdn.halfasecond.com/images/vech/vech-logo.png'} alt="Vech" style={{
          width: 72,
          opacity: 0.4,
          position: 'fixed',
          left: 'calc(50% - 310px)',
          transform: 'translateX(-50%)',
          bottom: 164,
          zIndex: Z.logo,
          pointerEvents: 'none',
        }} />
      )}

      {hyperspaceCountdown !== null && (
        <HyperspaceCountdown count={hyperspaceCountdown} />
      )}

      {marketOpen && marketSnap && marketSnap.player.flightMode === 'docked' && !mapOpen && (() => {
        const dockedMarket = marketSnap.markets.find(m => m.id === marketSnap.player.dockedAtStationId)
        if (!dockedMarket) return null
        return (
          <MarketOverlay
            homeMarket={dockedMarket}
            markets={marketSnap.markets}
            cargo={marketSnap.player.cargo}
            onClose={() => setMarketOpen(false)}
            onUndock={() => {
              simRef.current.undock()
              setMarketOpen(false)
              setUpgradesOpen(false)
              setHangarOpen(false)
              setMarketSnap(simRef.current.getSnapshot())
            }}
            onTrade={(commodityId, tons, direction) => {
              simRef.current.tradeCommodity(commodityId, tons, direction)
              setMarketSnap(simRef.current.getSnapshot())
            }}
          />
        )
      })()}

      {upgradesOpen && hud.flightMode === 'docked' && !mapOpen && (
        <ShipUpgradesOverlay
          glbUrl={glbUrl}
          ship={currentShip}
          onClose={() => setUpgradesOpen(false)}
        />
      )}

      {hangarOpen && hud.flightMode === 'docked' && !mapOpen && (() => {
        const station = hud.dockedAtStationId
          ? getBodyById(hud.dockedAtStationId, 'frozen')
          : null
        return (
          <HangarOverlay
            stationName={station?.name ?? 'Station'}
            ownedShips={ownedShips}
            currentShip={currentShip}
            shipsLoading={shipsLoading}
            onClose={() => setHangarOpen(false)}
            onSelectShip={handleHullSelect}
          />
        )
      })()}

      {mapOpen && (
        <CartographyOverlay
          route={route}
          playerPos={hud.systemPos2d}
          onRouteChange={setRoute}
        />
      )}

      <HyperspacePanel
        route={route}
        fromPos2d={hud.systemPos2d}
        systemId={hud.systemId}
        dockedAtStationId={hud.dockedAtStationId}
        fuel={hud.fuel}
        flightMode={hud.flightMode}
        isHyperspacing={isHyperspacing}
        onInitiateHyperspace={handleInitiateHyperspace}
      />

      {/* Cockpit bezels — always on top to frame the windscreen */}
      <div style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: '85px',
        background: 'rgba(0, 4, 10, 0.6)',
        boxShadow: '0 0 12px rgba(0, 170, 255, 0.15)',
        zIndex: Z.bezel,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '45px',
        background: 'rgba(0, 4, 10, 0.65)',
        boxShadow: '0 0 8px rgba(0, 170, 255, 0.15)',
        zIndex: Z.bezel,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '85px',
        background: 'rgba(0, 4, 10, 0.75)',
        boxShadow: '0 0 12px rgba(0, 170, 255, 0.15)',
        zIndex: Z.bezel,
        pointerEvents: 'none',
      }} />

      {/* Bottom dashboard strip — behind cartography */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: DASHBOARD.height,
        background: 'rgba(0, 4, 10, 0.65)',
        boxShadow: '0 -4px 20px rgba(0, 170, 255, 0.15)',
        zIndex: Z.dashboard,
        pointerEvents: 'none',
      }} />

      {/* Cockpit widgets — above cartography holo so radar/Vech stay fully visible */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: DASHBOARD.height,
        zIndex: Z.cockpitWidgets,
        pointerEvents: 'none',
        color: COLORS.vechRingCss,
        fontFamily: 'ui-monospace, monospace',
        fontSize: '18px',
      }}>
        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: DASHBOARD.radar.bottom,
          width: DASHBOARD.radar.width,
          height: DASHBOARD.radar.height,
          background: hud.flightMode === 'docked' ? DOCKED_RADAR.bg : undefined,
          boxShadow: hud.flightMode === 'docked'
            ? undefined
            : 'inset 0 0 14px rgba(102, 170, 255, .15), 0 0 8px rgba(102, 170, 255, .15)',
          overflow: 'hidden',
        }}>
          <canvas
            ref={radar2DCanvasRef}
            width={DASHBOARD.radar.width}
            height={DASHBOARD.radar.height}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          />
          {hud.flightMode !== 'docked' && (
            <div style={{ position: 'absolute', bottom: 1, width: '100%', textAlign: 'center', fontSize: '8px', letterSpacing: '0.5px', color: SCANNER_2D.nearbyLabelColor }}>NEARBY</div>
          )}
        </div>

        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: 10,
          display: 'flex',
          justifyContent: 'center',
        }}>
          <ShipHoldPanel
            credits={hud.credits}
            cargoUsed={hud.cargoUsed}
            cargoCapacity={hud.cargoCapacity}
          />
        </div>

        <div style={{
          position: 'absolute',
          left: 'calc(50% + 174px)',
          bottom: 0,
          width: 400,
          height: 300,
          background: 'rgba(0, 6, 14, 0.1)',
          borderRadius: '2px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <VechPreview hud={hud} glbUrl={glbUrl} ship={currentShip} />
        </div>
      </div>
    </div>
  )
}

export default Elite
