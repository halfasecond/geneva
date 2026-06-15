import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

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
import type { NpcAgent } from '../../elite/sim/core/types'
import { length } from '../../elite/sim/core/vector'
import { getCartographyBodies, getJumpFuelCost, DEFAULT_ROUTE, getBodyById } from '../../elite/sim/cartography'

// Tightening imports (config + extracted modules)
import {
  COLORS, SCANNER_2D, VECH, VIEW, WORLD, HYPERSPACE, NPC, FUEL, Z, DASHBOARD,
  roleCss, roleColor, npcSizeForRole,
} from '../../elite/config'
import { projectContacts } from '../../elite/sim/contacts'
import { useFlightInput } from '../../elite/useFlightInput'
import * as CockpitRender from '../../elite/render/cockpit'
import * as HyperspaceRender from '../../elite/render/hyperspace'
import { CartographyOverlay, HyperspacePanel, HyperspaceCountdown, HyperspaceTunnel, VechPreview } from '../../elite/ui'

// Basic AuthProps shape we receive (wallet + controls)
type EliteProps = AuthProps & {
  // extra if needed
}

const glbUrl = 'https://raw2.seadn.io/ethereum/0x02e770a2f79ba4d3740a7273eca7e290d93ecc8a/f499a621b66cab834f06546f71875d06.glb'

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
  const snapRef = useRef<any>(null) // latest sim snapshot for hyperspace + scanner
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
    fuel: 120,
  })

  // Cartography + hyperspace overlay state
  const [mapOpen, setMapOpen] = useState(false)
  const [route, setRoute] = useState(DEFAULT_ROUTE)
  const [isHyperspacing, setIsHyperspacing] = useState(false)
  const [hyperspaceCountdown, setHyperspaceCountdown] = useState<number | null>(null)
  const hyperspaceJumpStartRef = useRef(0)
  const hyperspaceTargetRef = useRef<{ x: number; y: number; z: number } | null>(null)
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
    }
    window.addEventListener('keydown', handleGlobalKeys)
    return () => window.removeEventListener('keydown', handleGlobalKeys)
  }, [mapOpen])

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
          new THREE.LineBasicMaterial({ color: 0x334455, transparent: true, opacity: WORLD.bodyOrbitRingOpacity })
        )
        bodiesGroup.add(ring)
      }
    })
    scene.add(bodiesGroup)
    bodiesGroupRef.current = bodiesGroup
      // store for live update (non-star bodies)
      ; (bodiesGroup as any)._mainBodyMeshes = mainBodyMeshes

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

    const { shipIcon } = CockpitRender.createVechHoloIcon(camera)
    // VECH GLB load (async) - kept inline for now; will move to a render/vech helper in a follow-up
    const gltfLoader = new GLTFLoader()
    gltfLoader.load(
      glbUrl,
      (gltf: any) => {
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
      (error: any) => {
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
        cam.position.set(
          p.pos.x - fwd.x * VIEW.cockpitBack + up.x * VIEW.eyeHeight,
          p.pos.y - fwd.y * VIEW.cockpitBack + up.y * VIEW.eyeHeight,
          p.pos.z - fwd.z * VIEW.cockpitBack + up.z * VIEW.eyeHeight
        )

        // Set the camera's up to the ship's local up. This makes roll bank the view and
        // pitch "up" in the image match the ship's orientation.
        cam.up.set(up.x, up.y, up.z)

        // Look exactly forward along the ship's heading (from the eye point).
        // Pure fwd direction avoids conflicting biases that could make background appear to
        // move in "both directions" during pitch. The eyeHeight offset + cockpit model already
        // give the "looking out the window" framing.
        const lookTarget = new THREE.Vector3(
          cam.position.x + fwd.x * VIEW.lookFar,
          cam.position.y + fwd.y * VIEW.lookFar,
          cam.position.z + fwd.z * VIEW.lookFar
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
            if (b.type === 'station') m.scale.setScalar(1 + Math.sin(snap.time * WORLD.stationPulseSpeed + mi) * WORLD.stationPulseAmp)
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
            const target = hyperspaceTargetRef.current
            if (target) simRef.current.performHyperspace(target, hyperspaceCostRef.current)
            streaksGrp.visible = false
            hyperspacePhaseRef.current = 'idle'
            hyperspaceSequenceStartRef.current = 0
            hyperspaceJumpStartRef.current = 0
            hyperspaceTargetRef.current = null
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
          const size = npcSizeForRole(npc.role)
          const { r, h } = NPC.cone(size)

          const geo = new THREE.ConeGeometry(r, h, 3)
          const mat = new THREE.MeshBasicMaterial({ color: roleColor(npc.role), wireframe: true })
          const m = new THREE.Mesh(geo, mat)

          const dot = new THREE.Mesh(
            new THREE.SphereGeometry(NPC.dot.r, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xffee66, transparent: true, opacity: NPC.dot.opacity })
          )
          dot.position.y = size * NPC.dot.yOffset
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
              m.position.x + vx * NPC.lookAhead,
              m.position.y + vy * NPC.lookAhead,
              m.position.z + vz * NPC.lookAhead
            )
          }

          // pressure glow dot
          const dot = m.children[0] as THREE.Mesh | undefined
          if (dot) {
            dot.visible = npc.pressure > NPC.pressureThreshold
            if (dot.visible) {
              dot.position.y = npcSizeForRole(npc.role) * NPC.dot.yOffset
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
          ctx.fillStyle = roleCss(c.role)
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

        // Distance label for closer contacts - now vech blue
        if (c.dist < SCANNER_2D.labelDist) {
          ctx.fillStyle = SCANNER_2D.labelColor
          ctx.font = '8px monospace'
          ctx.fillText(Math.round(c.dist), sx + size + 6, sy + 3)
        }
      })

      raf = requestAnimationFrame(drawRadar)
    }

    drawRadar()

    return () => { if (raf) cancelAnimationFrame(raf) }
  }, [mapOpen])  // re-draws on map toggle too, but always runs for ship UI

  const handleInitiateHyperspace = () => {
    if (hyperspacePhaseRef.current !== 'idle') return
    const o = getBodyById(route.originId, 0)
    const d = getBodyById(route.destinationId, 0)
    if (!o || !d) return
    const cost = getJumpFuelCost(o.pos2d, d.pos2d)
    if (hud.fuel < cost) return

    setMapOpen(false)
    hyperspaceTargetRef.current = { ...d.pos3d }
    hyperspaceCostRef.current = cost
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

      {/* Cockpit frame bezels - to make it feel like inside the spaceship (holo style, framing the central "window" for the 3D space) */}

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

      {hyperspaceCountdown !== null && (
        <HyperspaceCountdown count={hyperspaceCountdown} />
      )}

      {isHyperspacing && <HyperspaceTunnel />}

      {mapOpen && (
        <>
          <CartographyOverlay
            route={route}
            playerPos={hud.playerPos}
            onRouteChange={setRoute}
            onClose={() => setMapOpen(false)}
          />
          <HyperspacePanel
            route={route}
            fuel={hud.fuel}
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
          <div style={{
            position: 'absolute',
            left: DASHBOARD.leftColumn.left,
            bottom: DASHBOARD.leftColumn.bottom,
            width: DASHBOARD.leftColumn.width,
            boxSizing: 'border-box',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            ...DASHBOARD.leftPanel,
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{getBodyById(route.destinationId, 0)?.name || 'NO TARGET'}</div>
            <div style={{ marginBottom: '8px' }}>6.23Ly</div>
            <div style={{ fontSize: '10px', marginBottom: '6px' }}>ANARCHY</div>
            <div style={{ fontSize: '10px' }}>COL 285 SECTOR SK-P A35-1</div>
          </div>
        )}

        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: DASHBOARD.radar.bottom,
          width: DASHBOARD.radar.width,
          height: DASHBOARD.radar.height,
          boxShadow: 'inset 0 0 14px rgba(102, 170, 255, .15), 0 0 8px rgba(102, 170, 255, .15)',
          overflow: 'visible',
        }}>
          <canvas ref={radar2DCanvasRef} width={704} height={190} style={{ position: 'absolute', top: 2, left: 2 }} />
          <div style={{ position: 'absolute', bottom: 1, width: '100%', textAlign: 'center', fontSize: '8px', letterSpacing: '0.5px', color: SCANNER_2D.nearbyLabelColor }}>NEARBY</div>
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
