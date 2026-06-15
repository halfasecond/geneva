import React, { useEffect, useRef } from 'react'
import { COLORS, VECH } from '../config'
import SpeedGauge from './SpeedGauge'
import FuelGauge from './FuelGauge'
import SystemStatus from './SystemStatus'

interface VechPreviewProps {
  hud: {
    speed: number
    fuel: number
  }
}

const VechPreview: React.FC<VechPreviewProps> = ({ hud }) => {
  const vechRingCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const vechModelViewerRef = useRef<any>(null)

  const setVechCamera = () => {
    const mv = vechModelViewerRef.current
    if (mv) {
      mv.cameraOrbit = '0deg 70deg 15%'
      mv.cameraTarget = '0 -0.15 0'
      if (mv.jumpCameraToGoal) mv.jumpCameraToGoal()
    }
  }

  // Extra safety for React + model-viewer timing
  useEffect(() => {
    const t = setTimeout(setVechCamera, 50)
    return () => clearTimeout(t)
  }, [])

  // Draw the static blue holo ring overlay
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

    // Outer ring
    ctx.strokeStyle = COLORS.vechRingCss
    ctx.lineWidth = 2.5
    ctx.shadowColor = COLORS.vechRingCss
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

  const vechBlue = COLORS.vechRingCss

  return (
    <>
      {/* Model + ring area - reduced height to make ship smaller */}
      <div style={{ position: 'relative', width: '100%', height: 120 }}>
        <canvas
          ref={vechRingCanvasRef}
          width="400"
          height="140"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}
        />
        <model-viewer
          ref={vechModelViewerRef}
          src={VECH.glbUrl}
          alt="VECH hovercraft"
          cameraControls={false}
          autoRotate={false}
          disableZoom={false}
          disablePan={true}
          interactionPrompt="none"
          shadowIntensity={0.6}
          exposure={1.2}
          cameraOrbit="0deg 70deg 20%"  /* increased % to make ship appear smaller */
          cameraTarget="0 -0.15 0"
          onLoad={setVechCamera}
          style={{ width: '100%', height: '100%', background: 'transparent', position: 'relative', zIndex: 2, marginTop: '-20px' }}  /* negative margin to pull the ship up into the ring */
        />
      </div>

      {/* Small VECH label */}
      <div style={{
        fontSize: '9px',
        color: vechBlue,
        letterSpacing: '0.7px',
        textShadow: '0 0 2px #000',
        pointerEvents: 'none',
        lineHeight: 1,
        marginBottom: '12px'
      }}>
        VECH #5759
      </div>

      {/* Status UI - 3 rows vertical, width matching biggest ring (a bit less), centered */}
      <div style={{
        width: 200,  /* half the current width to make gauges narrower, centered under the ring/ship */
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        color: vechBlue,
        fontSize: '12px',  /* 50% larger */
        paddingBottom: '4px'
      }}>
        {/* Row 1: Speed top */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div>SPD</div>
          <SpeedGauge speed={hud.speed} barWidth={150} />
          <div style={{ fontSize: '10px' }}>{hud.speed}</div>
        </div>

        {/* Row 2: Fuel middle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <div>FUEL</div>
          <FuelGauge fuel={hud.fuel} barWidth={150} />
          <div style={{ fontSize: '10px' }}>1.10/h</div>
        </div>

        {/* Row 3: System stuff (SYS ENG RST WEP) as 2 rows of 2 (refactored for larger size) */}
        <SystemStatus />
      </div>
    </>
  )
}

export default VechPreview
