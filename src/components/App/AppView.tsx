import { useState, useEffect, lazy, Suspense } from 'react'
import { AuthProps } from '../../types/auth'

// Use lazy loading with specific chunk names to better control code splitting
const PurrComponent = lazy(() => import(/* webpackChunkName: "purr" */ './Purr'));
const ThePaddockComponent = lazy(() => import(/* webpackChunkName: "paddock" */ './ThePaddock'));

const AppView: React.FC<AuthProps> = ({
    handleSignIn,
    handleSignOut,
    loggedIn,
    token,
    tokenId,
    BASE_URL,
    app
}) => {
    // Render the appropriate component based on the app name
    const renderApp = () => {
        switch (app) {
            case 'purr':
                return <PurrComponent {...{ handleSignIn, handleSignOut, loggedIn, token, tokenId, BASE_URL }} />;
            case 'chained-horse':
                return <ThePaddockComponent {...{ handleSignIn, handleSignOut, loggedIn, token, tokenId, BASE_URL }} />;
            default:
                return <div>Unknown app: {app}</div>;
        }
    };

    return (
        <Suspense fallback={<div>Loading...</div>}>
            {renderApp()}
        </Suspense>
    );
}

export default AppView
