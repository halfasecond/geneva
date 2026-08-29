import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from 'kittyInternational/App'
import 'kittyInternational/style/index.css'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
