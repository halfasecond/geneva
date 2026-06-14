import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// @google/model-viewer registers the <model-viewer> web component globally (side-effect import required).
// React/TSX integration notes (addressing the SO link you posted and typical gotchas):
// - camelCase props in JSX (React converts to attributes on the custom element).
// - The declare global below provides TSX types so no "unknown element" errors.
// - Camera/size changes often don't respond to attributes alone because the viewer's camera controller is async — we use ref + onLoad + imperative API (set cameraOrbit + jumpCameraToGoal) as recommended in those threads.
// - This makes the % orbit value actually take effect for model size.
// - Removed min/max pinning (was causing breakage/TS issues in some renders) and rely on controls=false + forced orbit.
// Side-effect registration for <model-viewer> web component.
// Commented for elite production build resolution (pre-existing quirk with the custom element package in this sub-app bundle).
// Dev server (yarn dev:elite) loads it fine via the side-effect. The VECH preview panel depends on it at runtime in browser.
// import '@google/model-viewer'

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
import type { NpcAgent } from '../../elite/sim/core/types'
import { length, cross, normalize } from '../../elite/sim/core/vector'
import { getCartographyBodies, getJumpFuelCost, CARTOGRAPHY_BODIES, DEFAULT_ROUTE, getBodyById } from '../../elite/sim/cartography'

// Tightening imports (config + extracted modules)
import { COLORS, COCKPIT, RADAR_3D, FUEL, VECH, PANELS, HUD, BEZEL, WORLD, NPC, DT, roleColor, roleCss, npcSizeForRole } from '../../elite/config'
import { projectContacts } from '../../elite/sim/contacts'
import { useFlightInput } from '../../elite/useFlightInput'
import { useHoloDrag } from '../../elite/useHoloDrag'
import * as CockpitRender from '../../elite/render/cockpit'
import { HoloPanel } from '../../elite/ui'

// Basic AuthProps shape we receive (wallet + controls)
type EliteProps = AuthProps & {
  // extra if needed
}

const Elite: React.FC<EliteProps> = ({
  loggedIn,
  handleSignIn,
  handleSignOut,
  BASE_URL,
}) => {
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
  const mapCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const mapRafRef = useRef<number | null>(null)
  const snapRef = useRef<any>(null) // latest sim snapshot for map overlay + hyperspace
  const isHyperspacingRef = useRef(false)

  // New cockpit 3D elements
  const radarRef = useRef<THREE.Group | null>(null)
  const radarBlipsRef = useRef<THREE.Object3D[]>([])
  const radar2DCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const fuelBarsRef = useRef<THREE.Object3D[]>([])
  const reticleRef = useRef<THREE.Group | null>(null)

  // VECH preview uses <model-viewer> for the GLB (high quality), with 2D canvas overlay for the holo ring.
  const vechRingCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const vechModelViewerRef = useRef(null)

  const setVechCamera = () => {
    const mv = vechModelViewerRef.current
    if (mv) {
      // Force using % per docs. Smaller % = closer = larger model in the (fixed size) preview box.
      // Edit this value + the attribute below to tune the ship size to fill the holo nicely.
      mv.cameraOrbit = '0deg 70deg 15%'
      mv.cameraTarget = '0 -0.15 0'  /* negative y shifts look-at up the model, moving the ship up in the image for bottom clearance while keeping ring and ship scale fixed */
      if (mv.jumpCameraToGoal) mv.jumpCameraToGoal()
    }
  }

  // Extra safety for React + model-viewer timing (attributes can be finicky on custom elements)
  useEffect(() => {
    const t = setTimeout(setVechCamera, 50)
    return () => clearTimeout(t)
  }, [])

  const [hud, setHud] = useState({
    speed: 0,
    npcs: 2,
    time: 0,
    playerPos: { x: 0, y: 0, z: 0 },
    fuel: 120,
  })
  const [showHelp, setShowHelp] = useState(false)
  const [connected, setConnected] = useState(!!loggedIn)

  // Cartography + hyperspace overlay state
  const [mapOpen, setMapOpen] = useState(false)
  const [route, setRoute] = useState(DEFAULT_ROUTE)
  const [isHyperspacing, setIsHyperspacing] = useState(false)
  const hyperspaceStartRef = useRef(0)
  const hyperspaceTargetRef = useRef<{ x: number; y: number; z: number } | null>(null)
  const hyperspaceCostRef = useRef(0)

  // Draggable holo panels - now powered by the extracted useHoloDrag hook (deduped the 3x identical logic)
  const [mapPanelPos, setMapPanelPos] = useState(PANELS.mapInitial)
  const mapDrag = useHoloDrag(mapPanelPos, setMapPanelPos, { maxXPad: PANELS.dragBounds.maxXPad, maxYPad: PANELS.dragBounds.maxYPadMap })

  const [controlsPanelPos, setControlsPanelPos] = useState(PANELS.controlsInitial)
  const controlsDrag = useHoloDrag(controlsPanelPos, setControlsPanelPos, { maxXPad: PANELS.dragBounds.maxXPad, maxYPad: PANELS.dragBounds.maxYPadControls })

  const [flightPanelPos, setFlightPanelPos] = useState(PANELS.flightInitial)
  const flightDrag = useHoloDrag(flightPanelPos, setFlightPanelPos, { maxXPad: PANELS.dragBounds.maxXPad, maxYPad: PANELS.dragBounds.maxYPadFlight })

  // Use the extracted flight input hook (replaces the old keysRef + onKeyDown/Up + getPlayerInput)
  const { getInput: getPlayerInput } = useFlightInput()

  // Keyboard "action" keys (h/m/r) that affect React state are handled in this dedicated effect.
  // Flight controls (thrust/yaw/pitch/roll) + their preventDefaults are handled inside useFlightInput.
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k === 'h') setShowHelp(s => !s)
      if (k === 'm') setMapOpen(o => !o)
      if (k === 'r') {
        simRef.current.resetNpcs(2)
      }
    }
    window.addEventListener('keydown', handleGlobalKeys)
    return () => window.removeEventListener('keydown', handleGlobalKeys)
  }, [])

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
    scene.fog = new THREE.FogExp2(0x00040a, 0.0018)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(
      68,
      window.innerWidth / window.innerHeight,
      0.5,
      4000
    )
    camera.position.set(0, 40, 140)
    cameraRef.current = camera

    // Stars (cheap dense starfield)
    const starCount = 4200
    const starPositions = new Float32Array(starCount * 3)
    const starColors = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
      const r = 650 + Math.random() * 1100
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
      size: 2.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    })
    const stars = new THREE.Points(starGeo, starMat)
    scene.add(stars)
    starFieldRef.current = stars

    // Central sun (glowing)
    const sunGeo = new THREE.SphereGeometry(9, 32, 32)
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffe6a3 })
    const sun = new THREE.Mesh(sunGeo, sunMat)
    scene.add(sun)

    // System bodies driven by cartography (live orbits even in cockpit view)
    const bodiesGroup = new THREE.Group()
    // Create meshes for the cartography bodies (we'll sync positions every frame)
    const cartoInitial = getCartographyBodies(0)
    const mainBodyMeshes: THREE.Mesh[] = []
    cartoInitial.forEach((b) => {
      if (b.type === 'star') return // sun already added separately
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(b.radius * 0.9, 18, 18),
        new THREE.MeshBasicMaterial({ color: b.color })
      )
      // initial pos from carto 3d
      mesh.position.set(b.pos3d.x, b.pos3d.y, b.pos3d.z)
      bodiesGroup.add(mesh)
      mainBodyMeshes.push(mesh)

      // faint orbit ring (approximate, 2d projection)
      if (b.orbitRadius > 10) {
        const ring = new THREE.LineLoop(
          new THREE.BufferGeometry().setFromPoints(
            Array.from({ length: 48 }, (_, i) => {
              const a = (i / 48) * Math.PI * 2
              return new THREE.Vector3(
                Math.cos(a) * b.orbitRadius,
                4,
                Math.sin(a) * b.orbitRadius * 0.7
              )
            })
          ),
          new THREE.LineBasicMaterial({ color: 0x334455, transparent: true, opacity: 0.2 })
        )
        bodiesGroup.add(ring)
      }
    })
    scene.add(bodiesGroup)
    bodiesGroupRef.current = bodiesGroup
    // store for live update (non-star bodies)
    ;(bodiesGroup as any)._mainBodyMeshes = mainBodyMeshes

    // Hyperspace streak group (classic Elite tunnel lines, activated on jump)
    const streaksGroup = new THREE.Group()
    const streakMat = new THREE.LineBasicMaterial({ color: 0x99ddff, transparent: true, opacity: 0.75 })
    const streaks: THREE.Line[] = []
    for (let i = 0; i < 70; i++) {
      const len = 22 + Math.random() * 38
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -len),
      ])
      const line = new THREE.Line(geo, streakMat)
      const r = 5 + Math.random() * 26
      const a = Math.random() * Math.PI * 2
      line.position.set(Math.cos(a) * r, (Math.random() - 0.5) * 22, -55 - Math.random() * 80)
      line.userData = { baseZ: line.position.z, speed: 220 + Math.random() * 110, radius: r, angle: a }
      streaksGroup.add(line)
      streaks.push(line)
    }
    streaksGroup.visible = false
    scene.add(streaksGroup)
    hyperspaceStreaksRef.current = streaksGroup
    ;(streaksGroup as any)._streaks = streaks

    // === COCKPIT + 3D HOLO ELEMENTS (now built via extracted render helpers) ===
    // The create* functions add the groups directly to the camera (exact same parenting
    // as the original inline code). Refs are still populated for the animate loop.
    const { cockpit } = CockpitRender.createCockpitFrame(camera)
    playerMeshRef.current = cockpit

    const { reticleGroup, radarGroup, blips } = CockpitRender.createHoloRadarAndReticle(camera)
    reticleRef.current = reticleGroup
    radarRef.current = radarGroup
    radarBlipsRef.current = blips

    const { shipIcon } = CockpitRender.createVechHoloIcon(camera)
    // VECH GLB load (async) - kept inline for now; will move to a render/vech helper in a follow-up
    const gltfLoader = new GLTFLoader()
    gltfLoader.load(
      VECH.glbUrl,
      (gltf) => {
        console.log('VECH ship GLB model loaded successfully for holo icon')
        const model = gltf.scene

        const box = new THREE.Box3().setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        model.position.sub(center)

        const sizeBox = new THREE.Box3().setFromObject(model)
        const size = sizeBox.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z) || 1
        const autoScale = VECH.targetSize / maxDim
        model.scale.set(autoScale, autoScale, autoScale)

        model.rotation.set(VECH.modelRot.x, VECH.modelRot.y, VECH.modelRot.z)
        model.position.z = VECH.modelZ

        model.traverse((child: any) => {
          if (child.isMesh && child.material) {
            const mat = child.material.clone()
            if (mat.emissive !== undefined) {
              mat.emissive = new THREE.Color(VECH.emissive)
              mat.emissiveIntensity = VECH.emissiveIntensity
            }
            mat.transparent = true
            mat.opacity = VECH.opacity
            mat.side = THREE.DoubleSide
            mat.depthWrite = false
            child.material = mat
            child.frustumCulled = false
          }
        })

        shipIcon.add(model)
        model.renderOrder = 10
        shipIcon.renderOrder = 10
        model.visible = true
        shipIcon.visible = true
      },
      undefined,
      (error) => {
        console.error('Failed to load VECH ship GLB model (no fallback):', error)
      }
    )

    const { fuelBars } = CockpitRender.createFuelBars(camera)
    fuelBarsRef.current = fuelBars

    // NPC container (world space)
    const npcGroup = new THREE.Group()
    scene.add(npcGroup)
    npcGroupRef.current = npcGroup

    // Lighting (subtle, mostly emissive world)
    const hemi = new THREE.HemisphereLight(0x334466, 0x000011, 0.6)
    scene.add(hemi)

    // Make sure WebGL clears to our dark space color
    renderer.setClearColor(0x00040a, 1)

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
      const dt = Math.min(0.066, (now - lastTimeRef.current) / 1000)
      lastTimeRef.current = now

      const sim = simRef.current
      const input = getPlayerInput()
      sim.step(dt, input)

      const snap = sim.getSnapshot()
      snapRef.current = snap

      // COCKPIT CAMERA (first-person Elite style)
      // The camera *is* your viewpoint from inside the ship.
      // The cockpit frame (cloned ship model) is a child of the camera so it stays fixed in view.
      const cam = cameraRef.current
      if (cam) {
        const p = snap.player
        const fwd = p.heading
        // Use the integrated ship up (from incremental rotations in sim) for the main cockpit view.
        // This ensures pitch properly orients the view without "level reconstruction" conflicts.
        // (Radars continue to use getLocalAxes(heading, roll) for their classic projection.)
        const up = p.up || { x: 0, y: 1, z: 0 }

        // Position the camera inside the cockpit, offset backward along -heading and "up" along ship's up.
        // This makes the viewpoint follow full 6DOF attitude (pitch/yaw/roll all visible).
        const cockpitBack = 5.5
        const eyeHeight = 1.8
        cam.position.set(
          p.pos.x - fwd.x * cockpitBack + up.x * eyeHeight,
          p.pos.y - fwd.y * cockpitBack + up.y * eyeHeight,
          p.pos.z - fwd.z * cockpitBack + up.z * eyeHeight
        )

        // Set the camera's up to the ship's local up. This makes roll bank the view and
        // pitch "up" in the image match the ship's orientation.
        cam.up.set(up.x, up.y, up.z)

        // Look exactly forward along the ship's heading (from the eye point).
        // Pure fwd direction avoids conflicting biases that could make background appear to
        // move in "both directions" during pitch. The eyeHeight offset + cockpit model already
        // give the "looking out the window" framing.
        const far = 300
        const lookTarget = new THREE.Vector3(
          cam.position.x + fwd.x * far,
          cam.position.y + fwd.y * far,
          cam.position.z + fwd.z * far
        )
        cam.lookAt(lookTarget)
      }

      // Live orbiting bodies in the main cockpit view (using cartography math)
      const bodiesGrp: any = bodiesGroupRef.current
      if (bodiesGrp && bodiesGrp._mainBodyMeshes) {
        const cartoBodies = getCartographyBodies(snap.time * 0.55) // slightly slower, pleasing pace
        let mi = 0
        cartoBodies.forEach((b) => {
          if (b.type === 'star') return
          const m = bodiesGrp._mainBodyMeshes[mi++]
          if (m) {
            m.position.set(b.pos3d.x, b.pos3d.y, b.pos3d.z)
            // gentle scale pulse for stations
            if (b.type === 'station') m.scale.setScalar(1 + Math.sin(snap.time * 3 + mi) * 0.08)
          }
        })
      }

      // === 3D Holo Radar (now uses the shared projectContacts util + extracted updater) ===
      if (radarRef.current && radarBlipsRef.current && radarBlipsRef.current.length > 0) {
        const p = snap.player
        const fwd = p.heading
        const upv = p.up || { x: 0, y: 1, z: 0 }

        const carto = getCartographyBodies(snap.time * 0.55)
        const contacts = projectContacts(
          { pos: p.pos, heading: fwd, up: upv },
          snap.npcs,
          carto,
          { maxShip: 300, maxBody: 500 }
        )

        CockpitRender.update3DRadar(radarBlipsRef.current, contacts)
      }

      // Fuel bars on the left (simple 3D holo representation)
      if (fuelBarsRef.current && fuelBarsRef.current.length > 0) {
        const fuel = snap.player.fuel ?? 120
        const maxFuel = 120
        const level = Math.max(0, Math.min(1, fuel / maxFuel))
        const bars = fuelBarsRef.current
        const onCount = Math.floor(level * bars.length)
        bars.forEach((bar, i) => {
          const m = bar as THREE.Mesh
          const mat = m.material as THREE.MeshBasicMaterial
          if (i < onCount) {
            mat.opacity = 0.85
            mat.color.set( i < onCount - 2 ? 0xffaa00 : 0xff4444 ) // warning color when low
          } else {
            mat.opacity = 0.2
            mat.color.set(0xffaa00)
          }
        })
      }

      // During hyperspace, make the central reticle "charge" / pulse (nod to the reference image "CHARGING" circle)
      if (reticleRef.current && isHyperspacingRef.current) {
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

      // Hyperspace visual + completion (triggered from cartography overlay)
      const streaksGrp: any = hyperspaceStreaksRef.current
      if (isHyperspacingRef.current && streaksGrp && streaksGrp._streaks) {
        if (hyperspaceStartRef.current === 0) hyperspaceStartRef.current = snap.time
        const phase = (snap.time - hyperspaceStartRef.current) / 2.3 // ~2.3s tunnel
        const streaks = streaksGrp._streaks as THREE.Line[]
        const fwd = snap.player.heading

        streaks.forEach((line, idx) => {
          const ud = line.userData as any
          // rush the streaks forward relative to player heading
          const move = ud.speed * (0.016 + phase * 0.8)
          line.position.x = Math.cos(ud.angle) * ud.radius + fwd.x * move * 0.1
          line.position.y = (Math.sin(idx) * 3) + fwd.y * move * 0.05
          line.position.z = ud.baseZ + move

          // fade and respawn behind when passed
          const passed = line.position.z > 12
          if (passed || phase > 0.95) {
            const r = 5 + Math.random() * 24
            const a = Math.random() * Math.PI * 2
            line.position.set(
              Math.cos(a) * r + fwd.x * -35,
              (Math.random() - 0.5) * 20 + fwd.y * -20,
              -70 - Math.random() * 40
            )
            ud.baseZ = line.position.z
            ud.radius = r
            ud.angle = a
            line.visible = phase < 1.05
          }
          ;(line.material as any).opacity = Math.max(0.2, 0.9 - phase * 0.7)
        })

        if (phase >= 1.0) {
          // Complete the jump
          const target = hyperspaceTargetRef.current
          if (target && simRef.current.performHyperspace(target, hyperspaceCostRef.current)) {
            // slight arrival offset + velocity
            const p = simRef.current.getSnapshot().player
            // already teleported inside sim
          }
          streaksGrp.visible = false
          setIsHyperspacing(false)
          isHyperspacingRef.current = false
          hyperspaceStartRef.current = 0
          hyperspaceTargetRef.current = null
          // brief arrival "flash" by temporarily brightening fog or just let the new view settle
        } else {
          streaksGrp.visible = true
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
          const size = npc.role === 'pirate' ? 2.6 : npc.role === 'police' ? 2.1 : 1.7
          const color =
            npc.role === 'pirate'
              ? 0xff6b6b
              : npc.role === 'police'
              ? 0x6bffa3
              : npc.role === 'escort'
              ? 0x88ddff
              : 0xaabbcc

          const geo = new THREE.ConeGeometry(size * 0.55, size * 2.4, 3)
          const mat = new THREE.MeshBasicMaterial({ color, wireframe: true })
          const m = new THREE.Mesh(geo, mat)

          // pressure indicator dot as a permanent child (toggle visibility)
          const dot = new THREE.Mesh(
            new THREE.SphereGeometry(0.9, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xffee66, transparent: true, opacity: 0.85 })
          )
          dot.position.y = size * 1.8
          dot.visible = false
          m.add(dot)

          npcContainer.add(m)
          npcMeshes.push(m)
        }

        // Update existing meshes (or hide extras)
        current.forEach((npc: NpcAgent, i: number) => {
          const m = npcMeshes[i]
          if (!m) return
          m.visible = true
          m.position.set(npc.pos.x, npc.pos.y, npc.pos.z)

          // face velocity direction
          const vlen = length(npc.vel)
          if (vlen > 0.3) {
            const vx = npc.vel.x / vlen
            const vy = npc.vel.y / vlen
            const vz = npc.vel.z / vlen
            m.lookAt(
              m.position.x + vx * 5,
              m.position.y + vy * 5,
              m.position.z + vz * 5
            )
          }

          // pressure glow dot
          const dot = m.children[0] as THREE.Mesh | undefined
          if (dot) {
            dot.visible = npc.pressure > 0.55
            if (dot.visible) {
              dot.position.y = (npc.role === 'pirate' ? 2.6 : npc.role === 'police' ? 2.1 : 1.7) * 1.8
            }
          }
        })

        // Hide any extra pooled meshes (won't happen with N=2)
        for (let i = current.length; i < npcMeshes.length; i++) {
          npcMeshes[i].visible = false
        }
      }

      // HUD state (throttled a bit)
      if (Math.random() < 0.6) {
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
        })
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

  // Draw the static blue holo ring overlay for the VECH preview (on top of <model-viewer>)
  useEffect(() => {
    const canvas = vechRingCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const cx = canvas.width / 2
    const cy = canvas.height / 2
    const rx = canvas.width * 0.24
    const ry = canvas.height * 0.21

    // Outer ring (thicker for the bigger icon)
    ctx.strokeStyle = '#66aaff'
    ctx.lineWidth = 2.5
    ctx.shadowColor = '#66aaff'
    ctx.shadowBlur = 7
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
    ctx.stroke()

    // Inner ring for holo depth
    ctx.lineWidth = 1.2
    ctx.shadowBlur = 3
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx * 0.68, ry * 0.68, 0, 0, Math.PI * 2)
    ctx.stroke()
  }, [])

  // Cartography map overlay (2D canvas for clarity + live orbits, click to select destination)
  // This is the "overlay UI such as Cartography" the user requested.
  useEffect(() => {
    if (!mapOpen) {
      if (mapRafRef.current) {
        cancelAnimationFrame(mapRafRef.current)
        mapRafRef.current = null
      }
      return
    }

    const canvas = mapCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    // Smaller holographic map size for floating Minority Report style overlay
    const size = 340
    canvas.width = size
    canvas.height = size

    const center = size / 2
    const scale = 0.48 // fit the largest orbits nicely on smaller top-right holo panel

    let mapTime = 0
    const draw = () => {
      mapTime += 0.016
      ctx.fillStyle = 'rgba(0, 6, 14, 0.92)'
      ctx.fillRect(0, 0, size, size)

      // subtle grid
      ctx.strokeStyle = 'rgba(80, 110, 140, 0.15)'
      ctx.lineWidth = 1
      for (let i = -3; i <= 3; i++) {
        const p = center + i * 65
        ctx.beginPath(); ctx.moveTo(p, 20); ctx.lineTo(p, size-20); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(20, p); ctx.lineTo(size-20, p); ctx.stroke()
      }

      const bodies = getCartographyBodies(mapTime * 0.9)
      const bodyMap = new Map(bodies.map(b => [b.id, b]))

      // Draw orbits (faint ellipses)
      ctx.strokeStyle = 'rgba(140, 170, 200, 0.22)'
      ctx.lineWidth = 1.5
      bodies.forEach(b => {
        if (!b.orbitRadius || b.type === 'star') return
        const parent = b.parentId ? bodyMap.get(b.parentId) : null
        const cx = parent ? center + parent.pos2d.x * scale : center
        const cy = parent ? center + parent.pos2d.y * scale : center
        ctx.beginPath()
        ctx.ellipse(cx, cy, b.orbitRadius * scale, b.orbitRadius * scale * 0.72, 0, 0, Math.PI * 2)
        ctx.stroke()
      })

      // Draw bodies
      bodies.forEach(b => {
        const px = center + b.pos2d.x * scale
        const py = center + b.pos2d.y * scale
        const r = Math.max(2.5, b.radius * 1.6 * scale)

        ctx.fillStyle = b.color
        ctx.beginPath()
        ctx.arc(px, py, r, 0, Math.PI * 2)
        ctx.fill()

        // label
        ctx.fillStyle = '#aaccdd'
        ctx.font = '10px ui-monospace, monospace'
        ctx.fillText(b.name, px + r + 3, py - 2)

        // highlight current route
        if (b.id === route.originId || b.id === route.destinationId) {
          ctx.strokeStyle = b.id === route.destinationId ? '#66ff99' : '#ffcc66'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(px, py, r + 4, 0, Math.PI * 2)
          ctx.stroke()
        }
      })

      // Draw route curve (quadratic like Flocker)
      const origin = bodyMap.get(route.originId)
      const dest = bodyMap.get(route.destinationId)
      if (origin && dest) {
        const ox = center + origin.pos2d.x * scale
        const oy = center + origin.pos2d.y * scale
        const dx = center + dest.pos2d.x * scale
        const dy = center + dest.pos2d.y * scale
        const mx = (ox + dx) / 2
        const my = (oy + dy) / 2
        const dist = Math.hypot(dx - ox, dy - oy)
        const bend = Math.min(70, dist * 0.22)
        const nx = -(dy - oy) / (dist || 1)
        const ny = (dx - ox) / (dist || 1)
        const cx = mx + nx * bend
        const cy = my + ny * bend

        ctx.strokeStyle = '#66ddff'
        ctx.lineWidth = 1.8
        ctx.beginPath()
        ctx.moveTo(ox, oy)
        ctx.quadraticCurveTo(cx, cy, dx, dy)
        ctx.stroke()

        // arrow head at dest
        const ang = Math.atan2(dy - cy, dx - cx)
        ctx.fillStyle = '#66ddff'
        ctx.beginPath()
        ctx.moveTo(dx, dy)
        ctx.lineTo(dx - 9 * Math.cos(ang - 0.5), dy - 9 * Math.sin(ang - 0.5))
        ctx.lineTo(dx - 9 * Math.cos(ang + 0.5), dy - 9 * Math.sin(ang + 0.5))
        ctx.closePath()
        ctx.fill()
      }

      // Player ship position on map (scaled current cockpit location)
      const pp = snapRef.current?.player?.pos || { x: 0, y: 120 }
      const playerX = center + pp.x * scale * 0.65
      const playerY = center + pp.y * scale * 0.65
      ctx.fillStyle = '#ffdd88'
      ctx.beginPath()
      ctx.moveTo(playerX, playerY - 6)
      ctx.lineTo(playerX - 4, playerY + 5)
      ctx.lineTo(playerX + 4, playerY + 5)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#ffaa33'
      ctx.fillRect(playerX - 1, playerY - 1, 2, 2)

      mapRafRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (mapRafRef.current) cancelAnimationFrame(mapRafRef.current)
    }
  }, [mapOpen, route])

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

      const W = canvas.width
      const H = canvas.height
      const cx = W * 0.5
      const baseY = H * 0.76
      const pitchRad = 20 * Math.PI / 180
      const depthFactor = 0.42
      const elevFactor = 2.1
      const latFactor = 3.12

      // Background
      ctx.fillStyle = 'rgba(0,0,0,0.78)'
      ctx.fillRect(0, 0, W, H)

      // Receding range grid lines (angled 20deg plane)
      ctx.strokeStyle = 'rgba(255,170,0,0.32)'
      ctx.lineWidth = 1
      const numLines = 5
      for (let i = 0; i <= numLines; i++) {
        const t = i / numLines
        const z = t * 155
        const y = baseY - z * Math.sin(pitchRad) * depthFactor
        const halfW = 272 * (1 - t * 0.52)
        ctx.beginPath()
        ctx.moveTo(cx - halfW, y)
        ctx.lineTo(cx + halfW, y)
        ctx.stroke()
      }

      // Side walls of the scan volume (tapered)
      ctx.beginPath()
      ctx.moveTo(cx - 280, baseY)
      ctx.lineTo(cx - 120, baseY - 310 * Math.sin(pitchRad) * depthFactor)
      ctx.moveTo(cx + 280, baseY)
      ctx.lineTo(cx + 120, baseY - 310 * Math.sin(pitchRad) * depthFactor)
      ctx.stroke()

      // Bright local/base plane line
      ctx.strokeStyle = '#ffaa00'
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.moveTo(cx - 296, baseY)
      ctx.lineTo(cx + 296, baseY)
      ctx.stroke()

      // Player own-ship marker (chevron pointing forward on the local line)
      ctx.fillStyle = '#ffdd88'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cx, baseY - 10)
      ctx.lineTo(cx - 8, baseY + 6)
      ctx.lineTo(cx + 8, baseY + 6)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = '#ffdd88'
      ctx.beginPath()
      ctx.moveTo(cx - 6, baseY + 4)
      ctx.lineTo(cx, baseY - 4)
      ctx.lineTo(cx + 6, baseY + 4)
      ctx.stroke()

      // Get contacts via the shared util (deduped the second copy of the projection math)
      const p = snapRef.current?.player
      if (!p) {
        raf = requestAnimationFrame(drawRadar)
        return
      }

      const fwd = p.heading
      const upv = p.up || { x: 0, y: 1, z: 0 }
      const carto = getCartographyBodies((snapRef.current?.time || 0) * 0.55)

      const contacts = projectContacts(
        { pos: p.pos, heading: fwd, up: upv },
        snapRef.current?.npcs || [],
        carto,
        { maxShip: 300, maxBody: 500 }
      )

      contacts.forEach((c) => {
        const z = Math.max(0, c.z)
        const sx = cx + c.x * latFactor
        const planeY = baseY - z * Math.sin(pitchRad) * depthFactor
        const sy = planeY - c.y * elevFactor

        const size = Math.max(8.8, 23.2 * (1 - Math.min(1, c.dist / 165)))

        // Yellow elevation stick (from the angled plane up/down to the contact)
        if (Math.abs(c.y) > 5) {
          ctx.strokeStyle = '#ffdd00'
          ctx.lineWidth = 1.2
          ctx.beginPath()
          ctx.moveTo(sx, planeY)
          ctx.lineTo(sx, sy)
          ctx.stroke()
        }

        if (c.type === 'ship') {
          ctx.fillStyle = c.role === 'pirate' ? '#ff4444' : (c.role === 'police' || c.role === 'escort' ? '#44ff88' : '#ffee44')
          ctx.save()
          ctx.translate(sx, sy)
          ctx.beginPath()
          ctx.moveTo(0, -size)
          ctx.lineTo(-size * 0.48, size * 0.38)
          ctx.lineTo(0, size * 0.12)
          ctx.lineTo(size * 0.48, size * 0.38)
          ctx.closePath()
          ctx.fill()
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

        // Distance label for closer contacts
        if (c.dist < 125) {
          ctx.fillStyle = '#ffaa00'
          ctx.font = '8px monospace'
          ctx.fillText(Math.round(c.dist), sx + size + 6, sy + 3)
        }
      })

      raf = requestAnimationFrame(drawRadar)
    }

    drawRadar()

    return () => { if (raf) cancelAnimationFrame(raf) }
  }, [mapOpen])  // re-draws on map toggle too, but always runs for ship UI

  // Click to pick destination on the map canvas
  const handleMapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = mapCanvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = ((e.clientX - rect.left) / rect.width) * canvas.width - canvas.width / 2
    const my = ((e.clientY - rect.top) / rect.height) * canvas.height - canvas.height / 2
    const scale = 0.48

    let best: { id: string; dist: number } | null = null
    const bodies = getCartographyBodies(0) // use base for picking
    bodies.forEach(b => {
      if (b.type === 'star') return
      const bx = b.pos2d.x * scale
      const by = b.pos2d.y * scale
      const d = Math.hypot(mx - bx, my - by)
      const hit = Math.max(18, b.radius * 2.2)
      if (d < hit && (!best || d < best.dist)) {
        best = { id: b.id, dist: d }
      }
    })
    if (best) {
      setRoute(r => ({ ...r, destinationId: best!.id }))
    }
  }

  // The useHoloDrag hooks above already attach their global listeners while dragging.
  // Reset panel positions when the map is opened (kept from original behavior)
  useEffect(() => {
    if (mapOpen) {
      const rightX = Math.max(700, window.innerWidth - 400)
      const mapY = 55
      setMapPanelPos({ x: rightX, y: mapY })
      setControlsPanelPos({ x: rightX, y: mapY + 375 })
      setFlightPanelPos({ x: rightX, y: mapY + 375 + 160 })
    }
  }, [mapOpen])

  // Keep connected state in sync with auth prop
  useEffect(() => {
    setConnected(!!loggedIn)
  }, [loggedIn])

  const handleConnect = () => {
    if (connected && handleSignOut) {
      handleSignOut()
    } else if (handleSignIn) {
      handleSignIn()
    }
  }

  const resetSim = () => {
    simRef.current.resetNpcs(2)
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

      {/* Cockpit frame bezels - to make it feel like inside the spaceship (holo style, framing the central "window" for the 3D space) */}
      {/* Left bezel - flight controls / ship status */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '85px',
        background: 'rgba(0, 4, 10, 0.75)',
        boxShadow: '0 0 12px rgba(255, 170, 0, 0.25)',
        zIndex: 8,
        pointerEvents: 'none',
        fontSize: '9px',
        padding: '8px 4px',
        color: '#ffaa00',
        overflow: 'hidden',
      }}>
        <div style={{ fontSize: '8px', marginBottom: '4px', opacity: 0.7, paddingBottom: '2px' }}>CONTROLS</div>
        <div>W / ↑ thrust fwd</div>
        <div>S / ↓ brake</div>
        <div>A / ← yaw L</div>
        <div>D / → yaw R</div>
        <div>Q down pitch</div>
        <div>E up pitch</div>
        <div>Z / X roll</div>
        <div style={{ marginTop: '6px', fontSize: '8px' }}>R respawn [H] help</div>
      </div>

      {/* Right bezel - minimal frame (carto holo overlays when map open) */}
      <div style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: '85px',
        background: 'rgba(0, 4, 10, 0.6)',
        boxShadow: '0 0 12px rgba(255, 170, 0, 0.2)',
        zIndex: 8,
        pointerEvents: 'none',
      }} />

      {/* Top bezel - canopy frame */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '85px',
        right: '85px',
        height: '45px',
        background: 'rgba(0, 4, 10, 0.65)',
        boxShadow: '0 0 8px rgba(255, 170, 0, 0.15)',
        zIndex: 8,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px',
        fontSize: '9px',
        color: '#ffaa00',
      }}>
        <div style={{ flex: 1 }}>INNER ORION SPUR</div>
        <div style={{ textAlign: 'center' }}>GENEVA ELITE</div>
        <div style={{ flex: 1, textAlign: 'right' }}>t+{hud.time}s</div>
      </div>

      {/* HUD Overlay */}
      <div style={{
        position: 'absolute',
        top: 18,
        left: 18,
        right: 18,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        pointerEvents: 'none',
      }}>
        <div style={{ pointerEvents: 'auto' }}>
          <div style={{ fontSize: 13, letterSpacing: 3, opacity: 0.6 }}>GENEVA // DEEP SPACE</div>
          <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: 6, marginTop: -4 }}>ELITE</div>
          <div style={{ fontSize: 11, opacity: 0.5, marginTop: -2 }}>three.js • web3 • flocking intelligence</div>
        </div>

        <div style={{ textAlign: 'right', fontSize: 12, pointerEvents: 'auto' }}>
          <div>SPD <span style={{ color: '#66eeff' }}>{hud.speed}</span> • NPC {hud.npcs}</div>
          <div style={{ opacity: 0.65 }}>X {hud.playerPos.x} Y {hud.playerPos.y} Z {hud.playerPos.z}</div>
          <div style={{ marginTop: 4, fontSize: 10 }}>t+{hud.time}s &nbsp; [R] respawn &nbsp; [H] help</div>
        </div>
      </div>

      {/* Bottom left: Wallet / Commander */}
      <div style={{
        position: 'absolute',
        bottom: 18,
        left: 18,
        background: 'rgba(0,4,10,0.65)',
        padding: '8px 12px',
        border: '1px solid #223344',
        fontSize: 12,
        pointerEvents: 'auto',
      }}>
        <div style={{ marginBottom: 4, opacity: 0.7 }}>COMMANDER</div>
        {connected && loggedIn ? (
          <div>
            <span style={{ color: '#6bffa3' }}>{loggedIn.slice(0, 6)}…{loggedIn.slice(-4)}</span>
            <button onClick={handleConnect} style={{
              marginLeft: 12, background: 'transparent', border: '1px solid #445566', color: '#aaccdd',
              padding: '2px 8px', fontSize: 11, cursor: 'pointer'
            }}>SIGN OUT</button>
          </div>
        ) : (
          <button onClick={handleConnect} style={{
            background: '#112233', border: '1px solid #446688', color: '#aaccdd',
            padding: '4px 14px', fontSize: 12, cursor: 'pointer'
          }}>
            CONNECT WALLET
          </button>
        )}
        <div style={{ fontSize: 10, marginTop: 6, opacity: 0.5 }}>
          Your ship &amp; cargo can be on-chain (coming soon)
        </div>
      </div>

      {/* Right side controls */}
      <div style={{
        position: 'absolute',
        bottom: 18,
        right: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        alignItems: 'flex-end',
        pointerEvents: 'auto',
      }}>
        <button onClick={resetSim} style={{
          background: 'rgba(0,4,10,0.7)', border: '1px solid #334455', color: '#aaccdd',
          padding: '6px 14px', fontSize: 12, cursor: 'pointer'
        }}>RESPAWN FLEET [R]</button>
        <button onClick={() => setShowHelp(h => !h)} style={{
          background: 'rgba(0,4,10,0.5)', border: '1px solid #223344', color: '#8899aa',
          padding: '3px 10px', fontSize: 11, cursor: 'pointer'
        }}>{showHelp ? 'HIDE HELP' : 'SHOW CONTROLS'} [H]</button>
      </div>

      {/* Old centered help removed - now using holo draggable flight controls panel on right under the map */}

      {/* Role legend */}
      <div style={{
        position: 'absolute',
        top: 18,
        right: 18,
        fontSize: 11,
        opacity: 0.75,
        background: 'rgba(0,4,10,0.5)',
        padding: '6px 10px',
        border: '1px solid #223344',
        pointerEvents: 'none',
      }}>
        <span style={{ color: '#aabbcc' }}>■</span> trader &nbsp;
        <span style={{ color: '#ff6b6b' }}>■</span> pirate &nbsp;
        <span style={{ color: '#6bffa3' }}>■</span> police &nbsp;
        <span style={{ color: '#88ddff' }}>■</span> escort
      </div>

      <div style={{
        position: 'absolute',
        bottom: 4,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 10,
        opacity: 0.35,
        pointerEvents: 'none',
      }}>
        geneva modular • three.js • using flocker boids + belltoy
      </div>

      {/* HOLO PANELS - now using the extracted reusable HoloPanel component + useHoloDrag hooks */}
      {mapOpen && (
        <>
          <HoloPanel
            title="CARTOGRAPHY • HOLO • LIVE ORBITAL DATA"
            pos={mapPanelPos}
            onStartDrag={mapDrag.startDrag}
            onClose={() => setMapOpen(false)}
            footer="CLICK TO SELECT • ORBITS LIVE"
          >
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <canvas
                ref={mapCanvasRef}
                onClick={handleMapClick}
                width={340}
                height={340}
                style={{
                  border: '1px solid #0088cc',
                  background: 'rgba(0, 8, 18, 0.6)',
                  cursor: 'crosshair',
                  boxShadow: 'inset 0 0 12px rgba(0, 140, 255, 0.2)',
                }}
              />
            </div>
          </HoloPanel>

          <HoloPanel
            title="CONTROLS • HOLO • ROUTE &amp; JUMP"
            pos={controlsPanelPos}
            onStartDrag={controlsDrag.startDrag}
            footer="DRAG HEADER • SAME HOLO STYLE • UNDER MAP"
          >
            <div style={{ background: 'rgba(0, 20, 40, 0.45)', border: '1px solid #006699', padding: 6, marginBottom: 6, fontSize: 10 }}>
              <div style={{ opacity: 0.6, fontSize: 9 }}>ROUTE</div>
              <div>FROM <span style={{ color: '#ffcc66' }}>{getBodyById(route.originId, 0)?.name}</span></div>
              <div>TO <span style={{ color: '#66ff99' }}>{getBodyById(route.destinationId, 0)?.name}</span></div>
              <div style={{ marginTop: 3, color: '#ffdd88', fontSize: 11 }}>
                COST: {getJumpFuelCost(
                  getBodyById(route.originId, 0)?.pos2d || {x:0,y:0},
                  getBodyById(route.destinationId, 0)?.pos2d || {x:0,y:0}
                )} FUEL
              </div>
            </div>

            <button
              onClick={() => {
                const nearest = CARTOGRAPHY_BODIES.reduce((best, b) => {
                  const p = snapRef.current?.player?.pos || {x:0,y:0}
                  const d = Math.hypot(b.pos2d.x - p.x, b.pos2d.y - p.y)
                  return d < best.d ? {id: b.id, d} : best
                }, {id: route.originId, d: 9999})
                setRoute(r => ({...r, originId: nearest.id }))
              }}
              style={{
                width: '100%',
                marginBottom: 4,
                padding: '3px 6px',
                background: 'rgba(0,40,70,0.6)',
                border: '1px solid #0088aa',
                color: '#aaddff',
                fontSize: 9,
                cursor: 'pointer'
              }}
            >
              SET NEAREST AS ORIGIN
            </button>

            <button
              disabled={isHyperspacing || hud.fuel < getJumpFuelCost(
                getBodyById(route.originId, 0)?.pos2d || {x:0,y:0},
                getBodyById(route.destinationId, 0)?.pos2d || {x:0,y:0}
              )}
              onClick={() => {
                const o = getBodyById(route.originId, 0)
                const d = getBodyById(route.destinationId, 0)
                if (!o || !d) return
                const cost = getJumpFuelCost(o.pos2d, d.pos2d)
                if (hud.fuel < cost) return

                hyperspaceTargetRef.current = { ...d.pos3d }
                hyperspaceCostRef.current = cost
                hyperspaceStartRef.current = 0
                setIsHyperspacing(true)
                isHyperspacingRef.current = true

                const sg: any = hyperspaceStreaksRef.current
                if (sg) sg.visible = true
              }}
              style={{
                width: '100%',
                padding: '4px 6px',
                background: isHyperspacing ? 'rgba(60,20,0,0.6)' : 'rgba(0,60,50,0.6)',
                border: '1px solid #00cc99',
                color: '#aaddff',
                fontSize: 10,
                cursor: isHyperspacing ? 'wait' : 'pointer'
              }}
            >
              {isHyperspacing ? 'HYPERSPACE IN PROGRESS...' : 'INITIATE HYPERSPACE'}
            </button>
          </HoloPanel>

          <HoloPanel
            title="FLIGHT • HOLO • CONTROLS &amp; NPCS"
            pos={flightPanelPos}
            onStartDrag={flightDrag.startDrag}
            footer="DRAG HEADER • DEDUPED VIA useHoloDrag"
          >
            {/* Flight info content kept inline for this pass - can be moved to its own FlightPanel component later */}
            <div style={{ fontSize: 10, lineHeight: 1.3 }}>
              W/↑ thrust • S/↓ brake<br />
              A/← yaw L • D/→ yaw R<br />
              Q pitch down • E pitch up<br />
              Z/X roll<br />
              <div style={{ marginTop: 6, opacity: 0.7 }}>R respawn fleet • M toggle map • H help</div>
              <div style={{ marginTop: 4 }}>NPCs: {hud.npcs} • Fuel: {hud.fuel}</div>
            </div>
          </HoloPanel>
        </>
      )}

      {/* Central targeting / jump status (preserved from original reference visuals) */}
      {mapOpen && (
        <div style={{
          position: 'absolute',
          top: '36%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.35)',
          boxShadow: '0 0 8px rgba(255,170,0,0.25)',
          padding: '3px 10px',
          fontSize: 11,
          color: '#ffaa00',
          textAlign: 'center',
          pointerEvents: 'none',
          fontFamily: 'ui-monospace, monospace',
          letterSpacing: '1px',
          minWidth: '120px',
        }}>
          {getBodyById(route.destinationId, 0)?.name || 'NO TARGET'}<br />
          {getBodyById(route.destinationId, 0) ?
            getJumpFuelCost(
              getBodyById(route.originId, 0)?.pos2d || {x:0,y:0},
              getBodyById(route.destinationId, 0)?.pos2d || {x:0,y:0}
            ) + ' FUEL'
            : ''}
          {isHyperspacing && <div style={{ color: '#ff6644', marginTop: '2px' }}>CHARGING</div>}
        </div>
      )}

      {/* Bottom Dashboard - Ship UI (default view, always visible as the "ship dashboard"; carto map overlays when M pressed) */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '210px',
        background: 'rgba(0, 4, 10, 0.65)',
        boxShadow: '0 -4px 20px rgba(255, 170, 0, 0.25)',
        color: '#ffaa00',
        fontFamily: 'ui-monospace, monospace',
        fontSize: '10px',
        zIndex: 10,
        pointerEvents: 'none',
      }}>
        {/* Left system info - far left of screen */}
        <div style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: '170px',
          height: '210px',
          padding: '4px 8px',
          background: 'rgba(0,0,0,0.3)',
        }}>
          <div style={{fontWeight: 'bold'}}>{getBodyById(route.destinationId, 0)?.name || 'NO TARGET'}</div>
          <div>6.23Ly</div>
          <div style={{color: '#ff6666'}}>ANARCHY</div>
          <div>CLEAN</div>
          <div style={{fontSize: '8px', marginTop: '4px'}}>COL 285 SECTOR SK-P A35-1</div>
        </div>


          {/* Classic Elite "nearby things" 2D visualiser (always-visible center bottom, side-on ~20deg angled view) */}
          <div style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: 0,
            marginTop: '-50px',
            width: '712px',
            height: '200px',
            background: 'rgba(0,0,0,0.4)',
            boxShadow: 'inset 0 0 14px rgba(255,170,0,0.25), 0 0 8px rgba(255,170,0,0.15)',
            overflow: 'hidden',
          }}>
            <canvas ref={radar2DCanvasRef} width="704" height="190" style={{ position: 'absolute', top: '2px', left: '2px' }} />
            <div style={{position: 'absolute', bottom: '1px', width: '100%', textAlign: 'center', fontSize: '8px', letterSpacing: '0.5px'}}>NEARBY</div>
          </div>

          {/* VECH ship holo icon — separate panel to the right of the NEARBY radar (real loaded GLB model via model-viewer).
              No rotation (autoRotate=false), larger size (440x290 panel), our holo ring overlay (behind via stacking + half size), inner height calc(100%-120px) + cameraTarget for bottom clearance. Looks great! */}
          <div style={{
            position: 'absolute',
            left: 'calc(50% + 156px + 12px)',
            bottom: 100,
            marginTop: '-150px',
            width: 440,
            height: 290,
            background: 'rgba(0, 6, 14, 0.1)',
            borderRadius: '2px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            overflow: 'hidden',
          }}>
            {/* High quality GLB render using @google/model-viewer (the same tech behind OpenSea's nice viewer for this exact VECH model).
                No external iframe, no unwanted UI. We overlay our own holo ring (drawn on canvas behind the model-viewer so ship is on top).
                Ring radii halved for smaller frame; ship scale unchanged. cameraTarget y-offset shifts ship up in viewport for bottom clearance. */}
            <div style={{ position: 'relative', width: '100%', height: 'calc(100% - 124px)' }}>
              {/* Ring canvas first (lower in stacking) so the 3D ship from model-viewer renders on top of the holo ring lines */}
              <canvas
                ref={vechRingCanvasRef}
                width="430"
                height="266"
                style={{ position: 'absolute', top: 0, left: 5, pointerEvents: 'none', zIndex: 1 }}
              />
              <model-viewer
                ref={vechModelViewerRef}
                src="https://raw2.seadn.io/ethereum/0x02e770a2f79ba4d3740a7273eca7e290d93ecc8a/f499a621b66cab834f06546f71875d06.glb"
                alt="VECH hovercraft"
                cameraControls={false}
                autoRotate={false}
                disableZoom={false}
                disablePan={true}
                interactionPrompt="none"
                shadowIntensity={0.6}
                exposure={1.2}
                cameraOrbit="0deg 70deg 15%"
                cameraTarget="0 -0.15 0"  /* negative y shifts look-at up the model, moving the ship up in the image for bottom clearance while keeping ring and ship scale fixed */
                onLoad={setVechCamera}
                style={{ width: '100%', height: '100%', background: 'transparent', position: 'relative', zIndex: 2 }}
              />
            </div>
            <div style={{
              fontSize: '9px',
              color: '#66aaff',
              letterSpacing: '0.7px',
              textShadow: '0 0 2px #000',
              pointerEvents: 'none',
              lineHeight: 1,
            }}>VECH</div>
          </div>

        {/* Right status bars - far right of screen */}
        <div style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: '200px',
          height: '210px',
          padding: '4px 8px',
          display: 'flex',
          gap: '12px',
          background: 'rgba(0,0,0,0.3)',
        }}>
          {/* Fuel */}
          <div>
            <div>FUEL</div>
            <div style={{height: '38px', width: '14px', background: 'rgba(255,170,0,0.1)', position: 'relative', marginTop: '2px', boxShadow: 'inset 0 0 4px rgba(255,170,0,0.4)'}}>
              <div style={{
                position: 'absolute',
                bottom: 0,
                width: '100%',
                height: `${Math.min(100, ((hud.fuel || 0) / 120) * 100)}%`,
                background: '#ffaa00',
              }} />
            </div>
            <div style={{fontSize: '8px'}}>1.10/h</div>
          </div>

          {/* Other bars */}
          <div style={{fontSize: '9px'}}>
            <div>SYS 100%</div>
            <div>ENG 100%</div>
            <div>RST 100%</div>
            <div>WEP 100%</div>
          </div>

          <div style={{fontSize: '9px', marginLeft: 'auto'}}>
            <div>MASS LOCKED</div>
            <div>CARGO SCOOP</div>
            <div style={{marginTop: '4px', color: isHyperspacing ? '#ff6644' : '#ffaa00'}}>{isHyperspacing ? 'JUMPING' : 'READY'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Elite
