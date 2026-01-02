import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from 'components/App'
import './style/index.css'
import Aquarium from 'components/App/Aquarium'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App ViewComponent={Aquarium} />
    </StrictMode>,
)