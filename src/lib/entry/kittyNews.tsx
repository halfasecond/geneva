import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from 'kittyNews/App'
import 'kittyNews/style/index.css'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
