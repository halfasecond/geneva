import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from 'components/App'
import './style/index.css'
import KittyInternational from 'components/App/KittyInternational'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App ViewComponent={KittyInternational} />
    </StrictMode>,
)