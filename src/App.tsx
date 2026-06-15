import BasketballBoard from './components/BasketballBoard';
import DisplayBoard from './components/DisplayBoard.tsx';

function App() {
  if (typeof window !== 'undefined' && window.location && window.location.pathname === '/display') {
    return <DisplayBoard />;
  }
  return <BasketballBoard />;
}

export default App;
