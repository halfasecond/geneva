import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from 'components/App'
import './style/index.css'
import Elite from 'components/App/Elite'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App ViewComponent={Elite} />
    </StrictMode>,
)
