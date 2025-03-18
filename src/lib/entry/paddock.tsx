import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from 'components/App'
import './style/index.css'
import Paddock from 'components/App/ThePaddock'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App ViewComponent={Paddock} />
    </StrictMode>,
)