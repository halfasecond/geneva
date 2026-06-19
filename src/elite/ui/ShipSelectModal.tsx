import React, { useMemo, useState } from 'react'
import VechMetamask from './VechMetamask'
import { COLORS, Z } from '../config'
import {
    HANGAR_DEBUG_COUNTS,
    buildMockHangar,
    isHangarDebugEnabled,
    type HangarDebugCount,
} from './hangarDebug'
import type { VechNft } from '../../types/vech'

interface ShipSelectModalProps {
    loggedIn: string | undefined
    handleSignIn: () => void
    handleSignOut: () => void
    BASE_URL: string
    ownedShips: VechNft[]
    shipsLoading: boolean
    savedShipTokenId?: number
    onSelectShip: (ship: VechNft) => void
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
    const hangarDebug = isHangarDebugEnabled(loggedIn)
    const [debugCount, setDebugCount] = useState<HangarDebugCount | null>(null)

    const displayShips = useMemo(() => {
        if (debugCount !== null) return buildMockHangar(debugCount, ownedShips)
        return ownedShips
    }, [debugCount, ownedShips])

    const effectiveSavedTokenId = debugCount !== null && displayShips.length > 0
        ? displayShips[0].tokenId
        : savedShipTokenId

    const savedShip = effectiveSavedTokenId != null && effectiveSavedTokenId >= 0
        ? displayShips.find((ship) => ship.tokenId === effectiveSavedTokenId)
        : undefined

    const alternateShips = savedShip
        ? displayShips.filter((s) => s.tokenId !== savedShip.tokenId)
        : displayShips

    const shipLabel = (ship: VechNft) =>
        ship.name || `Ship #${ship.shipId ?? ship.tokenId}`

    return (
        <div style={overlay}>
            {hangarDebug && loggedIn && (
                <HangarDebugBar
                    active={debugCount}
                    onSelect={(count) => setDebugCount(count)}
                    onLive={() => setDebugCount(null)}
                    liveCount={ownedShips.length}
                />
            )}

            <div style={panel}>
                {!loggedIn ? (
                    <SignInView />
                ) : shipsLoading && debugCount === null ? (
                    <p style={mutedText}>Scanning hangar…</p>
                ) : displayShips.length === 0 ? (
                    <EmptyHangar />
                ) : savedShip ? (
                    <div style={welcomeBlock}>
                        <p style={greeting}>Welcome back, commander.</p>

                        <div style={heroFrame}>
                            {savedShip.image ? (
                                <img
                                    src={savedShip.image}
                                    alt={shipLabel(savedShip)}
                                    style={heroImage}
                                />
                            ) : (
                                <ShipPlaceholder ship={savedShip} large />
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => onSelectShip(savedShip)}
                            style={primaryButton}
                        >
                            Continue with {shipLabel(savedShip)}
                        </button>

                        {alternateShips.length > 0 && (
                            <>
                                <p style={sectionLabel}>Or choose a different ship</p>
                                <ShipGrid ships={alternateShips} onSelect={onSelectShip} />
                            </>
                        )}
                    </div>
                ) : (
                    <div style={welcomeBlock}>
                        <p style={greeting}>Select your ship</p>
                        <ShipGrid ships={displayShips} onSelect={onSelectShip} />
                    </div>
                )}

                <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
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

const SignInView: React.FC = () => (
    <>
        <img
            src="https://cdn.halfasecond.com/images/vech/vech-logo.png"
            alt="VECH"
            style={{
                width: 280,
                margin: '0 auto 48px',
                display: 'block',
                boxShadow: `0 0 32px ${COLORS.vechRingCss}44`,
            }}
        />
        <p style={{ ...mutedText, textAlign: 'center', maxWidth: 320 }}>
            Sign in with MetaMask to load your hangar.
        </p>
    </>
)

const OPENSEA_VECH = 'https://opensea.io/collection/vechio'

const EmptyHangar: React.FC = () => (
    <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <p style={greeting}>Hangar empty</p>
        <p style={mutedText}>
            This wallet does not own a Vech Founder Edition.
        </p>
        <a
            href={OPENSEA_VECH}
            target="_blank"
            rel="noopener noreferrer"
            style={buyLink}
        >
            Buy one here
        </a>
    </div>
)

const HangarDebugBar: React.FC<{
    active: HangarDebugCount | null
    onSelect: (count: HangarDebugCount) => void
    onLive: () => void
    liveCount: number
}> = ({ active, onSelect, onLive, liveCount }) => (
    <div style={debugBar}>
        <span style={debugLabel}>HANGAR DEBUG</span>
        {HANGAR_DEBUG_COUNTS.map((count) => (
            <button
                key={count}
                type="button"
                onClick={() => onSelect(count)}
                style={{
                    ...debugButton,
                    ...(active === count ? debugButtonActive : {}),
                }}
            >
                {count}
            </button>
        ))}
        <button
            type="button"
            onClick={onLive}
            style={{
                ...debugButton,
                ...(active === null ? debugButtonActive : {}),
            }}
        >
            live ({liveCount})
        </button>
    </div>
)

const ShipPlaceholder: React.FC<{ ship: VechNft; large?: boolean }> = ({ ship, large }) => (
    <div style={{
        width: '100%',
        height: large ? 200 : 88,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(145deg, rgba(20,40,80,0.6) 0%, rgba(4,12,28,0.9) 100%)',
        color: COLORS.vechRingCss,
        fontSize: large ? 13 : 10,
        letterSpacing: 1,
        opacity: 0.85,
    }}>
        {ship.name || `Hull ${ship.shipId ?? ship.tokenId}`}
    </div>
)

const ShipGrid: React.FC<{ ships: VechNft[]; onSelect: (ship: VechNft) => void }> = ({ ships, onSelect }) => (
    <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(128px, 1fr))',
        gap: 10,
        width: 'min(560px, 100%)',
        margin: '0 auto',
    }}>
        {ships.map((ship) => (
            <button
                key={ship.tokenId}
                type="button"
                onClick={() => onSelect(ship)}
                style={shipCard}
            >
                {ship.image ? (
                    <img
                        src={ship.image}
                        alt={ship.name || `Ship ${ship.shipId}`}
                        style={shipThumb}
                    />
                ) : (
                    <ShipPlaceholder ship={ship} />
                )}
                <span style={shipCardLabel}>
                    {ship.name || `Token #${ship.tokenId}`}
                </span>
            </button>
        ))}
    </div>
)

const overlay: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: Z.hangar,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#000',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
}

const panel: React.CSSProperties = {
    width: 'min(720px, 92vw)',
    maxHeight: '92vh',
    overflow: 'auto',
    padding: '32px 28px 40px',
    color: COLORS.vechRingCss,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
}

const welcomeBlock: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
}

const greeting: React.CSSProperties = {
    margin: '0 0 20px',
    fontSize: 13,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    opacity: 0.9,
}

const mutedText: React.CSSProperties = {
    margin: 0,
    fontSize: 12,
    lineHeight: 1.5,
    color: COLORS.textMuted,
    opacity: 0.85,
}

const heroFrame: React.CSSProperties = {
    width: 'min(320px, 78vw)',
    marginBottom: 20,
    padding: 10,
    border: `1px solid rgba(102, 170, 255, 0.35)`,
    borderRadius: 4,
    background: 'rgba(0, 6, 14, 0.55)',
    boxShadow: `0 0 28px rgba(102, 170, 255, 0.12), inset 0 0 24px rgba(102, 170, 255, 0.04)`,
}

const heroImage: React.CSSProperties = {
    width: '100%',
    display: 'block',
    borderRadius: 2,
    objectFit: 'cover',
    aspectRatio: '1',
}

const primaryButton: React.CSSProperties = {
    minWidth: 240,
    padding: '12px 22px',
    border: `1px solid ${COLORS.vechRingCss}`,
    borderRadius: 2,
    background: 'rgba(0, 6, 14, 0.9)',
    color: COLORS.vechRingCss,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    boxShadow: 'inset 0 0 14px rgba(102, 170, 255, 0.1)',
}

const sectionLabel: React.CSSProperties = {
    margin: '28px 0 12px',
    fontSize: 11,
    letterSpacing: 0.5,
    color: COLORS.textMuted,
    opacity: 0.8,
}

const buyLink: React.CSSProperties = {
    display: 'inline-block',
    marginTop: 20,
    fontSize: 11,
    letterSpacing: 0.5,
    color: COLORS.vechRingCss,
    textDecoration: 'none',
    borderBottom: `1px solid rgba(102, 170, 255, 0.45)`,
    paddingBottom: 2,
}

const shipCard: React.CSSProperties = {
    padding: 8,
    border: '1px solid rgba(102, 170, 255, 0.22)',
    borderRadius: 3,
    background: 'rgba(0, 6, 14, 0.65)',
    color: COLORS.vechRingCss,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
    textAlign: 'center',
    transition: 'border-color 0.15s, box-shadow 0.15s',
}

const shipThumb: React.CSSProperties = {
    width: '100%',
    height: 88,
    objectFit: 'cover',
    borderRadius: 2,
    display: 'block',
}

const shipCardLabel: React.CSSProperties = {
    fontSize: 10,
    letterSpacing: 0.5,
    lineHeight: 1.3,
}

const debugBar: React.CSSProperties = {
    position: 'fixed',
    top: 12,
    left: 12,
    zIndex: Z.hangarDebug,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 10px',
    border: '1px solid rgba(102, 170, 255, 0.25)',
    borderRadius: 3,
    background: 'rgba(0, 6, 14, 0.92)',
    fontSize: 10,
    letterSpacing: 0.5,
}

const debugLabel: React.CSSProperties = {
    color: COLORS.textMuted,
    marginRight: 4,
    textTransform: 'uppercase',
}

const debugButton: React.CSSProperties = {
    padding: '4px 8px',
    border: '1px solid rgba(102, 170, 255, 0.2)',
    borderRadius: 2,
    background: 'rgba(4, 12, 28, 0.8)',
    color: COLORS.vechRingCss,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 10,
}

const debugButtonActive: React.CSSProperties = {
    borderColor: COLORS.vechRingCss,
    background: 'rgba(102, 170, 255, 0.18)',
    boxShadow: '0 0 10px rgba(102, 170, 255, 0.15)',
}

export default ShipSelectModal