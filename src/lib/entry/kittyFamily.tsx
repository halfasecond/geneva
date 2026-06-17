import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from 'components/App'
import KittyFamily from 'components/App/KittyFamily'
import 'style/index.css'
import 'style/kittyFamily.css'
import 'components/KittyFamily/style/eyeColors.css'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App ViewComponent={KittyFamily} />
    </StrictMode>,
)