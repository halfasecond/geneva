import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
import type { EliteSnapshot } from '../sim/core/types'
import {
  EMPTY_ROUTE,
  canInitiateHyperspace,
  getBodyById,
  getRouteJumpCost,
} from '../sim/cartography'
import {
  COLORS, SCANNER_2D, HYPERSPACE, FUEL, MARKET, Z, DASHBOARD, WAYPOINTS,
  DOCKED_RADAR,
} from '../config'
import {
  activateDockedService,
  buildDockedStationServices,
  stepDockedServiceIndex,
} from '../render/dockedRadar'
import type { WaypointIndicator } from '../sim/waypoints'
import { useFlightInput } from '../useFlightInput'
import { useEliteScene, type EliteFrameUpdate } from '../useEliteScene'
import { useRadar2D } from '../useRadar2D'
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
import DockInvitePrompt from './DockInvitePrompt'
import PositionDebug from './PositionDebug'
import {
  fetchSave,
  fetchWalletCredits,
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
    const sim = new EliteSim()
    sim.fromSave(initialSave)
    simRef.current = sim
  }
  const authTokenRef = useRef(authToken)
  authTokenRef.current = authToken
  const hullTokenIdRef = useRef(currentShip.tokenId)
  hullTokenIdRef.current = currentShip.tokenId
  const prevFlightModeRef = useRef<string>('normal')
  const radar2DCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [waypoints, setWaypoints] = useState<WaypointIndicator[]>([])
  const hyperspacePhaseRef = useRef<'idle' | 'countdown' | 'jump'>('idle')
  const hyperspaceSequenceStartRef = useRef(0)
  const hyperspaceLastCountdownRef = useRef(-1)

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
    dockInvite: null as { stationId: string; stationName: string } | null,
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

  const { getInput: getPlayerInput } = useFlightInput()

  const shipLabel = currentShip.name
    || (currentShip.shipId ? `VECH #${currentShip.shipId}` : `Token #${currentShip.tokenId}`)

  const queuePersist = useCallback(() => {
    const token = authTokenRef.current
    if (!token) return
    persistSaveDebounced(hullTokenIdRef.current, token, simRef.current.toSave())
  }, [])
  const queuePersistRef = useRef(queuePersist)
  queuePersistRef.current = queuePersist

  const hyperspaceRefs = useMemo(() => ({
    phaseRef: hyperspacePhaseRef,
    sequenceStartRef: hyperspaceSequenceStartRef,
    lastCountdownRef: hyperspaceLastCountdownRef,
    jumpStartRef: hyperspaceJumpStartRef,
    destinationRef: hyperspaceDestinationRef,
    costRef: hyperspaceCostRef,
  }), [])

  const handleFrame = useCallback((update: EliteFrameUpdate) => {
    setWaypoints(update.waypoints)
    if (update.dockedEntered) {
      setMarketOpen(false)
      setUpgradesOpen(false)
      setHangarOpen(false)
      dockedServiceIndexRef.current = update.dockedServiceIndex
      queuePersistRef.current()
    }
    if (update.hud) setHud(update.hud)
    if (update.marketSnap) setMarketSnap(update.marketSnap)
    if (update.hyperspaceCountdown !== undefined) {
      setHyperspaceCountdown(update.hyperspaceCountdown)
    }
    if (update.isHyperspacing !== undefined) {
      setIsHyperspacing(update.isHyperspacing)
    }
  }, [])

  const { snapRef } = useEliteScene({
    canvasRef,
    simRef,
    getPlayerInput,
    glbUrl,
    routeRef,
    hyperspaceRefs,
    prevFlightModeRef,
    onFrame: handleFrame,
  })

  const handleHullSelect = useCallback(async (ship: VechNft) => {
    if (ship.tokenId === hullTokenIdRef.current) return
    const token = authTokenRef.current
    if (token) {
      await flushPersistSave()
      const walletCredits = simRef.current.player.credits
      await persistSave(hullTokenIdRef.current, token, simRef.current.toSave())
      const [next, resolvedCredits] = await Promise.all([
        fetchSave(ship.tokenId, token),
        fetchWalletCredits(token),
      ])
      const base = next ?? EliteSim.defaultSave()
      simRef.current.fromSave({
        ...base,
        credits: resolvedCredits ?? walletCredits ?? base.credits,
      })
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

      <DockInvitePrompt
        stationName={hud.dockInvite?.stationName ?? ''}
        shipLabel={shipLabel}
        hidden={
          !hud.dockInvite
          || mapOpen
          || marketOpen
          || upgradesOpen
          || hangarOpen
          || isHyperspacing
          || hyperspaceCountdown !== null
          || hud.flightMode === 'docked'
          || hud.flightMode === 'docking_in'
          || hud.flightMode === 'dock_flyin'
          || hud.flightMode === 'undocking'
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
            credits={marketSnap.player.credits}
            cargoCapacity={marketSnap.player.cargoCapacity}
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
        mapOpen={mapOpen}
        mapToggleDisabled={isHyperspacing || hyperspaceCountdown !== null}
        onToggleMap={() => {
          if (hyperspacePhaseRef.current !== 'idle') return
          setMapOpen(open => !open)
        }}
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
