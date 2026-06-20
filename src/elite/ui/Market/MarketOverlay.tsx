import React, { useMemo, useState } from 'react'
import { BIG_SHIP, DOCKED_RADAR, HULL_LABEL_FONTS, MAP, WINDSCREEN, Z } from '../../config'
import { getCargoUsed, type MarketState } from '../../sim/market'
import MarketStarfield from './MarketStarfield'
import MarketCard from './MarketCard'

type RouteSort = 'az' | 'price'

interface MarketOverlayProps {
  homeMarket: MarketState
  markets: MarketState[]
  cargo: Record<string, number>
  credits: number
  cargoCapacity: number
  onClose: () => void
  onUndock: () => void
  onTrade: (commodityId: string, tons: number, direction: 'buy' | 'sell') => void
}

const MarketOverlay: React.FC<MarketOverlayProps> = ({
  homeMarket,
  markets,
  cargo,
  credits,
  cargoCapacity,
  onClose,
  onUndock,
  onTrade,
}) => {
  const [selectedCommodityId, setSelectedCommodityId] = useState<string | null>('fuel-cells')
  const [routeSort, setRouteSort] = useState<RouteSort>('az')
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null)
  const ui = MAP.ui
  const stationTitleFont = HULL_LABEL_FONTS[BIG_SHIP.nameLabel.font]
  const stationTitleSize = DOCKED_RADAR.titleSize

  const homeListings = useMemo(
    () => Object.values(homeMarket.commodities).sort((a, b) => a.name.localeCompare(b.name)),
    [homeMarket],
  )

  const activeCommodityId = selectedCommodityId ?? homeListings[0]?.id ?? null
  const activeListing = activeCommodityId ? homeMarket.commodities[activeCommodityId] : null

  const destinations = markets.filter(m => m.id !== homeMarket.id)
  const routeListings = useMemo(() => {
    if (!activeCommodityId) return []
    const rows = destinations
      .filter(m => m.commodities[activeCommodityId])
      .map(m => ({ market: m, listing: m.commodities[activeCommodityId] }))

    return [...rows].sort((a, b) => {
      if (routeSort === 'price') return b.listing.price - a.listing.price
      return a.market.name.localeCompare(b.market.name)
    })
  }, [activeCommodityId, destinations, routeSort])

  const highestSpread = activeListing && activeCommodityId
    ? Math.max(0, ...routeListings.map(r => Math.abs(activeListing.price - r.listing.price)))
    : 0

  const tradeVol = activeCommodityId
    ? Math.max(...markets.map(m => m.commodities[activeCommodityId]?.lastTrade ?? 0))
    : 0

  const cargoUsed = getCargoUsed(cargo)

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
      aria-label="Station market holo"
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
          gridTemplateColumns: '1fr 1fr',
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
              marginBottom: 12,
            }}>
              {homeMarket.name}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              marginBottom: 10,
              padding: '8px 14px',
              borderRadius: 8,
              border: `1px solid ${ui.panelBorder}`,
              background: ui.panelBg,
              fontSize: 11,
              lineHeight: 1.4,
              whiteSpace: 'nowrap',
            }}>
              <span style={{ fontWeight: 700 }}>
                {activeListing ? `${activeListing.symbol} Market` : 'Market'}
              </span>
              <span style={{ color: ui.price, fontWeight: 700 }}>
                {highestSpread.toLocaleString()} CR max spread
              </span>
              <span style={{ opacity: 0.8, textTransform: 'uppercase', fontSize: 10 }}>
                {tradeVol > 0.1 ? `${tradeVol.toFixed(1)}t moving` : 'route idle'}
              </span>
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'grid',
              gap: 8,
              alignContent: 'start',
              paddingRight: 4,
            }}>
              {homeListings.map(listing => (
                <MarketCard
                  key={listing.id}
                  market={homeMarket}
                  listing={listing}
                  showMarketName={false}
                  showTrade={activeCommodityId === listing.id}
                  heldTons={cargo[listing.id] ?? 0}
                  credits={credits}
                  cargoUsed={cargoUsed}
                  cargoCapacity={cargoCapacity}
                  isOpen={activeCommodityId === listing.id}
                  onToggle={() => {
                    setSelectedCommodityId(activeCommodityId === listing.id ? null : listing.id)
                    setExpandedRouteId(null)
                  }}
                  onBuy={tons => onTrade(listing.id, tons, 'buy')}
                  onSell={tons => onTrade(listing.id, tons, 'sell')}
                />
              ))}
            </div>
          </section>

          <section style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 8,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              color: ui.muted,
              marginBottom: 8,
            }}>
              <span>Sort</span>
              <select
                value={routeSort}
                disabled={routeListings.length === 0}
                onChange={e => {
                  setRouteSort(e.target.value as RouteSort)
                  setExpandedRouteId(null)
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 4,
                  border: `1px solid ${ui.panelBorder}`,
                  background: ui.panelBg,
                  color: ui.text,
                  fontSize: 9,
                  fontFamily: 'inherit',
                }}
              >
                <option value="az">A-Z</option>
                <option value="price">Price</option>
              </select>
            </label>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'grid',
              gap: 8,
              alignContent: 'start',
              paddingRight: 4,
            }}>
              {activeCommodityId && routeListings.map(({ market, listing }) => (
                <MarketCard
                  key={market.id}
                  market={market}
                  listing={listing}
                  isOpen={expandedRouteId === market.id}
                  onToggle={() => setExpandedRouteId(expandedRouteId === market.id ? null : market.id)}
                />
              ))}
              {!activeCommodityId && (
                <div style={{ fontSize: 10, color: ui.muted, padding: 12 }}>Select a commodity</div>
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
          <DismissBtn label="F — Undock" onClick={onUndock} />
        </div>
      </div>
    </div>
  )
}

function DismissBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '4px 12px',
        border: `1px solid ${MAP.ui.panelBorder}`,
        borderRadius: 3,
        background: MAP.ui.panelBg,
        color: MAP.ui.muted,
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

export default MarketOverlay