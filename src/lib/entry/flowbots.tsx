import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from 'components/App'
import './style/index.css'
import Flowbots from 'components/App/Flowbots.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App ViewComponent={Flowbots} />
    </StrictMode>,
)