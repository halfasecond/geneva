import { useEffect, useRef, type MutableRefObject, type RefObject } from 'react'
import * as THREE from 'three'
import {
  COLORS,
  FUEL,
  HYPERSPACE,
  MIND_RADAR,
  NPC,
  SCANNER_2D,
  VIEW,
  WORLD,
  BOREAL_STATION,
  roleColor,
  npcSizeForRole,
} from './config'
import { getFrozenCartographyBodies, isNavOnlyCartographyBody } from './sim/cartography'
import { projectContacts } from './sim/contacts'
import { getCargoUsed } from './sim/market'
import { isBorealFreighterInBubble } from './sim/borealDock'
import { bodyLocalPos, isInsideBubble, radarVisibleBodies, viewBasisFromAttitude } from './sim/systemSpace'
import { computeWaypoints, type WaypointIndicator } from './sim/waypoints'
import type { EliteSim } from './sim/EliteSim'
import type { EliteSnapshot, NpcAgent } from './sim/core/types'
import { length } from './sim/core/vector'
import type { FlightInput } from './useFlightInput'
import * as CockpitRender from './render/cockpit'
import { createVechHoloIcon, loadVechShipModel } from './render/vech'
import * as HyperspaceRender from './render/hyperspace'
import * as StationRender from './render/station'
import {
  BIG_SHIP_MESH_VERSION,
  createBigShipMesh,
  isBigShipMesh,
  updateBigShipCityLights,
} from './render/bigShip'
import { hasBorealDockBay, updateBorealDockBay } from './render/borealDockBay'
import {
  buildDockedStationServices,
  firstSelectableServiceIndex,
} from './render/dockedRadar'

export interface EliteHudUpdate {
  speed: number
  npcs: number
  time: number
  playerPos: { x: number; y: number; z: number }
  fuel: number
  credits: number
  cargoUsed: number
  cargoCapacity: number
  systemPos2d: { x: number; y: number }
  flightMode: string
  dockedAtStationId: string | null
  systemId: string
  borealDist: number | null
  borealDelta: { x: number; y: number; z: number } | null
  dockInvite: { stationId: string; stationName: string } | null
}

export interface EliteFrameUpdate {
  snap: EliteSnapshot
  waypoints: WaypointIndicator[]
  hud: EliteHudUpdate | null
  marketSnap: EliteSnapshot | null
  dockedEntered: boolean
  dockedServiceIndex: number
  hyperspaceCountdown?: number | null
  isHyperspacing?: boolean
}

export interface HyperspaceRefs {
  phaseRef: MutableRefObject<'idle' | 'countdown' | 'jump'>
  sequenceStartRef: MutableRefObject<number>
  lastCountdownRef: MutableRefObject<number>
  jumpStartRef: MutableRefObject<number>
  destinationRef: MutableRefObject<string | null>
  costRef: MutableRefObject<number>
}

interface UseEliteSceneOptions {
  canvasRef: RefObject<HTMLCanvasElement | null>
  simRef: MutableRefObject<EliteSim>
  getPlayerInput: () => FlightInput
  glbUrl: string
  routeRef: MutableRefObject<{ destinationId: string | null }>
  hyperspaceRefs: HyperspaceRefs
  prevFlightModeRef: MutableRefObject<string>
  onFrame: (update: EliteFrameUpdate) => void
}

export function useEliteScene({
  canvasRef,
  simRef,
  getPlayerInput,
  glbUrl,
  routeRef,
  hyperspaceRefs,
  prevFlightModeRef,
  onFrame,
}: UseEliteSceneOptions) {
  const snapRef = useRef<EliteSnapshot | null>(null)
  const onFrameRef = useRef(onFrame)
  onFrameRef.current = onFrame

  const shipIconRef = useRef<THREE.Object3D | null>(null)
  const isReadyRef = useRef(false)

  useEffect(() => {
    if (!glbUrl || !shipIconRef.current) return
    loadVechShipModel(glbUrl, shipIconRef.current).catch(() => {})
  }, [glbUrl])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(COLORS.spaceBg, 0.0018)

    const camera = new THREE.PerspectiveCamera(
      VIEW.fov,
      window.innerWidth / window.innerHeight,
      VIEW.near,
      VIEW.far,
    )
    camera.position.set(VIEW.initialPos.x, VIEW.initialPos.y, VIEW.initialPos.z)

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
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      size: WORLD.starSize,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    }))
    scene.add(stars)

    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(WORLD.sunRadius, 32, 32),
      new THREE.MeshBasicMaterial({ color: WORLD.sunColor }),
    )
    scene.add(sun)

    const bodiesGroup = new THREE.Group()
    getFrozenCartographyBodies().forEach((b) => {
      if (b.type === 'star' || isNavOnlyCartographyBody(b)) return
      const mesh = b.type === 'station'
        ? StationRender.createStationMesh(b.color, b.radius)
        : StationRender.createPlanetMesh(b.color, b.radius)
      mesh.userData.bodyId = b.id
      bodiesGroup.add(mesh)
    })
    scene.add(bodiesGroup)

    const { group: streaksGroup, streaks } = HyperspaceRender.createHyperspaceStreaks(camera)
    ;(streaksGroup as THREE.Group & { _streaks?: THREE.Mesh[] })._streaks = streaks

    CockpitRender.createCockpitFrame(camera)
    const { reticleGroup, blips } = CockpitRender.createHoloRadarAndReticle(camera)
    const { shipIcon } = createVechHoloIcon(camera)
    shipIconRef.current = shipIcon
    if (glbUrl) loadVechShipModel(glbUrl, shipIcon).catch(() => {})
    const { fuelBars } = CockpitRender.createFuelBars(camera)

    const npcGroup = new THREE.Group()
    scene.add(npcGroup)
    const npcMeshes: THREE.Object3D[] = []

    scene.add(new THREE.HemisphereLight(WORLD.hemi.sky, WORLD.hemi.ground, WORLD.hemi.intensity))
    renderer.setClearColor(COLORS.spaceBg, 1)
    camera.lookAt(0, 80, 20)
    renderer.render(scene, camera)

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    let frameId: number
    let lastTime = performance.now()
    isReadyRef.current = true

    const animate = () => {
      const now = performance.now()
      const dt = Math.min(0.066, (now - lastTime) / 1000)
      lastTime = now

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
      const helios = cartoById.get('helios')
      if (helios) {
        const local = bodyLocalPos(helios, systemPos2d)
        sun.position.set(local.x, local.y, local.z)
        sun.visible = isInsideBubble(local)
      }

      bodiesGroup.children.forEach((child) => {
        const bodyId = child.userData.bodyId as string | undefined
        const body = bodyId ? cartoById.get(bodyId) : undefined
        if (!body) return
        const local = bodyLocalPos(body, systemPos2d)
        child.position.set(local.x, local.y, local.z)
        child.visible = isInsideBubble(local)
      })
      StationRender.updateStationAnimations(bodiesGroup, snap.time)

      const p = snap.player
      const upHint = p.up || { x: 0, y: 1, z: 0 }
      const axes = viewBasisFromAttitude(p.heading, upHint)
      camera.position.set(
        -axes.forward.x * VIEW.cockpitBack + axes.up.x * VIEW.eyeHeight,
        -axes.forward.y * VIEW.cockpitBack + axes.up.y * VIEW.eyeHeight,
        -axes.forward.z * VIEW.cockpitBack + axes.up.z * VIEW.eyeHeight,
      )
      camera.up.set(axes.up.x, axes.up.y, axes.up.z)
      camera.lookAt(
        camera.position.x + axes.forward.x * VIEW.lookFar,
        camera.position.y + axes.forward.y * VIEW.lookFar,
        camera.position.z + axes.forward.z * VIEW.lookFar,
      )

      const waypoints = snap.player.flightMode !== 'hyperspace' && snap.player.flightMode !== 'docked'
        ? computeWaypoints(
          { heading: p.heading, systemPos2d: p.systemPos2d },
          { destinationId: routeRef.current.destinationId, viewport },
        )
        : []

      if (blips.length > 0) {
        const fwd = p.heading
        const upv = p.up || { x: 0, y: 1, z: 0 }
        const contacts = p.flightMode === 'docked'
          ? []
          : projectContacts(
            { pos: p.pos, heading: fwd, up: upv },
            snap.npcs,
            radarVisibleBodies(carto, systemPos2d),
            { maxShip: SCANNER_2D.maxRangeShip, maxBody: SCANNER_2D.maxRangeBody, maxMind: MIND_RADAR.maxRange },
          )
        CockpitRender.update3DRadar(blips, contacts)
      }

      const fuel = snap.player.fuel ?? FUEL.max
      const level = Math.max(0, Math.min(1, fuel / FUEL.max))
      const onCount = Math.floor(level * fuelBars.length)
      fuelBars.forEach((bar, i) => {
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

      const hyperspaceActive = hyperspaceRefs.phaseRef.current !== 'idle'
      if (reticleGroup && hyperspaceActive) {
        const t = (snap.time * 8) % (Math.PI * 2)
        reticleGroup.scale.setScalar(1 + Math.sin(t) * 0.15)
        reticleGroup.children.forEach((c) => {
          const mesh = c as THREE.Mesh
          if (mesh.material && 'color' in mesh.material) {
            (mesh.material as THREE.MeshBasicMaterial).color.set(0xff6644)
          }
        })
      } else if (reticleGroup) {
        reticleGroup.scale.setScalar(1)
        reticleGroup.children.forEach((c) => {
          const mesh = c as THREE.Mesh
          if (mesh.material && 'color' in mesh.material) {
            (mesh.material as THREE.MeshBasicMaterial).color.set(0xffaa00)
          }
        })
      }

      const frameUpdate: EliteFrameUpdate = {
        snap,
        waypoints,
        hud: null,
        marketSnap: null,
        dockedEntered: false,
        dockedServiceIndex: 0,
      }

      const streaksGrp = streaksGroup as THREE.Group & { _streaks?: THREE.Mesh[] }
      if (hyperspaceActive && streaksGrp._streaks) {
        const elapsed = (now - hyperspaceRefs.sequenceStartRef.current) / 1000

        if (hyperspaceRefs.phaseRef.current === 'countdown') {
          const remaining = Math.ceil(HYPERSPACE.countdown - elapsed)
          if (remaining > 0 && remaining !== hyperspaceRefs.lastCountdownRef.current) {
            hyperspaceRefs.lastCountdownRef.current = remaining
            frameUpdate.hyperspaceCountdown = remaining
          }
          if (elapsed >= HYPERSPACE.countdown) {
            hyperspaceRefs.phaseRef.current = 'jump'
            hyperspaceRefs.jumpStartRef.current = now
            hyperspaceRefs.lastCountdownRef.current = -1
            frameUpdate.hyperspaceCountdown = null
            frameUpdate.isHyperspacing = true
            streaksGrp.visible = true
          }
        }

        if (hyperspaceRefs.phaseRef.current === 'jump') {
          const phase = (now - hyperspaceRefs.jumpStartRef.current) / 1000 / HYPERSPACE.duration
          HyperspaceRender.updateHyperspaceStreaks(streaksGrp._streaks, phase, dt)
          streaksGrp.visible = true

          if (phase >= 1.0) {
            const destId = hyperspaceRefs.destinationRef.current
            if (destId) simRef.current.performHyperspaceJump(destId, hyperspaceRefs.costRef.current)
            streaksGrp.visible = false
            hyperspaceRefs.phaseRef.current = 'idle'
            hyperspaceRefs.sequenceStartRef.current = 0
            hyperspaceRefs.jumpStartRef.current = 0
            hyperspaceRefs.destinationRef.current = null
            frameUpdate.isHyperspacing = false
          }
        }
      }

      const current = snap.npcs
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
        npcGroup.add(m)
        npcMeshes.push(m)
      }

      const playerPos = snap.player.pos
      current.forEach((npc: NpcAgent, i: number) => {
        let m = npcMeshes[i]
        if (!m) return

        if (npc.role === 'freighter' && (m.userData.meshVersion !== BIG_SHIP_MESH_VERSION || !hasBorealDockBay(m))) {
          npcGroup.remove(m)
          m = createBigShipMesh()
          npcGroup.add(m)
          npcMeshes[i] = m
        }

        const isBoreal = npc.role === 'freighter' || !!npc.designation
        m.visible = !isBoreal || isBorealFreighterInBubble(playerPos, npc.pos)
        m.position.set(npc.pos.x - playerPos.x, npc.pos.y - playerPos.y, npc.pos.z - playerPos.z)

        if (isBoreal) {
          m.rotation.set(0, BOREAL_STATION.freighterYaw, 0)
        } else {
          const vlen = length(npc.vel)
          if (vlen > 0.3) {
            m.lookAt(
              m.position.x + (npc.vel.x / vlen) * NPC.lookAhead,
              m.position.y + (npc.vel.y / vlen) * NPC.lookAhead,
              m.position.z + (npc.vel.z / vlen) * NPC.lookAhead,
            )
          }
        }

        if (isBigShipMesh(m)) {
          updateBigShipCityLights(m, snap.time, npc.id)
          updateBorealDockBay(m, snap.time)
        }

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

      for (let i = current.length; i < npcMeshes.length; i++) {
        npcMeshes[i].visible = false
      }

      if (snap.player.flightMode === 'docked' && prevFlightModeRef.current !== 'docked') {
        frameUpdate.dockedEntered = true
        const services = buildDockedStationServices({
          fuel: snap.player.fuel ?? FUEL.starting,
          fuelMax: FUEL.max,
          marketOpen: false,
          upgradesOpen: false,
          hangarOpen: false,
        })
        frameUpdate.dockedServiceIndex = firstSelectableServiceIndex(services)
      }
      prevFlightModeRef.current = snap.player.flightMode

      if (Math.random() < 0.6) {
        const freighter = snap.npcs.find(n => n.designation || n.role === 'freighter')
        let borealDist: number | null = null
        let borealDelta: { x: number; y: number; z: number } | null = null
        if (freighter) {
          const dx = snap.player.pos.x - freighter.pos.x
          const dy = snap.player.pos.y - freighter.pos.y
          const dz = snap.player.pos.z - freighter.pos.z
          borealDist = Math.round(Math.hypot(dx, dy, dz))
          borealDelta = { x: Math.round(dx), y: Math.round(dy), z: Math.round(dz) }
        }

        frameUpdate.hud = {
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
          dockInvite: (() => {
            const invite = simRef.current.getDockInvite()
            return invite
              ? { stationId: invite.id, stationName: invite.name }
              : null
          })(),
        }
        if (snap.player.flightMode === 'docked') frameUpdate.marketSnap = snap
      }

      onFrameRef.current(frameUpdate)
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }

    frameId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(frameId)
      renderer.dispose()
      isReadyRef.current = false
      shipIconRef.current = null
    }
  }, [canvasRef, simRef, getPlayerInput, routeRef, hyperspaceRefs, prevFlightModeRef])

  return { snapRef, isReady: isReadyRef.current }
}