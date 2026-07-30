import React, { useState, useEffect } from 'react';
import BasketballBoard from './components/BasketballBoard';
import DisplayBoard from './components/DisplayBoard.tsx';

class BoardErrorBoundary extends React.Component<{children: React.ReactNode}, {error: Error | null, info: any}> {
  state = { error: null as Error | null, info: null as any };
  componentDidCatch(error: Error, info: any) { this.setState({ error, info }); }
  render() {
    if (this.state.error) return (
      <div className="p-4 bg-red-900/20 border border-red-700 text-red-200 text-sm rounded">
        <div className="font-bold mb-2">⚠ Board Error</div>
        <div>{this.state.error.message}</div>
        <pre className="mt-2 text-xs opacity-80 whitespace-pre-wrap">{this.state.info?.componentStack}</pre>
      </div>
    );
    return this.props.children;
  }
}

function App() {
  const [err, setErr] = useState<Error|null>(null);
  useEffect(() => {
    const onErr = (e: any) => {
      if (e && e.message && /BB|Pool|onClear|onSwap|Users|ReferenceError|SyntaxError/i.test(e.message||'')) setErr(e);
    };
    window.addEventListener('error', (ev) => onErr(ev.error));
    window.addEventListener('unhandledrejection', (ev) => onErr(ev.reason));
    return () => {
      window.removeEventListener('error', (ev) => onErr(ev.error));
      window.removeEventListener('unhandledrejection', (ev) => onErr(ev.reason));
    };
  }, []);
  if (err) return <div className="p-4 bg-red-900/20 border border-red-700 text-red-200 text-sm rounded"><div className="font-bold mb-2">App threw</div><div>{err.message}</div><pre className="mt-2 text-xs opacity-80 whitespace-pre-wrap">{err.stack}</pre></div>;
  if (typeof window !== 'undefined' && window.location && window.location.pathname === '/display') {
    return <DisplayBoard />;
  }
  return <BasketballBoard />;
}

export default App;
