import React, { useEffect, useRef } from 'react'
import { MAP, VECH, WINDSCREEN, Z } from '../config'

interface ShipUpgradesOverlayProps {
  glbUrl: string
  onClose: () => void
}

/** Docked ship upgrades POC — drag to orbit, auto-rotates when idle. */
const ShipUpgradesOverlay: React.FC<ShipUpgradesOverlayProps> = ({ glbUrl, onClose }) => {
  const modelRef = useRef<any>(null)
  const ui = MAP.ui

  useEffect(() => {
    const mv = modelRef.current as (HTMLElement & {
      cameraOrbit?: string
      cameraTarget?: string
      jumpCameraToGoal?: () => void
    }) | null
    if (!mv) return

    mv.tabIndex = -1
    mv.cameraOrbit = VECH.upgradesPreview.cameraOrbit
    mv.cameraTarget = VECH.upgradesPreview.cameraTarget
    if (mv.jumpCameraToGoal) mv.jumpCameraToGoal()

    // Orbit drag focuses model-viewer — release so ↑↓ stay on the services console.
    const releaseFocus = () => {
      if (document.activeElement === mv) mv.blur()
    }
    mv.addEventListener('pointerup', releaseFocus)
    mv.addEventListener('mouseup', releaseFocus)
    return () => {
      mv.removeEventListener('pointerup', releaseFocus)
      mv.removeEventListener('mouseup', releaseFocus)
    }
  }, [])

  return (
    <div
      style={{
        position: 'absolute',
        top: WINDSCREEN.top,
        left: WINDSCREEN.left,
        right: WINDSCREEN.right,
        bottom: WINDSCREEN.bottom,
        zIndex: Z.market,
        overflow: 'hidden',
        pointerEvents: 'auto',
        border: `1px solid ${WINDSCREEN.border}`,
        boxShadow: WINDSCREEN.innerGlow,
        background: MAP.windscreenBg,
        fontFamily: ui.font,
        color: ui.text,
      }}
      role="dialog"
      aria-label="Ship upgrades holo"
    >
      <style>{`
        model-viewer:focus,
        model-viewer:focus-visible {
          outline: none !important;
          box-shadow: none !important;
        }
      `}</style>
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: '14px 18px 16px',
        pointerEvents: 'none',
      }}>
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
          pointerEvents: 'auto',
        }}>
          <div style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: `1px solid ${ui.panelBorder}`,
            background: ui.panelBg,
            fontSize: 10,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            fontWeight: 700,
          }}>
            Ship Upgrades · VECH #5759
          </div>
          <div style={{ fontSize: 9, color: ui.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
            Drag to orbit · scroll to zoom
          </div>
        </header>

        <div style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
        }}>
          <model-viewer
            ref={modelRef}
            src={glbUrl}
            alt="VECH Founder Edition"
            camera-controls
            auto-rotate
            auto-rotate-delay="0"
            rotation-per-second="18deg"
            disable-pan
            interaction-prompt="none"
            shadow-intensity="0.75"
            exposure="0.55"
            camera-orbit={VECH.upgradesPreview.cameraOrbit}
            camera-target={VECH.upgradesPreview.cameraTarget}
            tabIndex={-1}
            style={{
              width: 'min(92%, 720px)',
              height: '100%',
              maxHeight: '100%',
              background: 'transparent',
              outline: 'none',
            }}
          />
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: 10,
          pointerEvents: 'auto',
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '4px 12px',
              border: `1px solid ${ui.panelBorder}`,
              borderRadius: 3,
              background: ui.panelBg,
              color: ui.muted,
              font: '9px/1 ui-monospace, monospace',
              letterSpacing: 1,
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            Esc — Back
          </button>
        </div>
      </div>
    </div>
  )
}

export default ShipUpgradesOverlay