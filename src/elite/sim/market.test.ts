import { describe, it, expect } from 'vitest'
import {
  initMarkets,
  stepMarkets,
  applyPlayerTrade,
  getMarketDiagnostics,
  getCargoUsed,
  defaultMarketConfig,
} from './market'

describe('station markets', () => {
  it('initialises four station economies with commodities', () => {
    const markets = initMarkets()
    expect(markets).toHaveLength(4)
    expect(markets[0].id).toBe('aster-hub')
    expect(Object.keys(markets[0].commodities)).toHaveLength(6)
    expect(markets[0].commodities.titanium.price).toBeGreaterThan(0)
  })

  it('advances prices over simulated hours', () => {
    let markets = initMarkets()
    const before = markets[1].commodities.water.price
    markets = stepMarkets(markets, 120, defaultMarketConfig)
    const after = markets[1].commodities.water.price
    expect(after).not.toBe(before)
  })

  it('player buy reduces station stock and updates price', () => {
    const markets = initMarkets()
    const hub = markets[0]
    const stockBefore = hub.commodities.grain.stock
    const updated = applyPlayerTrade(hub, 'grain', 2, 'buy')
    expect(updated.commodities.grain.stock).toBe(stockBefore - 2)
  })

  it('reports diagnostics after stepping', () => {
    const markets = stepMarkets(initMarkets(), 60, defaultMarketConfig)
    const diag = getMarketDiagnostics(markets)
    expect(diag.activeListings).toBe(24)
    expect(diag.averagePrice).toBeGreaterThan(0)
  })

  it('tracks cargo tonnage', () => {
    expect(getCargoUsed({ grain: 2, water: 1 })).toBe(3)
  })
})