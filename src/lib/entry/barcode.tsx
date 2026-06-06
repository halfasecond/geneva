import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from 'components/App'
import './style/index.css'
import Barcode from 'components/App/Barcode.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App ViewComponent={Barcode} />
    </StrictMode>,
)