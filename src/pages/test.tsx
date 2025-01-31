import React from 'react'
import { Paddock } from '../components/Paddock'

const TestPage: React.FC = () => {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Paddock playerId="test-user-1" />
    </div>
  )
}

export default TestPage
