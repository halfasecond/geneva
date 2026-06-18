import { useAuth } from './hooks/useAuth';
const { VITE_APP } = import.meta.env;

interface AppProps {
    ViewComponent: React.ComponentType<any>;
    /** API route prefix for auth endpoints (defaults to VITE_APP) */
    authAppName?: string;
}

function App({ ViewComponent, authAppName }: AppProps) {
    const data = useAuth({ appName: authAppName ?? VITE_APP });

    if (data.loading) {
        return null;
    }

    if (!ViewComponent) {
        return (
            <div style={{
                fontFamily: 'monospace',
                padding: '2rem',
                color: '#ff4444',
                background: '#1a0000',
                minHeight: '100vh'
            }}>
                <h1>App configuration error</h1>
                <p>
                    No ViewComponent was provided to &lt;App /&gt;.
                </p>
                <p>
                    You are probably running the dev server without the switch script.<br />
                    Use one of:
                </p>
                <pre style={{background:'#000', padding:'0.5rem'}}>
                    yarn dev:elite<br />
                    ./switch-app.sh elite dev<br />
                    yarn dev   (and choose Elite)
                </pre>
                <p>
                    Or pass the concrete view: &lt;App ViewComponent={'{Elite}'} /&gt;
                </p>
            </div>
        );
    }

    return  <ViewComponent {...data} />
}

export default App;