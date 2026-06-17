import { StrictMode, lazy, Suspense  } from 'react'
import { createRoot } from 'react-dom/client'
import App from './components/App'
const Purr = lazy(() => import('./components/App/Purr'));
import './style/index.css'
import './style/purr.css'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Suspense fallback={<div>Loading...</div>}>
            <App ViewComponent={Purr} />
        </Suspense>
    </StrictMode>,
)