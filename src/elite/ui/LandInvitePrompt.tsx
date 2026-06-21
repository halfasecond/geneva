import React from 'react'
import ShipRelayPrompt from './ShipRelayPrompt'

interface LandInvitePromptProps {
  bodyName: string
  shipLabel?: string
  hidden?: boolean
}

const LandInvitePrompt: React.FC<LandInvitePromptProps> = ({
  bodyName,
  shipLabel = 'Ship mind',
  hidden = false,
}) => (
  <ShipRelayPrompt
    shipLabel={shipLabel}
    relayTag="surface telemetry"
    message={`Land on ${bodyName}?`}
    action="Press F to land"
    hidden={hidden}
  />
)

export default LandInvitePrompt