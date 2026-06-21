import React from 'react'
import ShipRelayPrompt from './ShipRelayPrompt'

interface DockInvitePromptProps {
  stationName: string
  shipLabel?: string
  hidden?: boolean
}

const DockInvitePrompt: React.FC<DockInvitePromptProps> = ({
  stationName,
  shipLabel = 'Ship mind',
  hidden = false,
}) => (
  <ShipRelayPrompt
    shipLabel={shipLabel}
    message={`${stationName} is inviting you to dock`}
    action="Press F to accept"
    hidden={hidden}
  />
)

export default DockInvitePrompt