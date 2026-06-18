import React, { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import VechMetamask from '../../elite/ui/VechMetamask'
import type { AuthProps } from '../../types/auth'
import type { VechNft } from '../../types/vech'
import ShipSelectModal from '../../elite/ui/ShipSelectModal'
import Elite from './Elite'

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

    const handleSelectShip = useCallback(async (shipTokenId: number) => {
        const ship = ownedShips.find((s) => s.tokenId === shipTokenId)
        if (!ship || !token) return

        try {
            await axios.post(`${VECH_API}auth/select-ship`, { token, tokenId: shipTokenId })
            setCurrentShip(ship)
        } catch (error) {
            console.error('Failed to set current ship:', error)
        }
    }, [ownedShips, token])

    if (!currentShip) {
        return (
            <ShipSelectModal
                loggedIn={loggedIn}
                token={token}
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
                zIndex: 9000,
            }}>
                <VechMetamask
                    loggedIn={loggedIn}
                    handleSignIn={handleSignIn}
                    handleSignOut={handleSignOut}
                    BASE_URL={BASE_URL}
                />
            </div>
            <Elite
                loggedIn={loggedIn}
                token={token}
                tokenId={currentShip.tokenId}
                handleSignIn={handleSignIn}
                handleSignOut={handleSignOut}
                BASE_URL={BASE_URL}
                currentShip={currentShip}
                onChangeShip={() => setCurrentShip(null)}
            />
        </>
    )
}

export default EliteApp