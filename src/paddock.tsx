import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import PaddockApp from './components/App/PaddockApp'
import './style/index.css'

// Set the app name in the window object for debugging
window.__APP_NAME__ = 'chained-horse';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <PaddockApp />
    </StrictMode>,
)