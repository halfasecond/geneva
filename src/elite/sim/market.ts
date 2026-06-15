/**
 * Station economies — ported from Flocker Market module (controller.ts).
 * Discrete-hour supply/demand, regime-gated pricing, hub-and-spoke arbitrage.
 */

import { getFrozenCartographyBodies } from './cartography'
import { bodyLocalPos } from './systemSpace'

export interface MarketCandle {
  close: number
  high: number
  low: number
  open: number
  startedAt: number
}

export interface MarketCommodityState {
  id: string
  name: string
  symbol: string
  stock: number
  demand: number
  price: number
  candles: MarketCandle[]
  hour: number
  progress: number
  sigma: 1 | -1
  productionBias: number
  consumptionBias: number
  lastTrade: number
  regime: 'surplus' | 'scarcity'
}

export interface MarketState {
  id: string
  name: string
  commodities: Record<string, MarketCommodityState>
}

export interface MarketPlaceConfig {
  consumptionBias?: number
  productionBias?: number
}

export interface MarketConfig {
  consumption: number
  gateSensitivity: number
  marketplaces?: Record<string, Record<string, MarketPlaceConfig>>
  production: number
  timeScale: number
  tradeFriction: number
}

export interface MarketDiagnostics {
  maxSpread: number
  recentVolume: number
  scarcityCount: number
  surplusCount: number
  averagePrice: number
  activeListings: number
}

export const defaultMarketConfig: MarketConfig = {
  consumption: 1,
  gateSensitivity: 1,
  production: 1,
  timeScale: 0.1,
  tradeFriction: 0.08,
}

/** Trade hub first — inter-station arbitrage routes through index 0 (Aster Hub). */
export const STATION_MARKET_ORDER = [
  'aster-hub',
  'boreal-station',
  'cinder-exchange',
  'helio-port',
  'mira-depot',
] as const

const titaniumId = 'titanium'
const maxCandles = 36
const maxTicksPerFrame = 240
const basePrice = 3200

interface CommodityDefinition {
  basePrice: number
  id: string
  name: string
  symbol: string
}

interface MarketSeedCommodity {
  consumptionBias: number
  demand: number
  productionBias: number
  stock: number
}

interface MarketSeed {
  commodities: Record<string, MarketSeedCommodity>
  id: string
  name: string
}

const commodities: CommodityDefinition[] = [
  { basePrice: 980, id: 'grain', name: 'Grain', symbol: 'Gr' },
  { basePrice: 760, id: 'water', name: 'Water', symbol: 'H2O' },
  { basePrice: 4200, id: 'medicine', name: 'Medicine', symbol: 'Med' },
  { basePrice: 2600, id: 'fuel-cells', name: 'Fuel Cells', symbol: 'Fc' },
  { basePrice, id: titaniumId, name: 'Titanium', symbol: 'Ti' },
  { basePrice: 5400, id: 'rare-earths', name: 'Rare Earths', symbol: 'Re' },
]

const marketSeeds: MarketSeed[] = [
  {
    id: 'aster-hub',
    name: 'Aster Hub',
    commodities: {
      grain: { consumptionBias: 1.02, demand: 132, productionBias: 0.98, stock: 118 },
      water: { consumptionBias: 1.0, demand: 124, productionBias: 1.02, stock: 128 },
      medicine: { consumptionBias: 1.04, demand: 92, productionBias: 0.98, stock: 86 },
      'fuel-cells': { consumptionBias: 1.0, demand: 110, productionBias: 1.0, stock: 112 },
      titanium: { consumptionBias: 1.08, demand: 132, productionBias: 1.02, stock: 108 },
      'rare-earths': { consumptionBias: 1.02, demand: 88, productionBias: 1.0, stock: 84 },
    },
  },
  {
    id: 'boreal-station',
    name: 'Boreal Station',
    commodities: {
      grain: { consumptionBias: 1.24, demand: 154, productionBias: 0.7, stock: 72 },
      water: { consumptionBias: 1.1, demand: 132, productionBias: 0.84, stock: 88 },
      medicine: { consumptionBias: 1.16, demand: 126, productionBias: 0.76, stock: 58 },
      'fuel-cells': { consumptionBias: 0.94, demand: 96, productionBias: 1.06, stock: 122 },
      titanium: { consumptionBias: 0.96, demand: 96, productionBias: 1.08, stock: 142 },
      'rare-earths': { consumptionBias: 0.88, demand: 82, productionBias: 1.2, stock: 152 },
    },
  },
  {
    id: 'cinder-exchange',
    name: 'Cinder Exchange',
    commodities: {
      grain: { consumptionBias: 0.86, demand: 92, productionBias: 1.18, stock: 152 },
      water: { consumptionBias: 1.18, demand: 148, productionBias: 0.74, stock: 64 },
      medicine: { consumptionBias: 1.22, demand: 136, productionBias: 0.78, stock: 62 },
      'fuel-cells': { consumptionBias: 1.18, demand: 146, productionBias: 0.88, stock: 84 },
      titanium: { consumptionBias: 1.18, demand: 148, productionBias: 0.92, stock: 82 },
      'rare-earths': { consumptionBias: 1.1, demand: 124, productionBias: 0.94, stock: 96 },
    },
  },
  {
    id: 'helio-port',
    name: 'Helio Port',
    commodities: {
      grain: { consumptionBias: 1.22, demand: 146, productionBias: 0.72, stock: 68 },
      water: { consumptionBias: 1.26, demand: 158, productionBias: 0.68, stock: 58 },
      medicine: { consumptionBias: 1.04, demand: 104, productionBias: 0.9, stock: 90 },
      'fuel-cells': { consumptionBias: 0.7, demand: 74, productionBias: 1.42, stock: 176 },
      titanium: { consumptionBias: 0.78, demand: 76, productionBias: 1.28, stock: 168 },
      'rare-earths': { consumptionBias: 0.82, demand: 78, productionBias: 1.22, stock: 150 },
    },
  },
  {
    id: 'mira-depot',
    name: 'Mira Depot',
    commodities: {
      grain: { consumptionBias: 0.86, demand: 88, productionBias: 1.2, stock: 164 },
      water: { consumptionBias: 0.9, demand: 94, productionBias: 1.18, stock: 156 },
      medicine: { consumptionBias: 0.96, demand: 98, productionBias: 1.04, stock: 106 },
      'fuel-cells': { consumptionBias: 1.02, demand: 116, productionBias: 0.98, stock: 110 },
      titanium: { consumptionBias: 1.02, demand: 118, productionBias: 1.0, stock: 116 },
      'rare-earths': { consumptionBias: 1.2, demand: 142, productionBias: 0.76, stock: 68 },
    },
  },
]

interface TradeIntent {
  amount: number
  commodityId: string
  sourceIndex: number
  targetIndex: number
}

export function initMarkets(): MarketState[] {
  return marketSeeds.map((seed, index) => ({
    id: seed.id,
    name: seed.name,
    commodities: Object.fromEntries(
      commodities.map((commodity, commodityIndex) => {
        const commoditySeed = seed.commodities[commodity.id]
        const pressure = marketPressure(commoditySeed.stock, commoditySeed.demand)
        const sigma: 1 | -1 = pressure > 1 ? -1 : 1
        const price = marketPrice(commoditySeed.stock, commoditySeed.demand, sigma, commodity.basePrice)
        const listing: MarketCommodityState = {
          candles: createInitialCandles(price, index + commodityIndex * 0.37),
          consumptionBias: commoditySeed.consumptionBias,
          demand: commoditySeed.demand,
          hour: 0,
          id: commodity.id,
          lastTrade: 0,
          name: commodity.name,
          price,
          productionBias: commoditySeed.productionBias,
          progress: Math.abs(pressure - 1) * 0.35,
          regime: sigma > 0 ? 'surplus' : 'scarcity',
          sigma,
          stock: commoditySeed.stock,
          symbol: commodity.symbol,
        }
        return [commodity.id, listing]
      }),
    ) as Record<string, MarketCommodityState>,
  }))
}

export function stepMarkets(
  markets: MarketState[],
  elapsedSeconds: number,
  config: MarketConfig = defaultMarketConfig,
): MarketState[] {
  if (markets.length < 2) return markets

  const targetHour = Math.floor(elapsedSeconds * config.timeScale)
  const currentHour = Math.min(...markets.map(m => getTitanium(m).hour))
  const steps = Math.min(maxTicksPerFrame, Math.max(0, targetHour - currentHour))
  let updated = markets

  for (let step = 0; step < steps; step += 1) {
    updated = updated.map((market, index) => updateMarketHour(market, index, config))
    const intents = createTradeIntents(updated, config)
    updated = applyTradeIntents(updated, intents)
  }

  return updated
}

export function getMarketDiagnostics(markets: MarketState[]): MarketDiagnostics {
  let maxSpread = 0
  let recentVolume = 0
  let scarcityCount = 0
  let surplusCount = 0
  let priceSum = 0
  let listings = 0

  for (const market of markets) {
    for (const listing of Object.values(market.commodities)) {
      listings += 1
      priceSum += listing.price
      recentVolume += listing.lastTrade
      if (listing.regime === 'scarcity') scarcityCount += 1
      else surplusCount += 1
    }
  }

  const hub = markets[0]
  if (hub) {
    for (const commodity of commodities) {
      const home = hub.commodities[commodity.id]
      if (!home) continue
      for (let i = 1; i < markets.length; i += 1) {
        const dest = markets[i].commodities[commodity.id]
        if (!dest) continue
        maxSpread = Math.max(maxSpread, Math.abs(home.price - dest.price))
      }
    }
  }

  return {
    maxSpread,
    recentVolume,
    scarcityCount,
    surplusCount,
    averagePrice: listings > 0 ? Math.round(priceSum / listings) : 0,
    activeListings: listings,
  }
}

export function getCommodityBasePrice(commodityId: string): number {
  return getCommodityDefinition(commodityId).basePrice
}

export function getCargoUsed(cargo: Record<string, number>): number {
  return Object.values(cargo).reduce((sum, tons) => sum + tons, 0)
}

export function findBestArbitrage(
  markets: MarketState[],
  homeId: string,
  commodityId: string,
): { stationId: string; stationName: string; price: number; spread: number } | null {
  const home = markets.find(m => m.id === homeId)
  const listing = home?.commodities[commodityId]
  if (!home || !listing) return null

  let best: { stationId: string; stationName: string; price: number; spread: number } | null = null
  for (const market of markets) {
    if (market.id === homeId) continue
    const other = market.commodities[commodityId]
    if (!other) continue
    const spread = Math.abs(listing.price - other.price)
    if (!best || spread > best.spread) {
      best = { stationId: market.id, stationName: market.name, price: other.price, spread }
    }
  }
  return best
}

export function applyPlayerTrade(
  market: MarketState,
  commodityId: string,
  tons: number,
  direction: 'buy' | 'sell',
): MarketState {
  const listing = market.commodities[commodityId]
  if (!listing || tons <= 0) return market

  const stock = direction === 'buy'
    ? clamp(listing.stock - tons, 0, 260)
    : clamp(listing.stock + tons, 0, 260)
  const price = marketPrice(stock, listing.demand, listing.sigma, getCommodityDefinition(commodityId).basePrice)

  return {
    ...market,
    commodities: {
      ...market.commodities,
      [commodityId]: {
        ...listing,
        stock,
        price,
        lastTrade: tons,
        candles: updateCandles(listing.candles, price, listing.hour),
      },
    },
  }
}

export function nearestDockableStation(
  playerPos: { x: number; y: number; z: number },
  playerSystemPos2d: { x: number; y: number },
  playerSpeed: number,
  dockRange: number,
  maxApproachSpeed: number,
): { id: string; name: string; dist: number } | null {
  if (playerSpeed > maxApproachSpeed) return null

  let best: { id: string; name: string; dist: number } | null = null
  for (const body of getFrozenCartographyBodies()) {
    if (body.type !== 'station') continue
    const offset = bodyLocalPos(body, playerSystemPos2d)
    const dist = Math.hypot(offset.x, offset.y, offset.z)
    if (dist <= dockRange && (!best || dist < best.dist)) {
      best = { id: body.id, name: body.name, dist }
    }
  }
  return best
}

function updateMarketHour(market: MarketState, index: number, config: MarketConfig): MarketState {
  const seed = marketSeeds[index % marketSeeds.length]

  return {
    ...market,
    commodities: Object.fromEntries(
      commodities.map((commodity, commodityIndex) => {
        const listing = market.commodities[commodity.id]
        const commoditySeed = seed.commodities[commodity.id]
        const hour = listing.hour + 1
        const demandCycle = Math.sin(hour * 0.19 + index * 1.4 + commodityIndex * 0.51)
        const supplyCycle = Math.sin(hour * 0.13 + index * 2.2 + commodityIndex * 0.67)
        const priceCycle = Math.sin(hour * 0.47 + index * 1.9 + commodityIndex * 0.29)
        const marketplaceConfig = config.marketplaces?.[market.id]?.[commodity.id]
        const productionBias = marketplaceConfig?.productionBias ?? listing.productionBias
        const consumptionBias = marketplaceConfig?.consumptionBias ?? listing.consumptionBias
        const stockPressure = clamp(
          (listing.demand - listing.stock) / Math.max(1, Math.max(listing.demand, listing.stock)),
          -1,
          1,
        )
        const demand = clamp(
          listing.demand +
            (commoditySeed.demand - listing.demand) * 0.035 +
            demandCycle * 0.32 +
            stockPressure * 0.05,
          45,
          220,
        )
        const production =
          config.production *
          productionBias *
          (1 + stockPressure * 0.72 + supplyCycle * 0.11)
        const desiredConsumption =
          config.consumption *
          consumptionBias *
          (1 + demandCycle * 0.06)
        const consumption = Math.min(listing.stock, desiredConsumption)
        const stock = clamp(listing.stock + production - consumption, 20, 240)
        const pressure = marketPressure(stock, demand)
        const targetSigma: 1 | -1 = pressure > 1.12 ? -1 : pressure < 0.88 ? 1 : listing.sigma
        const regimeConflict = targetSigma !== listing.sigma
        const delta = (regimeConflict ? 0.055 : -0.028) * config.gateSensitivity
        const progress = clamp(
          listing.progress + delta * Math.min(1.4, Math.abs(pressure - 1) + 0.2),
          0,
          1.2,
        )
        const flips = Math.floor(progress)
        const sigma: 1 | -1 = flips % 2 === 1 ? invert(listing.sigma) : listing.sigma
        const boundedProgress = flips > 0 ? progress % 1 : progress
        const price = Math.round(
          marketPrice(stock, demand, sigma, commodity.basePrice) *
            clamp(1 + (priceCycle + supplyCycle * 0.5) * 0.014, 0.96, 1.04),
        )

        return [
          commodity.id,
          {
            ...listing,
            candles: updateCandles(listing.candles, price, hour),
            demand,
            hour,
            lastTrade: Math.max(0, listing.lastTrade * 0.82),
            price,
            progress: boundedProgress,
            regime: sigma > 0 ? 'surplus' : 'scarcity',
            sigma,
            stock,
          },
        ]
      }),
    ) as Record<string, MarketCommodityState>,
  }
}

function createTradeIntents(markets: MarketState[], config: MarketConfig) {
  const intents: TradeIntent[] = []

  for (const commodity of commodities) {
    const home = markets[0].commodities[commodity.id]
    if (!home) continue

    for (let index = 1; index < markets.length; index += 1) {
      const destination = markets[index].commodities[commodity.id]
      if (!destination) continue

      const gap = Math.abs(home.price - destination.price) / commodity.basePrice
      if (gap < config.tradeFriction) continue

      const sourceIndex = home.price < destination.price ? 0 : index
      const targetIndex = sourceIndex === 0 ? index : 0
      const source = sourceIndex === 0 ? home : destination
      const target = targetIndex === 0 ? home : destination
      const amount = Math.min(source.stock * 0.018, Math.max(0, target.demand - target.stock) * 0.035, 4)

      if (amount > 0) {
        intents.push({ amount, commodityId: commodity.id, sourceIndex, targetIndex })
      }
    }
  }

  return intents
}

function applyTradeIntents(markets: MarketState[], intents: TradeIntent[]) {
  if (intents.length === 0) return markets

  const stockDeltas = markets.map(() => ({} as Record<string, number>))
  const lastTrades = markets.map(() => ({} as Record<string, number>))

  for (const intent of intents) {
    stockDeltas[intent.sourceIndex][intent.commodityId] =
      (stockDeltas[intent.sourceIndex][intent.commodityId] ?? 0) - intent.amount
    stockDeltas[intent.targetIndex][intent.commodityId] =
      (stockDeltas[intent.targetIndex][intent.commodityId] ?? 0) + intent.amount
    lastTrades[intent.sourceIndex][intent.commodityId] =
      (lastTrades[intent.sourceIndex][intent.commodityId] ?? 0) + intent.amount
    lastTrades[intent.targetIndex][intent.commodityId] =
      (lastTrades[intent.targetIndex][intent.commodityId] ?? 0) + intent.amount
  }

  return markets.map((market, index) => ({
    ...market,
    commodities: Object.fromEntries(
      Object.entries(market.commodities).map(([commodityId, listing]) => {
        const delta = stockDeltas[index][commodityId] ?? 0
        const traded = lastTrades[index][commodityId] ?? 0
        if (delta === 0 && traded === 0) return [commodityId, listing]

        const stock = clamp(listing.stock + delta, 0, 260)
        const price = marketPrice(
          stock,
          listing.demand,
          listing.sigma,
          getCommodityDefinition(commodityId).basePrice,
        )

        return [
          commodityId,
          {
            ...listing,
            candles: updateCandles(listing.candles, price, listing.hour),
            lastTrade: traded > 0 ? traded : listing.lastTrade,
            price,
            stock,
          },
        ]
      }),
    ) as Record<string, MarketCommodityState>,
  }))
}

function updateCandles(candles: MarketCandle[], price: number, hour: number) {
  const current = candles.at(-1)

  if (!current || hour > current.startedAt) {
    const open = current?.close ?? price
    const wickNoise = Math.sin(hour * 1.37 + price * 0.003)
    const wickRange = Math.max(18, Math.abs(price - open) * 0.45 + 24 + Math.abs(wickNoise) * 38)

    return [
      ...candles.slice(-(maxCandles - 1)),
      {
        close: price,
        high: Math.round(Math.max(open, price) + wickRange),
        low: Math.round(Math.min(open, price) - wickRange * 0.75),
        open,
        startedAt: hour,
      },
    ]
  }

  return [
    ...candles.slice(0, -1),
    {
      ...current,
      close: price,
      high: Math.max(current.high, price),
      low: Math.min(current.low, price),
    },
  ]
}

function createInitialCandles(price: number, marketIndex: number) {
  const candles: MarketCandle[] = []
  const olderPrice = price * (marketIndex === 0 ? 1.08 : 0.86)
  let previousClose = olderPrice

  for (let i = 0; i < 24; i += 1) {
    const progress = i / 23
    const trendPrice = olderPrice + (price - olderPrice) * progress
    const liveBlend = Math.max(0, 1 - progress)
    const wave = i === 23
      ? 0
      : (Math.sin(i * 0.75 + marketIndex * 1.8) * 42 +
          Math.sin(i * 1.9 + marketIndex * 0.6) * 24) *
        liveBlend
    const open = previousClose
    const close = i === 23
      ? price
      : clamp(trendPrice + wave, price * 0.65, price * 1.45)
    const high = Math.max(open, close) + 18 + Math.abs(Math.sin(i + marketIndex)) * 64
    const low = Math.min(open, close) - 18 - Math.abs(Math.cos(i * 0.9 + marketIndex)) * 58

    candles.push({
      close: Math.round(close),
      high: Math.round(high),
      low: Math.round(low),
      open: Math.round(open),
      startedAt: i - 23,
    })
    previousClose = close
  }

  return candles
}

function marketPressure(stock: number, demand: number) {
  return demand / Math.max(stock, 1)
}

function marketPrice(stock: number, demand: number, sigma: 1 | -1, priceBase = basePrice) {
  const pressure = marketPressure(stock, demand)
  const regimePremium = sigma < 0 ? 1.18 : 0.94
  return Math.round(priceBase * clamp(0.55 + pressure * 0.45, 0.55, 1.85) * regimePremium)
}

function getTitanium(market: MarketState): MarketCommodityState {
  return market.commodities[titaniumId]
}

function getCommodityDefinition(commodityId: string): CommodityDefinition {
  return commodities.find(c => c.id === commodityId) ?? commodities[0]
}

function invert(value: 1 | -1): 1 | -1 {
  return value > 0 ? -1 : 1
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}