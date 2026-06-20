import React, { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import VechMetamask from '../../elite/ui/VechMetamask'
import { isHangarAdmin } from '../../elite/ui/hangarDebug'
import { Z } from '../../elite/config'
import { EliteSim } from '../../elite/sim/EliteSim'
import { fetchSave, fetchWalletCredits } from '../../elite/persistence/save'
import type { AuthProps } from '../../types/auth'
import type { VechNft } from '../../types/vech'
import type { VechSavePlayer } from '../../types/vechSave'
import ShipSelectModal from '../../elite/ui/ShipSelectModal'
import GameLoadingScreen from '../../elite/ui/GameLoadingScreen'
import Elite from '../../elite/ui/Elite'
import { useGameLoading } from '../../elite/useGameLoading'

const { VITE_APP_ENDPOINT } = import.meta.env
const VECH_API = `${VITE_APP_ENDPOINT}vech/`

const EliteApp: React.FC<AuthProps> = ({
    loggedIn,
    token,
    tokenId,
    handleSignIn,
    handleSignOut,
    BASE_URL,
}) => {
    const [ownedShips, setOwnedShips] = useState<VechNft[]>([])
    const [currentShip, setCurrentShip] = useState<VechNft | null>(null)
    const [shipsLoading, setShipsLoading] = useState(false)
    const [initialSave, setInitialSave] = useState<VechSavePlayer | null>(null)

    const bootLoading = useGameLoading(!!currentShip, async () => {
        if (!currentShip) return
        if (token) {
            const [saved, walletCredits] = await Promise.all([
                fetchSave(currentShip.tokenId, token),
                fetchWalletCredits(token),
            ])
            const base = saved ?? EliteSim.defaultSave()
            setInitialSave({
                ...base,
                credits: walletCredits ?? base.credits,
            })
        } else {
            setInitialSave(EliteSim.defaultSave())
        }
    })

    useEffect(() => {
        if (!loggedIn) {
            setOwnedShips([])
            setCurrentShip(null)
            setInitialSave(null)
            return
        }

        let cancelled = false
        setShipsLoading(true)

        fetch(`${VECH_API}nfts/owner/${loggedIn}`)
            .then((res) => res.json())
            .then((ships: VechNft[]) => {
                if (!cancelled) setOwnedShips(Array.isArray(ships) ? ships : [])
            })
            .catch((error) => {
                console.error('Failed to load owned VECH ships:', error)
                if (!cancelled) setOwnedShips([])
            })
            .finally(() => {
                if (!cancelled) setShipsLoading(false)
            })

        return () => { cancelled = true }
    }, [loggedIn])

    useEffect(() => {
        if (!loggedIn || !tokenId || currentShip) return
        const saved = ownedShips.find((s) => s.tokenId === tokenId)
        if (saved) setCurrentShip(saved)
    }, [loggedIn, tokenId, ownedShips, currentShip])

    const handleSelectShip = useCallback(async (ship: VechNft) => {
        const isOwned = ownedShips.some((s) => s.tokenId === ship.tokenId)

        if (token && isOwned) {
            try {
                await axios.post(`${VECH_API}auth/select-ship`, { token, tokenId: ship.tokenId })
            } catch (error) {
                console.error('Failed to set current hull:', error)
                return
            }
        }

        setCurrentShip(ship)
    }, [ownedShips, token])

    const shipLabel = currentShip?.name
        || (currentShip?.shipId ? `VECH #${currentShip.shipId}` : currentShip ? `Token #${currentShip.tokenId}` : '')

    if (!currentShip) {
        return (
            <ShipSelectModal
                loggedIn={loggedIn}
                handleSignIn={handleSignIn}
                handleSignOut={handleSignOut}
                BASE_URL={BASE_URL}
                ownedShips={ownedShips}
                shipsLoading={shipsLoading}
                savedShipTokenId={tokenId}
                onSelectShip={handleSelectShip}
            />
        )
    }

    if (!bootLoading.isReady || !initialSave) {
        return (
            <GameLoadingScreen
                state={{
                    phase: bootLoading.phase,
                    progress: bootLoading.progress,
                    message: bootLoading.message,
                }}
                shipName={shipLabel}
            />
        )
    }

    return (
        <>
            <div style={{
                position: 'fixed',
                top: 12,
                right: 12,
                zIndex: Z.auth,
            }}>
                <VechMetamask
                    loggedIn={loggedIn}
                    handleSignIn={handleSignIn}
                    handleSignOut={handleSignOut}
                    BASE_URL={BASE_URL}
                />
            </div>
            <Elite
                currentShip={currentShip}
                ownedShips={ownedShips}
                shipsLoading={shipsLoading}
                initialSave={initialSave}
                authToken={token}
                onSelectShip={handleSelectShip}
                showPositionDebug={import.meta.env.DEV || isHangarAdmin(loggedIn)}
            />
        </>
    )
}

export default EliteApp