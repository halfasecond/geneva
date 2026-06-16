import React from 'react'

interface ShipHoldPanelProps {
  credits: number
  cargoUsed: number
  cargoCapacity: number
}

const HOLD = {
  bg: 'rgba(4, 14, 28, 0.5)',
  border: 'rgba(0, 72, 120, 0.5)',
  text: 'rgba(88, 132, 172, 0.92)',
  divider: 'rgba(0, 72, 120, 0.45)',
} as const

/** Credits + cargo hold — centred below the bottom radar. */
const ShipHoldPanel: React.FC<ShipHoldPanelProps> = ({
  credits,
  cargoUsed,
  cargoCapacity,
}) => (
  <div style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '5px 14px',
    border: `1px solid ${HOLD.border}`,
    background: HOLD.bg,
    color: HOLD.text,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '10px',
    letterSpacing: '0.35px',
    lineHeight: 1,
    whiteSpace: 'nowrap',
  }}>
    <span>{credits.toLocaleString()} CR</span>
    <span style={{ color: HOLD.divider }}>·</span>
    <span>{cargoUsed} of {cargoCapacity}t</span>
  </div>
)

export default ShipHoldPanel