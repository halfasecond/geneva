import React, { useMemo } from 'react'
import { BIG_SHIP, COLORS, DOCKED_RADAR, HULL_LABEL_FONTS, MAP, WINDSCREEN, Z } from '../../config'
import type { VechNft } from '../../../types/vech'
import MarketStarfield from '../Market/MarketStarfield'

const OPENSEA_VECH = 'https://opensea.io/collection/vechio'

interface HangarOverlayProps {
  stationName: string
  ownedShips: VechNft[]
  currentShip: VechNft
  shipsLoading: boolean
  onClose: () => void
  onSelectShip: (ship: VechNft) => void
}

const HangarOverlay: React.FC<HangarOverlayProps> = ({
  stationName,
  ownedShips,
  currentShip,
  shipsLoading,
  onClose,
  onSelectShip,
}) => {
  const ui = MAP.ui
  const stationTitleFont = HULL_LABEL_FONTS[BIG_SHIP.nameLabel.font]
  const stationTitleSize = DOCKED_RADAR.titleSize

  const shipLabel = (ship: VechNft) =>
    ship.name || (ship.shipId ? `VECH #${ship.shipId}` : `Token #${ship.tokenId}`)

  const sortedShips = useMemo(
    () => [...ownedShips].sort((a, b) => shipLabel(a).localeCompare(shipLabel(b))),
    [ownedShips],
  )

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
      aria-label="Station hangar holo"
    >
      <MarketStarfield />

      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: '10px 18px 16px',
        pointerEvents: 'none',
      }}>
        <div style={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: '1fr 1.1fr',
          gap: 14,
          pointerEvents: 'auto',
        }}>
          <section style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{
              fontFamily: stationTitleFont,
              fontWeight: 800,
              fontSize: stationTitleSize,
              color: DOCKED_RADAR.nameColor,
              letterSpacing: DOCKED_RADAR.letterSpacing * stationTitleSize,
              textTransform: 'uppercase',
              lineHeight: 1,
              marginBottom: 4,
            }}>
              {stationName}
            </div>
            <div style={{
              fontSize: 9,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
              color: ui.muted,
              marginBottom: 12,
            }}>
              Hangar Bay
            </div>

            <div style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              padding: 12,
              borderRadius: 8,
              border: `1px solid ${ui.panelBorder}`,
              background: ui.panelBg,
            }}>
              <div style={{
                fontSize: 10,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                color: COLORS.vechRingCss,
                marginBottom: 8,
              }}>
                Active Hull
              </div>
              <div style={{
                flex: 1,
                minHeight: 120,
                border: `1px solid rgba(102, 170, 255, 0.25)`,
                borderRadius: 4,
                background: 'rgba(0, 6, 14, 0.45)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {currentShip.image ? (
                  <img
                    src={currentShip.image}
                    alt={shipLabel(currentShip)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: 11, color: ui.muted, letterSpacing: 1 }}>
                    {shipLabel(currentShip)}
                  </span>
                )}
              </div>
              <div style={{
                marginTop: 10,
                fontSize: 12,
                fontWeight: 700,
                color: COLORS.vechRingCss,
              }}>
                {shipLabel(currentShip)}
              </div>
              <div style={{ fontSize: 9, color: ui.muted, marginTop: 4 }}>
                Token #{currentShip.tokenId}
              </div>
            </div>
          </section>

          <section style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{
              fontSize: 9,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              color: ui.muted,
              marginBottom: 10,
            }}>
              Select Vessel
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(108px, 1fr))',
              gap: 8,
              alignContent: 'start',
              paddingRight: 4,
            }}>
              {shipsLoading ? (
                <div style={{ fontSize: 10, color: ui.muted, padding: 12, gridColumn: '1 / -1' }}>
                  Scanning hangar…
                </div>
              ) : sortedShips.length === 0 ? (
                <div style={{ padding: 12, gridColumn: '1 / -1' }}>
                  <p style={{ margin: '0 0 8px', fontSize: 11, color: ui.muted }}>
                    No Vech Founder Edition hulls in this wallet.
                  </p>
                  <a
                    href={OPENSEA_VECH}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 10, color: COLORS.vechRingCss, letterSpacing: 0.8 }}
                  >
                    Acquire on OpenSea →
                  </a>
                </div>
              ) : (
                sortedShips.map((ship) => {
                  const active = ship.tokenId === currentShip.tokenId
                  return (
                    <button
                      key={ship.tokenId}
                      type="button"
                      onClick={() => onSelectShip(ship)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        padding: 6,
                        border: active
                          ? `1px solid ${COLORS.vechRingCss}`
                          : `1px solid ${ui.panelBorder}`,
                        borderRadius: 6,
                        background: active ? 'rgba(102, 170, 255, 0.12)' : ui.panelBg,
                        cursor: active ? 'default' : 'pointer',
                        color: ui.text,
                        font: 'inherit',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{
                        height: 72,
                        borderRadius: 4,
                        overflow: 'hidden',
                        background: 'rgba(0, 8, 18, 0.6)',
                        marginBottom: 6,
                      }}>
                        {ship.image ? (
                          <img
                            src={ship.image}
                            alt={shipLabel(ship)}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 9,
                            color: ui.muted,
                          }}>
                            {ship.shipId ?? ship.tokenId}
                          </div>
                        )}
                      </div>
                      <span style={{
                        fontSize: 9,
                        lineHeight: 1.3,
                        color: active ? COLORS.vechRingCss : ui.text,
                        fontWeight: active ? 700 : 500,
                      }}>
                        {shipLabel(ship)}
                      </span>
                      {active && (
                        <span style={{
                          marginTop: 4,
                          fontSize: 8,
                          letterSpacing: 1,
                          textTransform: 'uppercase',
                          color: COLORS.vechRingCss,
                        }}>
                          Docked
                        </span>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </section>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 10,
          marginTop: 10,
          pointerEvents: 'auto',
        }}>
          <DismissBtn label="Esc — Back" onClick={onClose} />
        </div>
      </div>
    </div>
  )
}

function DismissBtn({ label, onClick }: { label: string; onClick: () => void }) {
  const ui = MAP.ui
  return (
    <button
      type="button"
      onClick={onClick}
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
      {label}
    </button>
  )
}

export default HangarOverlay