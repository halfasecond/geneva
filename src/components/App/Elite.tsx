import React, { useEffect, useRef, useState } from 'react'
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
import type { AuthProps } from '../../types/auth'
import { EliteSim } from '../../elite/sim/EliteSim'
import type { EliteSnapshot, NpcAgent } from '../../elite/sim/core/types'
import { length } from '../../elite/sim/core/vector'
import {
  DEFAULT_ROUTE,
  getBodyById,
  getFrozenCartographyBodies,
  getRouteJumpCost,
  getTravelDistanceFrom,
} from '../../elite/sim/cartography'

// Tightening imports (config + extracted modules)
import {
  COLORS, MIND_RADAR, SCANNER_2D, VECH, VIEW, WORLD, HYPERSPACE, NPC, FUEL, MARKET, Z, DASHBOARD, WAYPOINTS,
  roleCss, roleColor, npcSizeForRole, BOREAL_STATION, DOCKED_RADAR,
} from '../../elite/config'
import {
  activateDockedService,
  buildDockedStationServices,
  drawDockedStationRadar2D,
  firstSelectableServiceIndex,
  stepDockedServiceIndex,
} from '../../elite/render/dockedRadar'
import { drawDockRadarIcon2D, drawMindRadarIcon2D, isMindContact, scannerDisplayPos2D } from '../../elite/render/radarIcons'
import { isDockContact, projectContacts } from '../../elite/sim/contacts'
import { getCargoUsed } from '../../elite/sim/market'
import { isBorealFreighterInBubble } from '../../elite/sim/borealDock'
import { bodyLocalPos, isInsideBubble, viewBasisFromAttitude } from '../../elite/sim/systemSpace'
import { computeWaypoints, type WaypointIndicator } from '../../elite/sim/waypoints'
import type { CartographyBody } from '../../elite/sim/cartography'
import { useFlightInput } from '../../elite/useFlightInput'
import * as CockpitRender from '../../elite/render/cockpit'
import { createVechHoloIcon, loadVechShipModel } from '../../elite/render/vech'
import * as HyperspaceRender from '../../elite/render/hyperspace'
import * as StationRender from '../../elite/render/station'
import {
  BIG_SHIP_MESH_VERSION,
  createBigShipMesh,
  isBigShipMesh,
  updateBigShipCityLights,
} from '../../elite/render/bigShip'
import {
  hasBorealDockBay,
  updateBorealDockBay,
} from '../../elite/render/borealDockBay'
import {
  CartographyOverlay,
  HyperspacePanel,
  HyperspaceCountdown,
  HyperspaceTunnel,
  CockpitStatusPanel,
  MarketOverlay,
  ShipUpgradesOverlay,
  VechPreview,
  ShipHoldPanel,
  WaypointOverlay,
  PositionDebug,
} from '../../elite/ui'

// Basic AuthProps shape we receive (wallet + controls)
type EliteProps = AuthProps & {
  // extra if needed
}

const glbUrl = VECH.defaultGlbUrl

const Elite: React.FC<EliteProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const simRef = useRef<EliteSim>(new EliteSim(2))
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
  const dockedServiceIndexRef = useRef(0)
  const [marketSnap, setMarketSnap] = useState<EliteSnapshot | null>(() => simRef.current.getSnapshot())

  // Cartography + hyperspace overlay state
  const [mapOpen, setMapOpen] = useState(false)
  const [route, setRoute] = useState(DEFAULT_ROUTE)
  const routeRef = useRef(route)
  routeRef.current = route

  const travelDistance = getTravelDistanceFrom(hud.systemPos2d, hud.systemId, route.destinationId)
  const destBody = getBodyById(route.destinationId, 'frozen')
  const [isHyperspacing, setIsHyperspacing] = useState(false)
  const [hyperspaceCountdown, setHyperspaceCountdown] = useState<number | null>(null)
  const hyperspaceJumpStartRef = useRef(0)
  const hyperspaceDestinationRef = useRef<string | null>(null)
  const hyperspaceCostRef = useRef(0)

  // Use the extracted flight input hook (replaces the old keysRef + onKeyDown/Up + getPlayerInput)
  const { getInput: getPlayerInput } = useFlightInput()

  // Keyboard "action" keys (m) that affect React state are handled in this dedicated effect.
  // Flight controls (thrust/yaw/pitch/roll) + their preventDefaults are handled inside useFlightInput.
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k === 'm' && hyperspacePhaseRef.current === 'idle') setMapOpen(o => !o)
      if (k === 'escape' && mapOpen && hyperspacePhaseRef.current === 'idle') setMapOpen(false)
      if (k === 'f' && hyperspacePhaseRef.current === 'idle') {
        const mode = snapRef.current?.player.flightMode
        if (mode === 'docked') {
          simRef.current.startUndocking()
          setMarketOpen(false)
          setUpgradesOpen(false)
        } else if (mode === 'normal' || mode === 'supercruise') {
          simRef.current.startDocking()
        }
      }
      if (k === 'escape' && snapRef.current?.player.flightMode === 'docked') {
        if (marketOpen) setMarketOpen(false)
        else if (upgradesOpen) setUpgradesOpen(false)
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
          })
          if (result.undock) {
            simRef.current.startUndocking()
            setMarketOpen(false)
            setUpgradesOpen(false)
            setMarketSnap(simRef.current.getSnapshot())
            return
          }
          if (result.refuel) simRef.current.refuel()
          setMarketOpen(result.marketOpen)
          setUpgradesOpen(result.upgradesOpen)
          setMarketSnap(simRef.current.getSnapshot())
        }
      }
    }
    window.addEventListener('keydown', handleGlobalKeys, true)
    return () => window.removeEventListener('keydown', handleGlobalKeys, true)
  }, [mapOpen, marketOpen, upgradesOpen])

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
    loadVechShipModel(glbUrl, shipIcon)

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
        const services = buildDockedStationServices({
          fuel: snap.player.fuel ?? FUEL.starting,
          fuelMax: FUEL.max,
          marketOpen: false,
          upgradesOpen: false,
        })
        dockedServiceIndexRef.current = firstSelectableServiceIndex(services)
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



  // 2D side-on ~20deg angled "nearby things" scanner in the bottom dashboard (always visible, center bottom).
  // Larger rectangular holo panel. Contacts projected so lateral spreads horizontally, elevation is direct vertical offset
  // from the receding angled depth plane (20deg pitch), range recedes up-screen. Yellow height sticks for vertical clarity.
  // Real NPCs + carto bodies + persistent demo contacts (for immediate visual of vertical/range/lateral).
  useEffect(() => {
    const canvas = radar2DCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf: number
    const drawRadar = () => {
      // Side-on ~20deg angled "nearby things" scanner (not top-down circular).
      // Larger for the always-visible center-bottom dashboard radar.
      // Horizontal = lateral (left/right of heading) + slight depth perspective.
      // Vertical = elevation (above/below plane) with clear sticks.
      // Depth/range recedes upward on screen via 20deg pitch projection so you can "see" the 3D volume.
      // Matches classic Elite scanner spirit but with explicit vertical awareness from a shallow angle.
      //
      // All tunables (including the container position for "move the section up") are in SCANNER_2D in src/elite/config.ts
      // (this was the main place the layout was set before; drawing constants were also duplicated here).

      const W = canvas.width
      const H = canvas.height
      const cx = W * 0.5

      // Use centralized values from config (previously many magic numbers here)
      const baseY = H * SCANNER_2D.baseYFactor
      const pitchRad = SCANNER_2D.pitchDeg * Math.PI / 180
      const depthFactor = SCANNER_2D.depthFactor
      const elevFactor = SCANNER_2D.elevFactor
      const latFactor = SCANNER_2D.latFactor

      // Background
      ctx.fillStyle = 'rgba(0,0,0,0.78)'
      ctx.fillRect(0, 0, W, H)

      // Receding range grid lines (angled 20deg plane) - vech blue
      ctx.strokeStyle = SCANNER_2D.gridColor
      ctx.lineWidth = 1
      const numLines = SCANNER_2D.numRangeLines
      for (let i = 0; i <= numLines; i++) {
        const t = i / numLines
        const z = t * SCANNER_2D.maxZ
        const y = baseY - z * Math.sin(pitchRad) * depthFactor
        const halfW = SCANNER_2D.halfWidthBase * (1 - t * SCANNER_2D.taper)
        ctx.beginPath()
        ctx.moveTo(cx - halfW, y)
        ctx.lineTo(cx + halfW, y)
        ctx.stroke()
      }

      // Side walls of the scan volume (tapered)
      // Note: wall base width 280 (slightly wider than grid halfWidthBase 272); slant uses sideWallZ
      ctx.beginPath()
      ctx.moveTo(cx - 280, baseY)
      ctx.lineTo(cx - 120, baseY - SCANNER_2D.sideWallZ * Math.sin(pitchRad) * depthFactor)
      ctx.moveTo(cx + 280, baseY)
      ctx.lineTo(cx + 120, baseY - SCANNER_2D.sideWallZ * Math.sin(pitchRad) * depthFactor)
      ctx.stroke()

      // Bright local/base plane line
      ctx.strokeStyle = SCANNER_2D.brightColor
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.moveTo(cx - SCANNER_2D.brightPlaneHalfW, baseY)
      ctx.lineTo(cx + SCANNER_2D.brightPlaneHalfW, baseY)
      ctx.stroke()

      // Player own-ship marker (chevron pointing forward on the local line)
      ctx.fillStyle = SCANNER_2D.playerColor
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cx, baseY - SCANNER_2D.chevron.back)
      ctx.lineTo(cx - SCANNER_2D.chevron.side, baseY + SCANNER_2D.chevron.fwd)
      ctx.lineTo(cx + SCANNER_2D.chevron.side, baseY + SCANNER_2D.chevron.fwd)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = SCANNER_2D.playerColor
      ctx.beginPath()
      ctx.moveTo(cx - 6, baseY + 4)
      ctx.lineTo(cx, baseY - 4)
      ctx.lineTo(cx + 6, baseY + 4)
      ctx.stroke()

      const p = snapRef.current?.player
      if (!p) {
        raf = requestAnimationFrame(drawRadar)
        return
      }

      if (p.flightMode === 'docked' && p.dockedAtStationId) {
        const body = getBodyById(p.dockedAtStationId, 'frozen')
        const dockedServices = buildDockedStationServices({
          fuel: p.fuel ?? FUEL.starting,
          fuelMax: FUEL.max,
          marketOpen: marketOpenRef.current,
          upgradesOpen: upgradesOpenRef.current,
        })
        if (!dockedServices[dockedServiceIndexRef.current]?.available) {
          dockedServiceIndexRef.current = firstSelectableServiceIndex(dockedServices)
        }
        drawDockedStationRadar2D(ctx, W, H, {
          stationName: body?.name ?? 'Station',
          services: dockedServices,
          selectedIndex: dockedServiceIndexRef.current,
        })
        raf = requestAnimationFrame(drawRadar)
        return
      }

      const fwd = p.heading
      const upv = p.up || { x: 0, y: 1, z: 0 }
      const carto = getFrozenCartographyBodies()
      const sys2d = p.systemPos2d
      const radarBodies = carto
        .filter(b => b.type !== 'star')
        .map(b => ({
          id: b.id,
          name: b.name,
          type: b.type,
          pos3d: bodyLocalPos(b, sys2d),
        }))

      const contacts = projectContacts(
        { pos: p.pos, heading: fwd, up: upv },
        snapRef.current?.npcs || [],
        radarBodies,
        { maxShip: SCANNER_2D.maxRangeShip, maxBody: SCANNER_2D.maxRangeBody, maxMind: MIND_RADAR.maxRange }
      )

      contacts.forEach((c) => {
        const { sx, sy, planeY, distant } = scannerDisplayPos2D(c, cx, baseY, pitchRad)

        const size = Math.max(SCANNER_2D.sizeFar, SCANNER_2D.sizeNear * (1 - Math.min(1, c.dist / SCANNER_2D.sizeDistDiv)))

        // Elevation stick (from the angled plane up/down to the contact) - now vech blue
        if (Math.abs(c.y) > 5) {
          ctx.strokeStyle = SCANNER_2D.elevationStickColor
          ctx.lineWidth = 1.2
          ctx.beginPath()
          ctx.moveTo(sx, planeY)
          ctx.lineTo(sx, sy)
          ctx.stroke()
        }

        if (c.type === 'ship') {
          ctx.save()
          ctx.translate(sx, sy)
          if (isMindContact(c)) {
            if (distant) ctx.globalAlpha = 0.72
            drawMindRadarIcon2D(ctx, size * MIND_RADAR.sizeMul2d)
            if (distant) ctx.globalAlpha = 1
          } else {
            const shipSize = size
            ctx.fillStyle = roleCss(c.role)
            ctx.beginPath()
            ctx.moveTo(0, -shipSize)
            ctx.lineTo(-shipSize * 0.48, shipSize * 0.38)
            ctx.lineTo(0, shipSize * 0.12)
            ctx.lineTo(shipSize * 0.48, shipSize * 0.38)
            ctx.closePath()
            ctx.fill()
          }
          ctx.restore()
        } else if (isDockContact(c)) {
          ctx.save()
          ctx.translate(sx, sy)
          if (distant) ctx.globalAlpha = 0.82
          drawDockRadarIcon2D(ctx, size * 1.15)
          if (distant) ctx.globalAlpha = 1
          ctx.restore()
        } else {
          ctx.fillStyle = c.type === 'station' ? '#88ddff' : '#aaccff'
          ctx.beginPath()
          ctx.arc(sx, sy, size * (c.type === 'station' ? 1.08 : 0.82), 0, Math.PI * 2)
          ctx.fill()
          if (c.type === 'station') {
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 0.7
            ctx.beginPath()
            ctx.moveTo(sx - size * 0.38, sy)
            ctx.lineTo(sx + size * 0.38, sy)
            ctx.moveTo(sx, sy - size * 0.38)
            ctx.lineTo(sx, sy + size * 0.38)
            ctx.stroke()
            ctx.lineWidth = 1
          }
        }

        // Mind / dock designation + distance labels
        if (isMindContact(c) && c.dist < MIND_RADAR.labelDist) {
          ctx.fillStyle = MIND_RADAR.colors.ring2d
          ctx.font = 'bold 9px monospace'
          ctx.fillText(c.designation ?? c.name ?? 'MIND', sx + size * 2.2, sy - 5)
        }
        if (isDockContact(c) && c.dist < MIND_RADAR.labelDist) {
          ctx.fillStyle = '#66aaff'
          ctx.font = 'bold 9px monospace'
          ctx.fillText(c.name ?? 'DOCK', sx + size * 2.4, sy - 5)
        }
        if (c.dist < SCANNER_2D.labelDist) {
          ctx.fillStyle = SCANNER_2D.labelColor
          ctx.font = '8px monospace'
          const mind = isMindContact(c)
          const dock = isDockContact(c)
          ctx.fillText(
            Math.round(c.dist).toString(),
            mind || dock ? sx + size * 2.2 : sx + size + 6,
            mind || dock ? sy + 6 : sy + 3,
          )
        }
      })

      raf = requestAnimationFrame(drawRadar)
    }

    drawRadar()

    return () => { if (raf) cancelAnimationFrame(raf) }
  }, [mapOpen])  // re-draws on map toggle too, but always runs for ship UI

  const handleInitiateHyperspace = () => {
    if (hyperspacePhaseRef.current !== 'idle') return
    const d = getBodyById(route.destinationId, 'frozen')
    if (!d) return
    const snap = simRef.current.getSnapshot()
    const cost = getRouteJumpCost(snap.player.systemPos2d, snap.player.systemId, route)
    if (hud.fuel < cost) return

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

      {!mapOpen && (
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
          onClose={() => setUpgradesOpen(false)}
        />
      )}

      {mapOpen && (
        <>
          <CartographyOverlay
            route={route}
            playerPos={hud.systemPos2d}
            onRouteChange={setRoute}
          />
          <HyperspacePanel
            route={route}
            fromPos2d={hud.systemPos2d}
            systemId={hud.systemId}
            fuel={hud.fuel}
            flightMode={hud.flightMode}
            isHyperspacing={isHyperspacing}
            onInitiateHyperspace={handleInitiateHyperspace}
          />
        </>
      )}

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
        {!mapOpen && (
          <CockpitStatusPanel
            flightMode={hud.flightMode}
            dockedAtStationId={hud.dockedAtStationId}
            destinationId={route.destinationId}
            travelDistance={travelDistance}
          />
        )}

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
          <VechPreview hud={hud} glbUrl={glbUrl} />
        </div>
      </div>
    </div>
  )
}

export default Elite
