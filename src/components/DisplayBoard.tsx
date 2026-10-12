import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// ==========================================
// 1. SUPABASE CLIENT INITIALIZATION (Safe Fallback)
// ==========================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

type DisplayState = {
  homeScore: number;
  awayScore: number;
  period: number;
  gameTime: number;
  shotClock: number;
  homeFouls: number;
  awayFouls: number;
  homeName: string;
  awayName: string;
};

const formatTime = (s: number) => 
  `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

const DisplayBoard: React.FC = () => {
  const [state, setState] = useState<DisplayState>({ 
    homeScore: 0, 
    awayScore: 0, 
    period: 1, 
    gameTime: 600, 
    shotClock: 24, 
    homeFouls: 0, 
    awayFouls: 0,
    homeName: 'HOME',
    awayName: 'AWAY'
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── REALTIME STATE RECEIVER (Listens to Tablet Controller over Internet) ── [2]
  useEffect(() => {
    const applyState = (s: any) => {
      if (!s) return;

      // Calculate home/away scores and fouls dynamically from the synced player data
      const hs = s.homePlayers ? s.homePlayers.reduce((sum: number, p: any) => sum + p.points, 0) : (s.homeScore ?? 0);
      const as = s.awayPlayers ? s.awayPlayers.reduce((sum: number, p: any) => sum + p.points, 0) : (s.awayScore ?? 0);
      const hFouls = s.homePlayers ? s.homePlayers.filter((p: any) => p.status === 'court').reduce((sum: number, p: any) => sum + p.fouls, 0) : (s.homeFouls ?? 0);
      const aFouls = s.awayPlayers ? s.awayPlayers.filter((p: any) => p.status === 'court').reduce((sum: number, p: any) => sum + p.fouls, 0) : (s.awayFouls ?? 0);

      setState((prev) => ({
        homeScore: hs,
        awayScore: as,
        period: s.period ?? prev.period,
        gameTime: s.gameTime ?? prev.gameTime,
        shotClock: s.shotClock ?? prev.shotClock,
        homeFouls: hFouls,
        awayFouls: aFouls,
        homeName: typeof s.homeName === 'string' && s.homeName.trim() ? s.homeName : prev.homeName,
        awayName: typeof s.awayName === 'string' && s.awayName.trim() ? s.awayName : prev.awayName,
      }));
    };

    // Local BroadcastChannel (same-browser / tablet controller without Supabase)
    let chan: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        chan = new BroadcastChannel('basketball-display');
        chan.onmessage = (ev: MessageEvent) => {
          const d: any = ev.data;
          if (!d) return;
          if (d.type === 'init' || d.type === 'update' || d.type === 'state') applyState(d.state);
        };
        chan.postMessage({ type: 'request' });
        // Also pick up persisted roster names immediately (offline open)
        try {
          const raw = localStorage.getItem('basketball-roster-state');
          if (raw) {
            const data = JSON.parse(raw);
            applyState({ homeName: data.homeName, awayName: data.awayName });
          }
        } catch { /* ignore */ }
      }
    } catch { chan = null; }

    if (!supabase) return () => { try { chan?.close(); } catch { /* ignore */ } };

    const channel = supabase.channel('basketball-sync', {
      config: { broadcast: { self: false } }
    });

    channel
      .on('broadcast', { event: 'state-update' }, (response: any) => {
        applyState(response.payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      try { chan?.close(); } catch { /* ignore */ }
    };
  }, []);

  // Fullscreen event listener
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
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-6 md:p-12 select-none overflow-hidden">
      
      {/* Sync Status bar (mini & clean at the top) */}
      <div className="absolute top-4 flex items-center gap-2 text-slate-600 text-[10px] tracking-wider uppercase">
        <span className={`w-1.5 h-1.5 rounded-full ${supabase ? 'bg-emerald-500/60' : 'bg-red-500/60'}`} />
        <span>{supabase ? 'Vercel Realtime Active' : 'Offline Mode'}</span>
      </div>

      <div className="w-full max-w-[95vw] h-[85vh] grid grid-cols-3 gap-8 md:gap-12 lg:gap-16 items-center">
        
        {/* HOME TEAM COLUMN */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="text-orange-400 uppercase text-2xl md:text-4xl lg:text-5xl font-black tracking-widest text-center">
            {state.homeName}
          </div>
          <div className="relative">
            {/* LED Ambient Glow */}
            <div className="absolute inset-0 bg-orange-600/10 blur-3xl rounded-full scale-110" />
            <div className="relative bg-gradient-to-br from-orange-600 to-orange-800 text-white text-9xl sm:text-[13rem] md:text-[17rem] lg:text-[20rem] xl:text-[24rem] font-black py-4 px-8 md:px-12 rounded-2xl shadow-2xl select-none leading-none tracking-tighter tabular-nums border border-orange-500/20 drop-shadow-[0_0_30px_rgba(249,115,22,0.3)]">
              {state.homeScore}
            </div>
          </div>
          {/* Stacked and Enlarged Fouls Indicator [3] */}
          <div className="flex flex-col items-center justify-center gap-1.5 pt-4">
            <span className="text-slate-500 text-xs sm:text-sm md:text-xl font-bold uppercase tracking-widest">Fouls</span>
            <span className="text-red-500 font-black text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl drop-shadow-[0_0_15px_rgba(239,68,68,0.4)] leading-none select-none">
              {state.homeFouls}
            </span>
          </div>
        </div>

        {/* CLOCK & PERIOD CENTRAL COLUMN */}
        <div className="flex flex-col items-center justify-center space-y-8 md:space-y-12">
          
          {/* Period */}
          <div className="flex flex-col items-center justify-center">
            <span className="text-slate-500 text-xs md:text-lg font-bold uppercase tracking-widest">Period</span>
            <div className="text-6xl md:text-8xl lg:text-[8rem] font-black text-white leading-none mt-1 select-none">
              {state.period}
            </div>
          </div>

          <div className="w-full border-t border-slate-800/80 my-2" />

          {/* Game Clock */}
          <div className="text-center">
            <span className="text-slate-500 text-xs md:text-lg font-bold uppercase tracking-widest block mb-1">Game Clock</span>
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/5 blur-xl rounded-full scale-105" />
              <div className="relative text-5xl sm:text-6xl md:text-8xl lg:text-[9rem] font-mono font-black text-emerald-400 select-none leading-none tracking-tight drop-shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                {formatTime(state.gameTime)}
              </div>
            </div>
          </div>

          <div className="w-full border-t border-slate-800/80 my-2" />

          {/* Shot Clock */}
          <div className="text-center">
            <span className="text-slate-500 text-xs md:text-lg font-bold uppercase tracking-widest block mb-1">Shot Clock</span>
            <div className="relative">
              <div className="absolute inset-0 bg-rose-500/5 blur-xl rounded-full scale-105" />
              <div className={`relative text-4xl sm:text-5xl md:text-7xl lg:text-[8rem] font-mono font-black select-none leading-none drop-shadow-[0_0_20px_rgba(244,63,94,0.3)] ${
                state.shotClock <= 5 ? 'text-red-500 animate-pulse' : 'text-rose-400'
              }`}>
                {state.shotClock}
              </div>
            </div>
          </div>
        </div>

        {/* AWAY TEAM COLUMN */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="text-sky-400 uppercase text-2xl md:text-4xl lg:text-5xl font-black tracking-widest text-center">
            {state.awayName}
          </div>
          <div className="relative">
            {/* LED Ambient Glow */}
            <div className="absolute inset-0 bg-blue-600/10 blur-3xl rounded-full scale-110" />
            <div className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white text-9xl sm:text-[13rem] md:text-[17rem] lg:text-[20rem] xl:text-[24rem] font-black py-4 px-8 md:px-12 rounded-2xl shadow-2xl select-none leading-none tracking-tighter tabular-nums border border-blue-500/20 drop-shadow-[0_0_30px_rgba(37,99,235,0.3)]">
              {state.awayScore}
            </div>
          </div>
          {/* Stacked and Enlarged Fouls Indicator [3] */}
          <div className="flex flex-col items-center justify-center gap-1.5 pt-4">
            <span className="text-slate-500 text-xs sm:text-sm md:text-xl font-bold uppercase tracking-widest">Fouls</span>
            <span className="text-red-500 font-black text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl drop-shadow-[0_0_15px_rgba(239,68,68,0.4)] leading-none select-none">
              {state.awayFouls}
            </span>
          </div>
        </div>

      </div>

      {/* Floating Fullscreen Activator */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
        {!isFullscreen && (
          <button 
            onClick={goFullscreen} 
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-full font-bold shadow-2xl hover:scale-105 active:scale-95 transition-all text-sm tracking-wider uppercase"
          >
            Go Fullscreen
          </button>
        )}
      </div>
    </div>
  );
};

export default DisplayBoard;