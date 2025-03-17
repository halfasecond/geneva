import { useAuth } from './hooks/useAuth';
const { VITE_APP } = import.meta.env;

interface AppProps {
    ViewComponent: React.ComponentType<any>;
}

function App({ ViewComponent }: AppProps) {
    const data = useAuth({ appName: VITE_APP });

    if (data.loading) {
        return null;
    }

    return  <ViewComponent {...data} />
}

export default App;