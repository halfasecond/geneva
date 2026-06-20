import React from 'react'
import { COLORS, Z } from '../config'
import type { GameLoadingState } from '../../types/gameLoading'

interface GameLoadingScreenProps {
  state: GameLoadingState
  shipName?: string
}

const GameLoadingScreen: React.FC<GameLoadingScreenProps> = ({ state, shipName }) => (
  <div style={{
    position: 'fixed',
    inset: 0,
    zIndex: Z.hangar,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#000408',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    color: COLORS.vechRingCss,
    gap: 28,
  }}>
    <img
      src="https://cdn.halfasecond.com/images/vech/vech-logo.png"
      alt="VECH"
      style={{
        width: 200,
        opacity: 0.85,
      }}
    />

    {shipName && (
      <div style={{
        fontSize: 11,
        letterSpacing: 1.6,
        textTransform: 'uppercase',
        opacity: 0.75,
      }}>
        {shipName}
      </div>
    )}

    <div style={{ width: 'min(360px, 78vw)' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 10,
        letterSpacing: 1,
        marginBottom: 8,
        opacity: 0.8,
      }}>
        <span>{state.message}</span>
        <span>{Math.round(state.progress)}%</span>
      </div>
      <div style={{
        height: 4,
        borderRadius: 2,
        background: 'rgba(102, 170, 255, 0.12)',
        overflow: 'hidden',
        border: `1px solid rgba(102, 170, 255, 0.2)`,
      }}>
        <div style={{
          height: '100%',
          width: `${state.progress}%`,
          background: `linear-gradient(90deg, ${COLORS.vechRingCss}88, ${COLORS.vechRingCss})`,
          boxShadow: `0 0 12px ${COLORS.vechRingCss}66`,
          transition: 'width 80ms linear',
        }} />
      </div>
    </div>
  </div>
)

export default GameLoadingScreen