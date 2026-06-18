import React from 'react'
import VechMetamask from './VechMetamask'
import { COLORS } from '../config'
import type { VechNft } from '../../types/vech'

interface ShipSelectModalProps {
    loggedIn: string | undefined
    token: string | undefined
    handleSignIn: () => void
    handleSignOut: () => void
    BASE_URL: string
    ownedShips: VechNft[]
    shipsLoading: boolean
    savedShipTokenId?: number
    onSelectShip: (tokenId: number) => void
}

const overlay: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    background: 'rgba(0,0,0,1)',
    backdropFilter: 'blur(4px)',
    fontFamily: 'monospace',
}

const panel: React.CSSProperties = {
    width: 'min(720px, 92vw)',
    maxHeight: '88vh',
    overflow: 'auto',
    padding: '28px 32px',
    color: COLORS.vechRingCss,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
}

const ShipSelectModal: React.FC<ShipSelectModalProps> = ({
    loggedIn,
    handleSignIn,
    handleSignOut,
    BASE_URL,
    ownedShips,
    shipsLoading,
    savedShipTokenId,
    onSelectShip,
}) => {
    const savedShip = savedShipTokenId && savedShipTokenId >= 0
        ? ownedShips.find((ship) => ship.tokenId === savedShipTokenId)
        : undefined

    return (
        <div style={overlay}>
            <div style={panel}>
                {!loggedIn ? (
                    <>
                        <img src="https://cdn.halfasecond.com/images/vech/vech-logo.png" alt="VECH Logo" style={{ width: 280, margin: `0 auto 64px`, boxShadow: `0 0 24px ${COLORS.vechRingCss}33`, }} />
                        <p style={{ textAlign: 'center' }}>Sign in with MetaMask to load your hangar.</p>
                    </>
                    
                ) : shipsLoading ? (
                    <p>Scanning hangar…</p>
                ) : ownedShips.length === 0 ? (
                    <div>
                        <h3 style={{ marginBottom: 8 }}>No ships in hangar</h3>
                        <p style={{ opacity: 0.8 }}>
                            This wallet does not own any indexed VECH ships yet.
                        </p>
                    </div>
                ) : savedShip ? (
                    <div style={{ textAlign: 'center' }}>
                        <p>Welcome back, commander.</p>
                        {savedShip.image && (
                            <img
                                src={savedShip.image}
                                alt={savedShip.name || `Ship ${savedShip.shipId}`}
                                style={{ width: 220, margin: '12px auto', display: 'block', borderRadius: 4 }}
                            />
                        )}
                        <button
                            type="button"
                            onClick={() => onSelectShip(savedShip.tokenId)}
                            style={buttonStyle}
                        >
                            Continue with {savedShip.name || `Ship #${savedShip.shipId ?? savedShip.tokenId}`}
                        </button>
                        <p style={{ marginTop: 16, opacity: 0.75 }}>Or choose a different ship:</p>
                        <ShipGrid ships={ownedShips.filter((s) => s.tokenId !== savedShip.tokenId)} onSelect={onSelectShip} />
                    </div>
                ) : (
                    <div>
                        <p>Select your current ship:</p>
                        <ShipGrid ships={ownedShips} onSelect={onSelectShip} />
                    </div>
                )}

                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
                    <VechMetamask
                        loggedIn={loggedIn}
                        handleSignIn={handleSignIn}
                        handleSignOut={handleSignOut}
                        BASE_URL={BASE_URL}
                    />
                </div>
            </div>
        </div>
    )
}

const buttonStyle: React.CSSProperties = {
    marginTop: 12,
    padding: '10px 18px',
    border: `1px solid ${COLORS.vechRingCss}`,
    background: 'rgba(20, 40, 80, 0.5)',
    color: COLORS.vechRingCss,
    cursor: 'pointer',
    fontFamily: 'monospace',
    letterSpacing: 1,
}

const ShipGrid: React.FC<{ ships: VechNft[]; onSelect: (tokenId: number) => void }> = ({ ships, onSelect }) => (
    <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 12,
        marginTop: 12,
    }}>
        {ships.map((ship) => (
            <button
                key={ship.tokenId}
                type="button"
                onClick={() => onSelect(ship.tokenId)}
                style={{
                    ...buttonStyle,
                    marginTop: 0,
                    padding: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                }}
            >
                {ship.image && (
                    <img
                        src={ship.image}
                        alt={ship.name || `Ship ${ship.shipId}`}
                        style={{ width: '100%', height: 72, objectFit: 'cover', borderRadius: 2 }}
                    />
                )}
                <span style={{ fontSize: 11 }}>
                    {ship.name || `Token #${ship.tokenId}`}
                </span>
            </button>
        ))}
    </div>
)

export default ShipSelectModal