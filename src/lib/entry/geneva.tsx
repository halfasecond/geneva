import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from 'components/App'
import './style/index.css'
import Geneva from 'components/App/Geneva'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App ViewComponent={Geneva} />
    </StrictMode>,
)