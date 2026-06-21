import React from 'react'
import { COLORS, WINDSCREEN, Z } from '../config'

interface ShipRelayPromptProps {
  /** Vessel label for the ship-mind relay line (e.g. VECH #42). */
  shipLabel?: string
  relayTag?: string
  message: string
  action: string
  hidden?: boolean
}

/**
 * Mid-windscreen ship-AI relay — station/body comms framed as mind-to-pilot dialogue.
 */
const ShipRelayPrompt: React.FC<ShipRelayPromptProps> = ({
  shipLabel = 'Ship mind',
  relayTag = 'inbound relay',
  message,
  action,
  hidden = false,
}) => {
  if (hidden) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: WINDSCREEN.top,
        left: WINDSCREEN.left,
        right: WINDSCREEN.right,
        bottom: WINDSCREEN.bottom,
        zIndex: Z.cockpitWidgets - 1,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      }}
      role="status"
      aria-live="polite"
    >
      <div
        style={{
          maxWidth: 480,
          padding: '14px 22px',
          textAlign: 'center',
          border: `1px solid ${COLORS.vechRingCss}33`,
          borderRadius: 2,
          background: 'rgba(0, 6, 14, 0.72)',
          boxShadow: '0 0 24px rgba(102, 170, 255, 0.12), inset 0 0 20px rgba(0, 170, 255, 0.04)',
          color: COLORS.vechRingCss,
        }}
      >
        <div style={{
          fontSize: 9,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'rgba(170, 204, 221, 0.65)',
          marginBottom: 10,
        }}>
          {shipLabel} · {relayTag}
        </div>
        <div style={{
          fontSize: 14,
          lineHeight: 1.45,
          letterSpacing: '0.02em',
          color: '#d8eeff',
        }}>
          {message}
        </div>
        <div style={{
          marginTop: 10,
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: COLORS.vechRingCss,
          opacity: 0.9,
        }}>
          {action}
        </div>
      </div>
    </div>
  )
}

export default ShipRelayPrompt