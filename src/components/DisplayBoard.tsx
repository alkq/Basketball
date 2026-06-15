import React, { useEffect, useState } from 'react';

type DisplayState = {
  homeScore: number;
  awayScore: number;
  period: number;
  gameTime: number;
  shotClock: number;
  homeFouls: number;
  awayFouls: number;
};

const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

const DisplayBoard: React.FC = () => {
  const [state, setState] = useState<DisplayState>({ homeScore: 0, awayScore: 0, period: 1, gameTime: 600, shotClock: 24, homeFouls: 0, awayFouls: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const channel = new BroadcastChannel('scoreboard');
    channel.onmessage = (ev) => {
      if (!ev.data) return;
      if (ev.data.type === 'update' || ev.data.type === 'init') {
        setState(prev => ({ ...prev, ...ev.data.state }));
      }
    };
    // Ask for initial state when the display connects
    channel.postMessage({ type: 'request' });
    return () => channel.close();
  }, []);

  // Also try Socket.IO LAN connection if available
  useEffect(() => {
    (async () => {
      try {
        // @ts-ignore
        const { io } = await import('socket.io-client');
        const socketUrl = (import.meta as any).env?.VITE_SOCKET_URL || `http://${window.location.hostname || 'localhost'}:3000`;
        const socket = io(socketUrl);
        socket.on('connect', () => {
          // request last state by listening to 'state' event
        });
        socket.on('state', (s: any) => {
          if (!s) return;
          setState(prev => ({
            ...prev,
            homeScore: s.homeScore ?? prev.homeScore,
            awayScore: s.awayScore ?? prev.awayScore,
            period: s.period ?? prev.period,
            gameTime: s.gameTime ?? prev.gameTime,
            shotClock: s.shotClock ?? prev.shotClock,
            homeFouls: s.homeFouls ?? prev.homeFouls,
            awayFouls: s.awayFouls ?? prev.awayFouls,
          }));
        });
        return () => socket.disconnect();
      } catch (e) {
        // ignore if socket.io-client unavailable
      }
    })();
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    window.addEventListener('fullscreenchange', onFsChange);
    return () => window.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const goFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid grid-cols-3 gap-6 items-center">
        <div className="flex flex-col items-center justify-center">
          <div className="text-amber-400 uppercase text-xl font-bold mb-3">Home</div>
          <div className="bg-gradient-to-br from-orange-600 to-orange-800 text-white text-8xl md:text-9xl font-black py-6 px-8 rounded-xl shadow-lg tabular-nums">{state.homeScore}</div>
          <div className="mt-4 text-2xl text-amber-300">Fouls: <span className="font-bold">{state.homeFouls}</span></div>
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className="text-slate-400 uppercase text-sm">Period</div>
          <div className="text-6xl md:text-7xl font-black text-white my-2">{state.period}</div>
          <div className="text-slate-400 uppercase text-sm">Game Clock</div>
          <div className="text-5xl md:text-6xl font-mono font-black text-emerald-400 my-2">{formatTime(state.gameTime)}</div>
          <div className="text-slate-400 uppercase text-sm mt-2">Shot Clock</div>
          <div className="text-4xl md:text-5xl font-mono font-black text-rose-400 mt-1">{state.shotClock}</div>
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className="text-sky-400 uppercase text-xl font-bold mb-3">Away</div>
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white text-8xl md:text-9xl font-black py-6 px-8 rounded-xl shadow-lg tabular-nums">{state.awayScore}</div>
          <div className="mt-4 text-2xl text-sky-300">Fouls: <span className="font-bold">{state.awayFouls}</span></div>
        </div>
      </div>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
        {!isFullscreen && (
          <button onClick={goFullscreen} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-full font-bold shadow-lg">Go Fullscreen</button>
        )}
      </div>
    </div>
  );
};

export default DisplayBoard;
