import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './components/App/App'
import PaddockApp from './components/App/ThePaddock'
import './style/index.css'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App ViewComponent={PaddockApp} />
    </StrictMode>,
)