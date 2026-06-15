/**
 * HoloPanel - reusable draggable "Minority Report" style holographic MFD.
 * Extracted from the three near-identical panels that lived inline in Elite.tsx.
 *
 * Usage:
 *   <HoloPanel title="CARTOGRAPHY" pos={pos} onStartDrag={start} onClose={...}>
 *     {children}
 *   </HoloPanel>
 */

import React from 'react'
import { COLORS, PANELS } from '../../config'

interface HoloPanelProps {
  title: string
  pos: { x: number; y: number }
  width?: number
  onStartDrag: (e: React.MouseEvent) => void
  onClose?: () => void
  children: React.ReactNode
  footer?: React.ReactNode
}

const HoloPanel: React.FC<HoloPanelProps> = ({
  title,
  pos,
  width = PANELS.width,
  onStartDrag,
  onClose,
  children,
  footer,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width,
        background: COLORS.panelBg,
        border: `1px solid ${COLORS.panelBorder}`,
        borderRadius: 4,
        boxShadow: '0 0 25px rgba(0, 160, 255, 0.35), inset 0 0 30px rgba(0, 80, 140, 0.15)',
        backdropFilter: 'blur(6px)',
        zIndex: PANELS.z,
        pointerEvents: 'auto',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        color: '#aaddff',
        overflow: 'hidden',
      }}
    >
      <div
        onMouseDown={onStartDrag}
        style={{
          background: PANELS.headerGradient,
          padding: '4px 10px',
          fontSize: 9,
          letterSpacing: 1.2,
          borderBottom: `1px solid ${PANELS.headerBorder}`,
          cursor: 'move',
          userSelect: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>{title}</div>
        {onClose && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#66bbff',
              fontSize: 13,
              cursor: 'pointer',
              lineHeight: 1,
              padding: '0 2px',
            }}
          >
            ✕
          </button>
        )}
      </div>

      <div style={{ padding: 8 }}>{children}</div>

      {footer && (
        <div style={{ fontSize: 7, opacity: 0.35, textAlign: 'center', marginBottom: 4, padding: '0 8px' }}>
          {footer}
        </div>
      )}
    </div>
  )
}

export default HoloPanel
