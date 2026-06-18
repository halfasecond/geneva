import React from 'react'
import { COLORS, MAP } from '../config'
import type { VechNft } from '../../types/vech'

interface ShipAttributesPanelProps {
  ship: Pick<VechNft, 'name' | 'shipId' | 'attributes'>
}

/** Indexed VECH traits — shown beside the docked ship upgrades holo. */
const ShipAttributesPanel: React.FC<ShipAttributesPanelProps> = ({ ship }) => {
  const ui = MAP.ui
  const attributes = ship.attributes ?? []
  const title = ship.name || (ship.shipId ? `VECH #${ship.shipId}` : 'VECH')

  if (!attributes.length) return null

  return (
    <div style={{
      width: '100%',
      maxWidth: 280,
      padding: '12px 14px',
      borderRadius: 8,
      border: `1px solid ${ui.panelBorder}`,
      background: ui.panelBg,
      boxSizing: 'border-box',
      pointerEvents: 'none',
    }}>
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1.1,
        textTransform: 'uppercase',
        color: ui.text,
        marginBottom: 10,
        paddingBottom: 8,
        borderBottom: `1px solid ${ui.rowBorder}`,
      }}>
        {title}
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {attributes.map((attr) => (
          <div key={attr.trait_type} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}>
            <div style={{
              fontSize: 8,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              color: ui.muted,
              lineHeight: 1.3,
            }}>
              {attr.trait_type}
            </div>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: COLORS.vechRingCss,
              lineHeight: 1.35,
            }}>
              {attr.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ShipAttributesPanel