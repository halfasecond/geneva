import axios from 'axios'
import type { VechSavePlayer } from '../../types/vechSave'

const { VITE_APP_ENDPOINT } = import.meta.env
const VECH_API = `${VITE_APP_ENDPOINT}vech/`

let persistTimer: ReturnType<typeof setTimeout> | null = null
let pendingPersist: { tokenId: number; token: string; player: VechSavePlayer } | null = null

export async function fetchWalletCredits(token: string): Promise<number | null> {
  try {
    const res = await axios.get(`${VECH_API}wallet/credits`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const credits = res.data?.credits
    return typeof credits === 'number' && Number.isFinite(credits) ? credits : null
  } catch (err) {
    console.error('Failed to load wallet credits:', err)
    return null
  }
}

export async function fetchSave(tokenId: number, token: string): Promise<VechSavePlayer | null> {
  try {
    const res = await axios.get(`${VECH_API}save/${tokenId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data?.player ?? null
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null
    console.error('Failed to load save:', err)
    return null
  }
}

export async function persistSave(
  tokenId: number,
  token: string,
  player: VechSavePlayer,
): Promise<void> {
  try {
    await axios.put(
      `${VECH_API}save/${tokenId}`,
      { player, version: 1 },
      { headers: { Authorization: `Bearer ${token}` } },
    )
  } catch (err) {
    console.error('Failed to persist save:', err)
  }
}

/** Debounced PUT — coalesces rapid saves (dock, autosave, swap). */
export function persistSaveDebounced(
  tokenId: number,
  token: string,
  player: VechSavePlayer,
  delayMs = 2000,
): void {
  pendingPersist = { tokenId, token, player }
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    const job = pendingPersist
    pendingPersist = null
    persistTimer = null
    if (job) void persistSave(job.tokenId, job.token, job.player)
  }, delayMs)
}

/** Flush any queued debounced save immediately (page hide / hull swap). */
export async function flushPersistSave(): Promise<void> {
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = null
  }
  const job = pendingPersist
  pendingPersist = null
  if (job) await persistSave(job.tokenId, job.token, job.player)
}