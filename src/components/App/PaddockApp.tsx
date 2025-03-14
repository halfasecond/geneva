import { lazy, Suspense } from 'react';
import { useAuth } from '../../hooks/useAuth';

// Only import the ThePaddock component
const ThePaddockComponent = lazy(() => import('../App/ThePaddock'));

function PaddockApp() {
    const {
        loggedIn,
        token,
        tokenId,
        loading,
        handleSignIn,
        handleSignOut,
        BASE_URL
    } = useAuth({ appName: 'chained-horse' });

    if (loading) {
        return null;
    }

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ThePaddockComponent
                handleSignIn={handleSignIn}
                handleSignOut={handleSignOut}
                loggedIn={loggedIn}
                token={token}
                tokenId={tokenId}
                BASE_URL={BASE_URL}
            />
        </Suspense>
    );
}

export default PaddockApp;