import React, { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import VechMetamask from '../../elite/ui/VechMetamask'
import { isHangarAdmin } from '../../elite/ui/hangarDebug'
import { Z } from '../../elite/config'
import type { AuthProps } from '../../types/auth'
import type { VechNft } from '../../types/vech'
import ShipSelectModal from '../../elite/ui/ShipSelectModal'
import Elite from '../../elite/ui/Elite'

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

    useEffect(() => {
        if (!loggedIn) {
            setOwnedShips([])
            setCurrentShip(null)
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

    const handleSelectShip = useCallback(async (ship: VechNft) => {
        const isOwned = ownedShips.some((s) => s.tokenId === ship.tokenId)

        if (token && isOwned) {
            try {
                await axios.post(`${VECH_API}auth/select-ship`, { token, tokenId: ship.tokenId })
            } catch (error) {
                console.error('Failed to set current ship:', error)
                return
            }
        }

        setCurrentShip(ship)
    }, [ownedShips, token])

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
                onChangeShip={() => setCurrentShip(null)}
                showPositionDebug={import.meta.env.DEV || isHangarAdmin(loggedIn)}
            />
        </>
    )
}

export default EliteApp