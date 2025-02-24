import { Web3Provider } from '../../contexts/Web3Context';
import AppView from './AppView';

function App() {
  return (
    <Web3Provider>
      <AppView />
    </Web3Provider>
  );
}

export default App;
