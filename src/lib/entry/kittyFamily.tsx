import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from 'kittyFamily/App'
import 'kittyFamily/style/index.css'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
