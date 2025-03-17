import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './components/App/App'
import Purr from './components/App/Purr'
import './style/index.css'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App ViewComponent={Purr} />
    </StrictMode>,
)