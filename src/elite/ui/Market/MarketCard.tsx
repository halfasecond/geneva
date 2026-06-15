import React from 'react'
import { MARKET } from '../../config'
import type { MarketCandle, MarketCommodityState, MarketState } from '../../sim/market'

const ui = MARKET.ui
const maxPrice = MARKET.maxChartPrice

interface MarketCardProps {
  market: MarketState
  listing: MarketCommodityState
  isOpen: boolean
  showMarketName?: boolean
  showTrade?: boolean
  heldTons?: number
  onToggle: () => void
  onBuy?: (tons: number) => void
  onSell?: (tons: number) => void
}

const MarketCard: React.FC<MarketCardProps> = ({
  market,
  listing,
  isOpen,
  showMarketName = true,
  showTrade = false,
  heldTons = 0,
  onToggle,
  onBuy,
  onSell,
}) => {
  const regimeTone = listing.regime === 'surplus' ? 'surplus' : 'scarcity'
  const pressure = listing.demand / Math.max(listing.stock, 1)
  const regimeStrength = Math.max(
    0.08,
    Math.min(1, 0.16 + Math.max(0, listing.sigma < 0 ? pressure - 1 : 1 - pressure) * 2.4),
  )

  return (
    <article
      style={{
        border: `1px solid ${isOpen ? ui.cardActiveBorder : ui.cardBorder}`,
        borderRadius: 6,
        background: ui.cardBg,
        overflow: 'hidden',
        boxShadow: isOpen ? '0 0 20px rgba(102, 170, 255, 0.08)' : 'none',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '10px 12px',
          border: 'none',
          background: 'transparent',
          color: '#e8eef8',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{
            width: 10,
            height: 10,
            borderRadius: 2,
            background: listing.regime === 'surplus' ? ui.surplus : ui.scarcity,
            flexShrink: 0,
          }} />
          <span style={{ fontSize: 11, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {showMarketName ? `${market.name} – ` : ''}
            {listing.name}
            <small style={{ fontWeight: 500, opacity: 0.7 }}> [{listing.symbol}]</small>
          </span>
        </span>
        <strong style={{ color: ui.price, fontSize: 12, flexShrink: 0 }}>
          {listing.price.toLocaleString()} CR
        </strong>
      </button>

      {isOpen && (
        <div style={{ padding: '0 12px 12px' }}>
          <div style={{ display: 'grid', gap: 5, marginBottom: 10 }}>
            <Meter label={listing.regime} tone={regimeTone} value={regimeStrength} />
            <Meter label="Price" tone={regimeTone} value={listing.price / maxPrice} />
            <Meter label="Demand" tone="demand" value={listing.demand / 220} />
            <Meter label="Stock" tone="stock" value={listing.stock / 220} />
          </div>

          <CandlestickChart candles={listing.candles.slice(-28)} />

          {showTrade && (
            <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 9, opacity: 0.65, marginRight: 4 }}>Hold {heldTons}t</span>
              <TradeBtn label="Buy 1t" onClick={() => onBuy?.(1)} />
              <TradeBtn label="Buy 5t" onClick={() => onBuy?.(5)} />
              <TradeBtn label="Sell 1t" onClick={() => onSell?.(1)} />
            </div>
          )}
        </div>
      )}
    </article>
  )
}

function Meter({ label, tone, value }: { label: string; tone: string; value: number }) {
  const fill =
    tone === 'demand' ? ui.demand
      : tone === 'stock' ? ui.stock
        : tone === 'scarcity' ? ui.scarcity
          : ui.surplus

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 8, letterSpacing: 0.8, textTransform: 'uppercase', opacity: 0.75 }}>
        {label}
      </span>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${Math.max(4, Math.min(100, value * 100))}%`,
          background: fill,
          borderRadius: 3,
        }} />
      </div>
    </div>
  )
}

function CandlestickChart({ candles }: { candles: MarketCandle[] }) {
  if (candles.length === 0) {
    return <div style={{ height: 72, background: ui.chartBg, borderRadius: 4 }} />
  }

  const low = Math.min(...candles.map(c => c.low))
  const high = Math.max(...candles.map(c => c.high))
  const range = Math.max(1, high - low)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${candles.length}, minmax(4px, 1fr))`,
        gap: 1,
        height: 72,
        padding: '6px 4px',
        background: ui.chartBg,
        borderRadius: 4,
        alignItems: 'stretch',
      }}
      aria-hidden
    >
      {candles.map(candle => {
        const highPct = ((high - candle.high) / range) * 100
        const lowPct = ((high - candle.low) / range) * 100
        const openPct = ((high - candle.open) / range) * 100
        const closePct = ((high - candle.close) / range) * 100
        const top = Math.min(openPct, closePct)
        const height = Math.max(4, Math.abs(closePct - openPct))
        const rising = candle.close >= candle.open
        const color = rising ? ui.chartUp : ui.chartDown

        return (
          <span key={candle.startedAt} style={{ position: 'relative', display: 'block', minWidth: 4 }}>
            <i style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 1,
              top: `${highPct}%`,
              height: `${Math.max(2, lowPct - highPct)}%`,
              background: color,
              opacity: 0.7,
            }} />
            <i style={{
              position: 'absolute',
              left: '15%',
              right: '15%',
              top: `${top}%`,
              height: `${height}%`,
              background: color,
              borderRadius: 1,
            }} />
          </span>
        )
      })}
    </div>
  )
}

function TradeBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '4px 8px',
        fontSize: 9,
        letterSpacing: 0.5,
        border: '1px solid rgba(102, 170, 255, 0.3)',
        borderRadius: 3,
        background: 'rgba(4, 16, 32, 0.6)',
        color: '#d8eeff',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  )
}

export default MarketCard