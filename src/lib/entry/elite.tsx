import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from 'components/App'
import './style/index.css'
import EliteApp from 'components/App/EliteApp'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App ViewComponent={EliteApp} authAppName="vech" />
    </StrictMode>,
)
