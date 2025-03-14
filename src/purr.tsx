import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import PurrApp from './components/App/PurrApp'
import './style/index.css'

// Set the app name in the window object for debugging
window.__APP_NAME__ = 'purr';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <PurrApp />
    </StrictMode>,
)