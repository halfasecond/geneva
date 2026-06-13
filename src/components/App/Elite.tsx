import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import type { AuthProps } from '../../types/auth'
import { EliteSim } from '../../elite/sim/EliteSim'
import type { NpcAgent } from '../../elite/sim/core/types'
import { length } from '../../elite/sim/core/vector'
import { getCartographyBodies, getJumpFuelCost, CARTOGRAPHY_BODIES, DEFAULT_ROUTE, getBodyById } from '../../elite/sim/cartography'

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
  const [mapOpen, setMapOpen] = useState(true)
  const [route, setRoute] = useState(DEFAULT_ROUTE)
  const [isHyperspacing, setIsHyperspacing] = useState(false)
  const hyperspaceStartRef = useRef(0)
  const hyperspaceTargetRef = useRef<{ x: number; y: number; z: number } | null>(null)
  const hyperspaceCostRef = useRef(0)

  // Minority Report style floating holographic overlays - positioned top-right by default
  const [mapPanelPos, setMapPanelPos] = useState({ x: 820, y: 60 }) // default top-right
  const [isMapDragging, setIsMapDragging] = useState(false)
  const dragRef = useRef<{ offsetX: number; offsetY: number } | null>(null)

  // Separate draggable controls panel, positioned underneath the map, same holo style
  const [controlsPanelPos, setControlsPanelPos] = useState({ x: 820, y: 430 }) // underneath the map panel
  const [isControlsDragging, setIsControlsDragging] = useState(false)
  const controlsDragRef = useRef<{ offsetX: number; offsetY: number } | null>(null)

  // Flight controls holo panel (the old key bindings + NPC info), same style, draggable, underneath the route controls
  const [flightPanelPos, setFlightPanelPos] = useState({ x: 820, y: 620 })
  const [isFlightDragging, setIsFlightDragging] = useState(false)
  const flightDragRef = useRef<{ offsetX: number; offsetY: number } | null>(null)

  const keysRef = useRef<Record<string, boolean>>({})

  // Keyboard handling (Elite classic feel: thrust, yaw, pitch)
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current[e.key.toLowerCase()] = true
    keysRef.current[e.code.toLowerCase()] = true
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
      e.preventDefault()
    }
    if (e.key.toLowerCase() === 'h') setShowHelp(s => !s)
    if (e.key.toLowerCase() === 'm') setMapOpen(o => !o)
    if (e.key.toLowerCase() === 'r') {
      simRef.current.resetNpcs(2)
    }
  }, [])

  const onKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current[e.key.toLowerCase()] = false
    keysRef.current[e.code.toLowerCase()] = false
  }, [])

  // Collect input from keys each frame
  const getPlayerInput = () => {
    const k = keysRef.current
    let thrust = 0
    let yaw = 0
    let pitch = 0
    let roll = 0

    // Thrust (W = forward, S = brake/reverse)
    if (k['w'] || k['arrowup']) thrust += 1
    if (k['s'] || k['arrowdown']) thrust -= 0.7

    // Yaw (A/D or left/right)
    if (k['a'] || k['arrowleft']) yaw -= 1
    if (k['d'] || k['arrowright']) yaw += 1

    // Pitch (shift/ctrl or page up/down as extra)
    if (k['q']) pitch -= 1
    if (k['e']) pitch += 1

    // Roll (z/x)
    if (k['z']) roll -= 1
    if (k['x']) roll += 1

    return { thrust, yaw, pitch, roll }
  }

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

    // External player ship (kept for potential future external view / debug, hidden in pure cockpit)
    const playerGroup = new THREE.Group()
    // fuselage
    const body = new THREE.Mesh(
      new THREE.ConeGeometry(2.8, 11, 3),
      new THREE.MeshBasicMaterial({ color: 0xccd5dd, wireframe: true })
    )
    body.rotation.x = Math.PI / 2
    playerGroup.add(body)
    // wings / accents
    const wingMat = new THREE.MeshBasicMaterial({ color: 0x88aacc })
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(7, 0.6, 2.2), wingMat)
    wingL.position.set(-4.5, 0, 1)
    playerGroup.add(wingL)
    const wingR = wingL.clone()
    wingR.position.x = 4.5
    playerGroup.add(wingR)
    // cockpit glow
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(1.6, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x66eeff, transparent: true, opacity: 0.6 })
    )
    glow.position.z = 3
    playerGroup.add(glow)

    playerGroup.visible = false
    scene.add(playerGroup)

    // COCKPIT VIEW: attach a clone of the ship frame to the camera.
    // This gives the classic Elite "you are inside the ship" feel — the model stays fixed
    // in the lower part of your view while the world (stars, planets, other ships) moves past.
    const cockpit = playerGroup.clone()
    cockpit.visible = true
    cockpit.scale.setScalar(0.85)
    cockpit.position.set(0, -2.8, -6.5)   // lower in view + slightly in front of camera in local space
    // Slight rotation so the "body" frames the bottom of the screen nicely
    cockpit.rotation.x = 0.35
    camera.add(cockpit)   // child of camera → moves and orients with the viewpoint automatically
    playerMeshRef.current = cockpit   // keep ref for future tweaks if needed (we don't world-update it)

    // NPC container
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

    // Keyboard listeners
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

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

        // Sit a little behind the "nose" inside the cockpit
        const cockpitBack = 5.5
        cam.position.set(
          p.pos.x - fwd.x * cockpitBack,
          p.pos.y - fwd.y * cockpitBack + 1.8,  // slight eye height
          p.pos.z - fwd.z * cockpitBack
        )

        // Look forward along heading
        const lookTarget = new THREE.Vector3(
          p.pos.x + fwd.x * 25,
          p.pos.y + fwd.y * 25 + 3,
          p.pos.z + fwd.z * 25
        )
        cam.lookAt(lookTarget)

        // Apply ship roll (classic Elite roll feel)
        cam.rotateZ(p.roll * 0.65)
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
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      renderer.dispose()
      // more thorough cleanup could be added
    }
  }, [onKeyDown, onKeyUp])

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

  // Drag handlers for Minority Report-style movable holographic panels
  const startMapDrag = (e: React.MouseEvent) => {
    setIsMapDragging(true)
    dragRef.current = {
      offsetX: e.clientX - mapPanelPos.x,
      offsetY: e.clientY - mapPanelPos.y,
    }
    e.preventDefault()
  }

  const handleMapDragMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current) return
    const newX = Math.max(10, Math.min(window.innerWidth - 480, e.clientX - dragRef.current.offsetX))
    const newY = Math.max(10, Math.min(window.innerHeight - 420, e.clientY - dragRef.current.offsetY))
    setMapPanelPos({ x: newX, y: newY })
  }, [])

  const stopMapDrag = useCallback(() => {
    setIsMapDragging(false)
    dragRef.current = null
  }, [])

  // Attach global drag listeners when dragging
  useEffect(() => {
    if (!isMapDragging) return
    window.addEventListener('mousemove', handleMapDragMove)
    window.addEventListener('mouseup', stopMapDrag, { once: true })
    return () => {
      window.removeEventListener('mousemove', handleMapDragMove)
      window.removeEventListener('mouseup', stopMapDrag)
    }
  }, [isMapDragging, handleMapDragMove, stopMapDrag])

  // Controls drag handlers (parallel to map, same holo draggable style)
  const startControlsDrag = (e: React.MouseEvent) => {
    setIsControlsDragging(true)
    controlsDragRef.current = {
      offsetX: e.clientX - controlsPanelPos.x,
      offsetY: e.clientY - controlsPanelPos.y,
    }
    e.preventDefault()
  }

  const handleControlsDragMove = useCallback((e: MouseEvent) => {
    if (!controlsDragRef.current) return
    const newX = Math.max(10, Math.min(window.innerWidth - 420, e.clientX - controlsDragRef.current.offsetX))
    const newY = Math.max(10, Math.min(window.innerHeight - 200, e.clientY - controlsDragRef.current.offsetY))
    setControlsPanelPos({ x: newX, y: newY })
  }, [])

  const stopControlsDrag = useCallback(() => {
    setIsControlsDragging(false)
    controlsDragRef.current = null
  }, [])

  // Attach global drag listeners for controls
  useEffect(() => {
    if (!isControlsDragging) return
    window.addEventListener('mousemove', handleControlsDragMove)
    window.addEventListener('mouseup', stopControlsDrag, { once: true })
    return () => {
      window.removeEventListener('mousemove', handleControlsDragMove)
      window.removeEventListener('mouseup', stopControlsDrag)
    }
  }, [isControlsDragging, handleControlsDragMove, stopControlsDrag])

  // Flight controls drag handlers (third holo panel)
  const startFlightDrag = (e: React.MouseEvent) => {
    setIsFlightDragging(true)
    flightDragRef.current = {
      offsetX: e.clientX - flightPanelPos.x,
      offsetY: e.clientY - flightPanelPos.y,
    }
    e.preventDefault()
  }

  const handleFlightDragMove = useCallback((e: MouseEvent) => {
    if (!flightDragRef.current) return
    const newX = Math.max(10, Math.min(window.innerWidth - 420, e.clientX - flightDragRef.current.offsetX))
    const newY = Math.max(10, Math.min(window.innerHeight - 300, e.clientY - flightDragRef.current.offsetY))
    setFlightPanelPos({ x: newX, y: newY })
  }, [])

  const stopFlightDrag = useCallback(() => {
    setIsFlightDragging(false)
    flightDragRef.current = null
  }, [])

  // Attach global drag listeners for flight
  useEffect(() => {
    if (!isFlightDragging) return
    window.addEventListener('mousemove', handleFlightDragMove)
    window.addEventListener('mouseup', stopFlightDrag, { once: true })
    return () => {
      window.removeEventListener('mousemove', handleFlightDragMove)
      window.removeEventListener('mouseup', stopFlightDrag)
    }
  }, [isFlightDragging, handleFlightDragMove, stopFlightDrag])

  // Ensure the holo panels start top-right stacked: map, then route controls, then flight controls
  useEffect(() => {
    if (mapOpen) {
      const rightX = Math.max(700, window.innerWidth - 400)
      const mapY = 55
      setMapPanelPos({ x: rightX, y: mapY })
      setControlsPanelPos({ x: rightX, y: mapY + 375 })
      setFlightPanelPos({ x: rightX, y: mapY + 375 + 160 }) // under the route controls panel
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

      {/* MAP HOLO PANEL - top right, draggable, shows by default */}
      {/* Controls as separate matching holo panel directly underneath, also draggable */}
      {mapOpen && (
        <>
          {/* Map panel (visual radar) - top right */}
          <div
            style={{
              position: 'absolute',
              left: mapPanelPos.x,
              top: mapPanelPos.y,
              width: 360,
              background: 'rgba(4, 12, 22, 0.55)',
              border: '1px solid #00aaff',
              borderRadius: 4,
              boxShadow: '0 0 25px rgba(0, 160, 255, 0.35), inset 0 0 30px rgba(0, 80, 140, 0.15)',
              backdropFilter: 'blur(6px)',
              zIndex: 25,
              pointerEvents: 'auto',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              color: '#aaddff',
              overflow: 'hidden',
            }}
          >
            <div
              onMouseDown={startMapDrag}
              style={{
                background: 'linear-gradient(to right, rgba(0,120,200,0.25), rgba(0,80,150,0.1))',
                padding: '4px 10px',
                fontSize: 9,
                letterSpacing: 1.2,
                borderBottom: '1px solid #0099dd',
                cursor: 'move',
                userSelect: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                CARTOGRAPHY • HOLO • LIVE ORBITAL DATA
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setMapOpen(false); }}
                style={{ background: 'transparent', border: 'none', color: '#66bbff', fontSize: 13, cursor: 'pointer', lineHeight: 1, padding: '0 2px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '8px 10px 2px 10px', display: 'flex', justifyContent: 'center' }}>
              <canvas
                ref={mapCanvasRef}
                onClick={handleMapClick}
                style={{
                  border: '1px solid #0088cc',
                  background: 'rgba(0, 8, 18, 0.6)',
                  cursor: 'crosshair',
                  boxShadow: 'inset 0 0 12px rgba(0, 140, 255, 0.2)',
                }}
              />
            </div>
            <div style={{ textAlign: 'center', fontSize: 8, opacity: 0.45, margin: '2px 0 6px' }}>
              CLICK TO SELECT • ORBITS LIVE
            </div>
          </div>

          {/* Route & Jump controls holo panel - underneath the map, same style */}
          <div
            style={{
              position: 'absolute',
              left: controlsPanelPos.x,
              top: controlsPanelPos.y,
              width: 360,
              background: 'rgba(4, 12, 22, 0.55)',
              border: '1px solid #00aaff',
              borderRadius: 4,
              boxShadow: '0 0 25px rgba(0, 160, 255, 0.35), inset 0 0 30px rgba(0, 80, 140, 0.15)',
              backdropFilter: 'blur(6px)',
              zIndex: 25,
              pointerEvents: 'auto',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              color: '#aaddff',
              overflow: 'hidden',
            }}
          >
            <div
              onMouseDown={startControlsDrag}
              style={{
                background: 'linear-gradient(to right, rgba(0,120,200,0.25), rgba(0,80,150,0.1))',
                padding: '4px 10px',
                fontSize: 9,
                letterSpacing: 1.2,
                borderBottom: '1px solid #0099dd',
                cursor: 'move',
                userSelect: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                CONTROLS • HOLO • ROUTE &amp; JUMP
              </div>
            </div>

            <div style={{ padding: 8, fontSize: 10 }}>
              <div style={{ background: 'rgba(0, 20, 40, 0.45)', border: '1px solid #006699', padding: 6, marginBottom: 6 }}>
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
            </div>

            <div style={{ fontSize: 7, opacity: 0.35, textAlign: 'center', marginBottom: 4 }}>
              DRAG HEADER • SAME HOLO STYLE • UNDER MAP
            </div>
          </div>

          {/* Flight controls holo panel - same style, draggable, underneath the route controls */}
          <div
            style={{
              position: 'absolute',
              left: flightPanelPos.x,
              top: flightPanelPos.y,
              width: 360,
              background: 'rgba(4, 12, 22, 0.55)',
              border: '1px solid #00aaff',
              borderRadius: 4,
              boxShadow: '0 0 25px rgba(0, 160, 255, 0.35), inset 0 0 30px rgba(0, 80, 140, 0.15)',
              backdropFilter: 'blur(6px)',
              zIndex: 25,
              pointerEvents: 'auto',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              color: '#aaddff',
              overflow: 'hidden',
            }}
          >
            <div
              onMouseDown={startFlightDrag}
              style={{
                background: 'linear-gradient(to right, rgba(0,120,200,0.25), rgba(0,80,150,0.1))',
                padding: '4px 10px',
                fontSize: 9,
                letterSpacing: 1.2,
                borderBottom: '1px solid #0099dd',
                cursor: 'move',
                userSelect: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                CONTROLS • HOLO • FLIGHT &amp; NPC
              </div>
            </div>

            <div style={{ padding: 8, fontSize: 10, lineHeight: 1.3 }}>
              <div>W / ↑ — thrust forward &nbsp;&nbsp; S / ↓ — brake</div>
              <div>A / D or ← → — yaw</div>
              <div>Q / E — pitch &nbsp;&nbsp; Z / X — roll</div>
              <div style={{ margin: '4px 0', opacity: 0.7 }}>R — respawn NPC fleet &nbsp; H — toggle this</div>
              <div style={{ fontSize: 9, opacity: 0.75 }}>
                NPCs use the κ-framework flocking + BellToy state logic from Flockers.<br />
                Pirates &amp; escorts are attracted to you. Traders mostly mind their routes.
              </div>
              <div style={{ marginTop: 4, fontSize: 9, opacity: 0.5 }}>
                Next: 3D cartography map, station docking, live markets (Flocker port), ship NFT ownership.
              </div>
            </div>

            <div style={{ fontSize: 7, opacity: 0.35, textAlign: 'center', marginBottom: 4 }}>
              DRAG HEADER • SAME HOLO STYLE • UNDER CONTROLS
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Elite
