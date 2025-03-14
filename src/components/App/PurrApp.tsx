import { lazy, Suspense } from 'react';
import { useAuth } from '../../hooks/useAuth';

// Only import the Purr component
const PurrComponent = lazy(() => import('../App/Purr'));

function PurrApp() {
    console.log('heelo')
    const {
        loggedIn,
        token,
        tokenId,
        loading,
        handleSignIn,
        handleSignOut,
        BASE_URL
    } = useAuth({ appName: 'purr' });

    if (loading) {
        return null;
    }

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PurrComponent
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

export default PurrApp;