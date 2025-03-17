import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import App from './components/App'
import './style/index.css'
const Paddock = lazy(() => import('./components/App/ThePaddock'));

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Suspense fallback={<div>Loading...</div>}>
            <App ViewComponent={Paddock} />
        </Suspense>
    </StrictMode>,
)