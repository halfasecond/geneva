import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './style/index.css'

function Geneva() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '2rem',
      fontWeight: 'bold'
    }}>
      <p>Hello!</p>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Geneva />
  </StrictMode>,
)