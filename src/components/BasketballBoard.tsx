import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Play, Pause, Timer, ArrowRightLeft,
  ChevronUp, ChevronDown, Trophy,
  UserCheck, Edit3, Check, RotateCcw,
  Undo2, FileText, List, RefreshCw,
  LayoutDashboard, Move
} from 'lucide-react';

// ==========================================
// TYPES
// ==========================================
export interface Player {
  id: string;
  name: string;
  number: number;
  points: number;
  fouls: number;
  status: 'court' | 'bench';
  team: 'home' | 'away';
  x: number;
  y: number;
}

interface GameEvent {
  id: string;
  type: 'score' | 'foul';
  team: 'home' | 'away';
  playerId: string;
  playerNumber: number;
  playerName: string;
  value: number;
  homeScoreBefore: number;
  awayScoreBefore: number;
  timestamp: number;
}

// ==========================================
// HELPERS
// ==========================================
const formatTime = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const uid = () => Math.random().toString(36).slice(2);

const createHomePlayers = (): Player[] => [
  { id: 'h1', name: 'Kwong', number: 1, points: 0, fouls: 0, status: 'court', team: 'home', x: 50, y: 30 },
  { id: 'h2', name: 'Hua',   number: 2, points: 0, fouls: 0, status: 'court', team: 'home', x: 25, y: 40 },
  { id: 'h3', name: 'Vis',   number: 3, points: 0, fouls: 0, status: 'court', team: 'home', x: 75, y: 40 },
  { id: 'h4', name: 'Nan',   number: 4, points: 0, fouls: 0, status: 'court', team: 'home', x: 30, y: 22 },
  { id: 'h5', name: 'Shyong',number: 5, points: 0, fouls: 0, status: 'court', team: 'home', x: 70, y: 22 },
  { id: 'h6', name: 'Dexter',number: 6, points: 0, fouls: 0, status: 'bench', team: 'home', x: 3, y: 15 },
  { id: 'h7', name: 'Cheng', number: 7, points: 0, fouls: 0, status: 'bench', team: 'home', x: 3, y: 30 },
  { id: 'h8', name: 'Vin',   number: 8, points: 0, fouls: 0, status: 'bench', team: 'home', x: 3, y: 45 },
  { id: 'h9', name: 'Kelvin',number: 9, points: 0, fouls: 0, status: 'bench', team: 'home', x: 3, y: 60 },
  { id: 'h10',name: 'Kenny', number: 10,points: 0, fouls: 0, status: 'bench', team: 'home', x: 3, y: 75 },
];

const createAwayPlayers = (): Player[] => [
  { id: 'a1', name: 'Fu',      number: 1, points: 0, fouls: 0, status: 'court', team: 'away', x: 50, y: 70 },
  { id: 'a2', name: 'Ci',      number: 2, points: 0, fouls: 0, status: 'court', team: 'away', x: 25, y: 60 },
  { id: 'a3', name: 'Sheng',   number: 3, points: 0, fouls: 0, status: 'court', team: 'away', x: 75, y: 60 },
  { id: 'a4', name: 'Ping',    number: 4, points: 0, fouls: 0, status: 'court', team: 'away', x: 30, y: 78 },
  { id: 'a5', name: 'Ivan',    number: 5, points: 0, fouls: 0, status: 'court', team: 'away', x: 70, y: 78 },
  { id: 'a6', name: 'Qian',    number: 6, points: 0, fouls: 0, status: 'bench', team: 'away', x: 97, y: 15 },
  { id: 'a7', name: 'Ren',     number: 7, points: 0, fouls: 0, status: 'bench', team: 'away', x: 97, y: 30 },
  { id: 'a8', name: 'Player 8',number: 8, points: 0, fouls: 0, status: 'bench', team: 'away', x: 97, y: 45 },
  { id: 'a9', name: 'Player 9',number: 9, points: 0, fouls: 0, status: 'bench', team: 'away', x: 97, y: 60 },
  { id: 'a10',name: 'Player 10',number:10,points: 0, fouls: 0, status: 'bench', team: 'away', x: 97, y: 75 },
];

// ==========================================
// INLINE NAME EDITOR
// ==========================================
const InlineName: React.FC<{ name: string; onSave: (n: string) => void; className?: string }> = ({ name, onSave, className = '' }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(name);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { setVal(name); }, [name]);
  useEffect(() => { if (editing) ref.current?.select(); }, [editing]);

  const save = () => {
    const t = val.trim();
    if (t && t !== name) onSave(t);
    setEditing(false);
  };

  return editing ? (
    <div className={`flex items-center gap-0.5 ${className}`} onClick={(e) => e.stopPropagation()}>
      <input ref={ref} value={val} onChange={e => setVal(e.target.value)} autoFocus
        onBlur={save} onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setVal(name); setEditing(false); } }}
        className="w-14 bg-slate-700 border border-amber-500 rounded px-1 py-0 text-[10px] text-white focus:outline-none" />
      <button onClick={save}><Check size={9} className="text-emerald-400" /></button>
    </div>
  ) : (
    <span className={`cursor-pointer group-hover:underline decoration-dotted decoration-slate-500 ${className}`} 
      onClick={(e) => { e.stopPropagation(); setEditing(true); }} title="Click to edit">
      {name}<Edit3 size={7} className="inline ml-0.5 opacity-30" />
    </span>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export const BasketballBoard: React.FC = () => {
  const initialView = typeof window !== 'undefined' && window.location && window.location.pathname === '/court' ? 'court' : 'scoreboard';
  const [view, setView] = useState<'scoreboard' | 'court'>(initialView); // View switcher state [1]
  const [homePlayers, setHomePlayers] = useState<Player[]>(createHomePlayers);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>(createAwayPlayers);
  const [gameTime, setGameTime] = useState(600);
  const [shotClock, setShotClock] = useState(24);
  const [isRunning, setIsRunning] = useState(false);
  const [inputMins, setInputMins] = useState('10');
  const [clockMode, setClockMode] = useState<'countdown' | 'stopwatch'>('countdown');
  const [period, setPeriod] = useState(1);
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([]);
  const [showEvents, setShowEvents] = useState(false);

  // Instant Click Substitution state
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);

  // Drag-drop substitution state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  // Tactical court drag state
  const [courtDragId, setCourtDragId] = useState<string | null>(null);
  const courtRef = useRef<HTMLDivElement>(null);

  // Timer loop
  useEffect(() => {
    if (!isRunning) return;
    const t = setInterval(() => {
      setGameTime(p => {
        if (clockMode === 'countdown') {
          if (p <= 1) { setIsRunning(false); return 0; }
          return p - 1;
        }
        // stopwatch (count up)
        return p + 1;
      });
      setShotClock(p => p <= 1 ? 0 : p - 1);
    }, 1000);
    return () => clearInterval(t);
  }, [isRunning, clockMode]);

  // Derived values
  const homeScore = homePlayers.reduce((s, p) => s + p.points, 0);
  const awayScore = awayPlayers.reduce((s, p) => s + p.points, 0);
  const homeFouls = homePlayers.filter(p => p.status === 'court').reduce((s, p) => s + p.fouls, 0);
  const awayFouls = awayPlayers.filter(p => p.status === 'court').reduce((s, p) => s + p.fouls, 0);

  // Scoresheet map
  const scoresheetMap = useMemo(() => {
    const home: Record<number, number> = {};
    const away: Record<number, number> = {};
    let hs = 0, as = 0;
    for (const ev of gameEvents) {
      if (ev.type !== 'score') continue;
      if (ev.team === 'home') {
        for (let i = hs + 1; i <= hs + ev.value; i++) home[i] = ev.playerNumber;
        hs += ev.value;
      } else {
        for (let i = as + 1; i <= as + ev.value; i++) away[i] = ev.playerNumber;
        as += ev.value;
      }
    }
    return { home, away };
  }, [gameEvents]);

  const maxSheetRows = Math.max(homeScore, awayScore, 20);

  // Sorted scorers lists (highest -> lowest), only players with points > 0
  const homeScorers = useMemo(() =>
    [...homePlayers].filter(p => p.points > 0).sort((a, b) => b.points - a.points),
    [homePlayers]
  );
  const awayScorers = useMemo(() =>
    [...awayPlayers].filter(p => p.points > 0).sort((a, b) => b.points - a.points),
    [awayPlayers]
  );

  // Substitution execution logic
  const executeSubstitution = useCallback((id1: string, id2: string) => {
    if (id1 === id2) return;
    const allPlayers = [...homePlayers, ...awayPlayers];
    const p1 = allPlayers.find(p => p.id === id1);
    const p2 = allPlayers.find(p => p.id === id2);

    if (!p1 || !p2 || p1.team !== p2.team) return;
    if (p1.status === p2.status) return;

    const setter = p1.team === 'home' ? setHomePlayers : setAwayPlayers;
    setter(prev => prev.map(p => {
      if (p.id === p1.id) return { ...p, status: p2.status };
      if (p.id === p2.id) return { ...p, status: p1.status };
      return p;
    }));
  }, [homePlayers, awayPlayers]);

  // Point scoring actions
  const addPoints = useCallback((team: 'home' | 'away', courtIndex: number, pts: number) => {
    const setter = team === 'home' ? setHomePlayers : setAwayPlayers;
    setter(prev => {
      const court = prev.filter(p => p.status === 'court');
      const target = court[courtIndex];
      if (!target) return prev;
      const hs = homePlayers.reduce((s, p) => s + p.points, 0);
      const as = awayPlayers.reduce((s, p) => s + p.points, 0);
      setGameEvents(evs => [...evs, {
        id: uid(), type: 'score', team, playerId: target.id,
        playerNumber: target.number, playerName: target.name,
        value: pts, homeScoreBefore: hs, awayScoreBefore: as, timestamp: Date.now()
      }]);
      return prev.map(p => p.id === target.id ? { ...p, points: Math.max(0, p.points + pts) } : p);
    });
  }, [homePlayers, awayPlayers]);

  // Foul assignment actions
  const addFoul = useCallback((team: 'home' | 'away', courtIndex: number, delta: number) => {
    const setter = team === 'home' ? setHomePlayers : setAwayPlayers;
    setter(prev => {
      const court = prev.filter(p => p.status === 'court');
      const target = court[courtIndex];
      if (!target) return prev;
      if (delta > 0) {
        const hs = homePlayers.reduce((s, p) => s + p.points, 0);
        const as = awayPlayers.reduce((s, p) => s + p.points, 0);
        setGameEvents(evs => [...evs, {
          id: uid(), type: 'foul', team, playerId: target.id,
          playerNumber: target.number, playerName: target.name,
          value: delta, homeScoreBefore: hs, awayScoreBefore: as, timestamp: Date.now()
        }]);
      }
      return prev.map(p => p.id === target.id ? { ...p, fouls: Math.max(0, p.fouls + delta) } : p);
    });
  }, [homePlayers, awayPlayers]);

  const undoLast = useCallback(() => {
    setGameEvents(prev => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      const setter = last.team === 'home' ? setHomePlayers : setAwayPlayers;
      setter(players => players.map(p =>
        p.id === last.playerId
          ? { ...p, [last.type === 'score' ? 'points' : 'fouls']: Math.max(0, (last.type === 'score' ? p.points : p.fouls) - last.value) }
          : p
      ));
      return prev.slice(0, -1);
    });
  }, []);

  const resetGame = useCallback(() => {
    setHomePlayers(createHomePlayers());
    setAwayPlayers(createAwayPlayers());
    setGameTime(600);
    setShotClock(24);
    setIsRunning(false);
    setPeriod(1);
    setGameEvents([]);
    setSelectedCourtId(null);
  }, []);

  const renamePlayer = useCallback((team: 'home' | 'away', id: string, name: string) => {
    (team === 'home' ? setHomePlayers : setAwayPlayers)(prev =>
      prev.map(p => p.id === id ? { ...p, name } : p)
    );
  }, []);

  // Instant substitution selection handlers
  const handleSelectCourt = useCallback((id: string) => {
    setSelectedCourtId(prev => prev === id ? null : id);
  }, []);

  const handleBenchClick = useCallback((benchPlayerId: string) => {
    if (selectedCourtId) {
      executeSubstitution(selectedCourtId, benchPlayerId);
      setSelectedCourtId(null);
    }
  }, [selectedCourtId, executeSubstitution]);

  // Drag-drop substitution handlers
  const handleRosterDragStart = useCallback((e: React.DragEvent, playerId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedId(playerId);
  }, []);

  const handleRosterDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDropTargetId(null);
    if (!draggedId) return;
    executeSubstitution(draggedId, targetId);
    setDraggedId(null);
  }, [draggedId, executeSubstitution]);

  // Tactical court drag (Clamps updated to 0-100% to allow fully dropping off-court bounds) [3]
  const handleCourtPointerDown = useCallback((e: React.PointerEvent, id: string) => {
    e.preventDefault();
    setCourtDragId(id);
  }, []);

  const handleCourtPointerMove = useCallback((e: React.PointerEvent) => {
    if (!courtDragId) return;
    const rect = courtRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100);
    const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100);
    const upd = (prev: Player[]) => prev.map(p => p.id === courtDragId ? { ...p, x, y } : p);
    setHomePlayers(upd);
    setAwayPlayers(upd);
  }, [courtDragId]);

  const handleCourtPointerUp = useCallback(() => setCourtDragId(null), []);

  const handleSetTime = useCallback(() => {
    const m = parseInt(inputMins, 10);
    if (!isNaN(m) && m >= 0) {
      setGameTime(m * 60);
      setIsRunning(false);
    }
  }, [inputMins]);

  const shotUrgent = shotClock <= 5 && shotClock > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto p-3 md:p-5 space-y-4">

        {/* ── CENTRAL APP NAVIGATION TABS ── */}
        <div className="flex border-b border-slate-700/50 bg-slate-800/40 p-1 rounded-xl">
          <button
            onClick={() => setView('scoreboard')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              view === 'scoreboard' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 shadow-md scale-[1.01]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard size={16} /> Scoreboard & Rosters
          </button>
          <button
            onClick={() => setView('court')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              view === 'court' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-900 shadow-md scale-[1.01]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Move size={16} /> Full Tactical Court
          </button>
        </div>

        {/* ==========================================
            VIEW 1: SCOREBOARD & ROSTERS
           ========================================== */}
        {view === 'scoreboard' && (
          <div className="space-y-4">
            {/* Top Action Bar */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <List size={16} className="text-amber-400" />
                <span className="text-sm font-bold text-amber-400">Game Log</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={undoLast} disabled={gameEvents.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-700/90 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all active:scale-95 shadow-md">
                  <Undo2 size={13} /> Undo Last
                </button>
                <button onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-700/90 hover:bg-violet-600 text-white text-xs font-semibold transition-all active:scale-95 shadow-md">
                  <FileText size={13} /> Scoresheet PDF
                </button>
                <button onClick={() => setShowEvents(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700/90 hover:bg-emerald-600 text-white text-xs font-semibold transition-all active:scale-95 shadow-md">
                  <List size={13} /> Events
                </button>
                <button onClick={resetGame}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition-all active:scale-95 shadow-md">
                  <RotateCcw size={13} /> Reset
                </button>
                <button onClick={() => window.open('/court', '_blank')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700/90 hover:bg-emerald-600 text-white text-xs font-semibold transition-all active:scale-95 shadow-md">
                  <Move size={13} /> Open Tactical Page
                </button>
              </div>
            </div>

            {/* Scoreboard Banner */}
            <div className="relative overflow-hidden rounded-2xl shadow-2xl border border-slate-700/50">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-900/20 via-slate-800 to-blue-900/20 pointer-events-none" />
              <div className="relative grid grid-cols-3 gap-0">
                {/* Home Team Display */}
                <div className="flex flex-col items-center justify-center py-5 md:py-7 border-r border-slate-700/40 bg-gradient-to-b from-orange-950/30 to-transparent">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Trophy size={16} className="text-amber-500/80" />
                    <h2 className="text-amber-400 text-base md:text-lg font-bold tracking-wider uppercase">Home</h2>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full opacity-50" />
                    <div className="relative bg-gradient-to-br from-orange-500 to-orange-700 text-white text-6xl md:text-8xl lg:text-9xl font-black py-4 px-8 md:px-12 rounded-2xl shadow-2xl select-none leading-none tabular-nums">
                      {homeScore}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                    <span>Fouls:</span>
                    <span className={`font-bold ${homeFouls >= 5 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>{homeFouls}</span>
                  </div>
                </div>

                {/* Clock Controllers */}
                <div className="flex flex-col items-center gap-2.5 py-4 md:py-5 bg-slate-800/50">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest">Period</span>
                    <button onClick={() => setPeriod(p => Math.max(1, p - 1))} className="p-0.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"><ChevronDown size={13} /></button>
                    <span className="text-lg font-black text-white tabular-nums min-w-[1.25rem] text-center">{period}</span>
                    <button onClick={() => setPeriod(p => Math.min(9, p + 1))} className="p-0.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"><ChevronUp size={13} /></button>
                  </div>

                  <div className="text-center">
                    <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest block mb-0.5">Game Clock</span>
                    <div className={`text-3xl md:text-4xl font-mono font-black tabular-nums select-none ${gameTime <= 30 && gameTime > 0 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                      {formatTime(gameTime)}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 justify-center">
                      <input type="number" min="0" max="999" value={inputMins} onChange={e => setInputMins(e.target.value)}
                        className="w-12 text-center bg-slate-700/80 border border-slate-600 rounded text-white text-xs py-0.5 focus:outline-none focus:border-amber-500" />
                      <button onClick={handleSetTime} className="bg-slate-600 hover:bg-slate-500 text-white text-[10px] px-2 py-0.5 rounded transition-colors flex items-center gap-1">
                        <Timer size={10} />Set
                      </button>
                      <div className="ml-2 inline-flex rounded overflow-hidden border border-slate-700/50">
                        <button onClick={() => setClockMode('countdown')}
                          className={`px-2 text-[10px] py-0.5 ${clockMode === 'countdown' ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                          Countdown
                        </button>
                        <button onClick={() => setClockMode('stopwatch')}
                          className={`px-2 text-[10px] py-0.5 ${clockMode === 'stopwatch' ? 'bg-emerald-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                          Stopwatch
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="w-3/4 border-t border-slate-700/50" />

                  <div className="text-center">
                    <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest block mb-0.5">Shot Clock</span>
                    <div className={`text-3xl md:text-4xl font-mono font-black tabular-nums select-none ${
                      shotClock === 0 ? 'text-red-500 animate-bounce' : shotUrgent ? 'text-red-400 animate-pulse' : 'text-rose-400'
                    }`}>
                      {shotClock}
                    </div>
                    <div className="flex gap-1.5 mt-1.5 justify-center">
                      <button onClick={() => setShotClock(24)}
                        className="flex items-center gap-1 bg-rose-700/90 hover:bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow transition-all active:scale-95">
                        <RefreshCw size={9} />24s
                      </button>
                      <button onClick={() => setShotClock(14)}
                        className="flex items-center gap-1 bg-amber-700/90 hover:bg-amber-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow transition-all active:scale-95">
                        <RefreshCw size={9} />14s
                      </button>
                    </div>
                  </div>

                  <button onClick={() => setIsRunning(!isRunning)}
                    className={`w-full max-w-[200px] py-2 rounded-xl font-bold transition-all text-xs shadow-lg active:scale-[0.98] flex items-center justify-center gap-1.5 ${
                      isRunning ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white' : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white'
                    }`}>
                    {isRunning ? <><Pause size={14} />Pause Clock</> : <><Play size={14} />Start Clock</>}
                  </button>
                </div>

                {/* Away Team Display */}
                <div className="flex flex-col items-center justify-center py-5 md:py-7 border-l border-slate-700/40 bg-gradient-to-b from-blue-950/30 to-transparent">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Trophy size={16} className="text-sky-500/80" />
                    <h2 className="text-sky-400 text-base md:text-lg font-bold tracking-wider uppercase">Away</h2>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-sky-500/20 blur-2xl rounded-full opacity-50" />
                    <div className="relative bg-gradient-to-br from-blue-500 to-blue-700 text-white text-6xl md:text-8xl lg:text-9xl font-black py-4 px-8 md:px-12 rounded-2xl shadow-2xl select-none leading-none tabular-nums">
                      {awayScore}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                    <span>Fouls:</span>
                    <span className={`font-bold ${awayFouls >= 5 ? 'text-red-400 animate-pulse' : 'text-sky-400'}`}>{awayFouls}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Roster Panels (Equipped with Dual Drag + Instant Swap system) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RosterPanel team="home" players={homePlayers}
                onAddPoints={addPoints} onAddFoul={addFoul}
                onRename={renamePlayer}
                draggedId={draggedId} dropTargetId={dropTargetId}
                onDragStart={handleRosterDragStart} onDrop={handleRosterDrop}
                onDragOver={(e, id) => { e.preventDefault(); setDropTargetId(id); }}
                onDragLeave={() => setDropTargetId(null)}
                selectedCourtId={selectedCourtId} onSelectCourt={handleSelectCourt}
                onBenchClick={handleBenchClick} />
              <RosterPanel team="away" players={awayPlayers}
                onAddPoints={addPoints} onAddFoul={addFoul}
                onRename={renamePlayer}
                draggedId={draggedId} dropTargetId={dropTargetId}
                onDragStart={handleRosterDragStart} onDrop={handleRosterDrop}
                onDragOver={(e, id) => { e.preventDefault(); setDropTargetId(id); }}
                onDragLeave={() => setDropTargetId(null)}
                selectedCourtId={selectedCourtId} onSelectCourt={handleSelectCourt}
                onBenchClick={handleBenchClick} />
            </div>

            {/* Scoresheet Table */}
            <div className="rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl bg-slate-800/50">
              <div className="px-5 py-3 bg-slate-800/80 border-b border-slate-700/40">
                <h3 className="text-sm font-bold text-center text-slate-200 tracking-widest uppercase">Basketball Scoresheet</h3>
                <p className="text-center text-[10px] text-slate-500 mt-0.5">{new Date().toLocaleDateString()}</p>
                <div className="flex items-center justify-center gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Home</span>
                    <span className="text-2xl font-black text-orange-400 tabular-nums">{homeScore}</span>
                  </div>
                  <span className="text-slate-600 font-bold text-sm">VS</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-sky-400 tabular-nums">{awayScore}</span>
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Away</span>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="text-[10px] text-slate-500 mb-2 text-center">Point sequence 1–{maxSheetRows}</div>
                <div className="overflow-x-auto">
                  <table className="mx-auto w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left px-3 py-2 text-slate-400">Point</th>
                        <th className="text-center px-3 py-2 text-amber-300">Home</th>
                        <th className="text-center px-3 py-2 text-sky-300">Away</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: maxSheetRows }, (_, i) => i + 1).map(n => (
                        <tr key={n} className={n % 2 === 0 ? 'bg-slate-800/30' : ''}>
                          <td className="px-3 py-1 text-slate-300">{n}</td>
                          <td className="px-3 py-1 text-center">
                            {scoresheetMap.home[n] !== undefined
                              ? <span className="font-bold text-amber-400">{scoresheetMap.home[n]}</span>
                              : <span className="text-slate-600">—</span>}
                          </td>
                          <td className="px-3 py-1 text-center">
                            {scoresheetMap.away[n] !== undefined
                              ? <span className="font-bold text-sky-300">{scoresheetMap.away[n]}</span>
                              : <span className="text-slate-600">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Score stats footer (unchanged) */}
                <div className="mt-4 flex flex-col sm:flex-row gap-3 border-t border-slate-700/40 pt-3">
                  <div className="flex-1">
                    <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-widest mb-1.5">Top Scorers — Home</div>
                    <div className="flex flex-col gap-1">
                      {homeScorers.length > 0 ? homeScorers.map((p, i) => (
                        <div key={p.id} className="flex items-center gap-2 text-[12px] bg-orange-900/10 border border-orange-700/20 px-2 py-1 rounded">
                          <span className="w-4 text-xs text-slate-400">{i + 1}.</span>
                          <span className="text-[11px] text-amber-200 truncate">#{p.number} {p.name}</span>
                          <span className="ml-auto font-bold text-amber-300">{p.points} pts</span>
                        </div>
                      )) : <span className="text-[10px] text-slate-600 italic">No scorers yet</span>}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-semibold text-sky-400 uppercase tracking-widest mb-1.5">Top Scorers — Away</div>
                    <div className="flex flex-col gap-1">
                      {awayScorers.length > 0 ? awayScorers.map((p, i) => (
                        <div key={p.id} className="flex items-center gap-2 text-[12px] bg-blue-900/10 border border-blue-700/20 px-2 py-1 rounded">
                          <span className="w-4 text-xs text-slate-400">{i + 1}.</span>
                          <span className="text-[11px] text-sky-200 truncate">#{p.number} {p.name}</span>
                          <span className="ml-auto font-bold text-sky-300">{p.points} pts</span>
                        </div>
                      )) : <span className="text-[10px] text-slate-600 italic">No scorers yet</span>}
                    </div>
                  </div>
                </div>
                <p className="text-center text-[10px] text-slate-600 italic mt-2">Player numbers appear at the cumulative score when they scored.</p>
              </div>
            </div>

            {/* Events Log (Optional toggle) */}
            {showEvents && (
              <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 shadow-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-slate-300">Recent Events</span>
                  <span className="text-[10px] text-slate-500">(newest first)</span>
                </div>
                {gameEvents.length === 0
                  ? <p className="text-[11px] text-slate-500 italic text-center py-4">No events yet. Select a player to record points or fouls.</p>
                  : <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                      {[...gameEvents].reverse().map(ev => (
                        <div key={ev.id} className="flex items-center gap-3 text-[11px] py-1 border-b border-slate-700/30">
                          <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${ev.team === 'home' ? 'bg-orange-900/40 text-amber-400' : 'bg-blue-900/40 text-sky-400'}`}>
                            {ev.team === 'home' ? 'HOME' : 'AWAY'}
                          </span>
                          <span className="text-slate-300">#{ev.playerNumber} {ev.playerName}</span>
                          <span className={ev.type === 'score' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                            {ev.type === 'score' ? `+${ev.value} pts` : `+${ev.value} foul`}
                          </span>
                          <span className="text-slate-600 ml-auto">{ev.homeScoreBefore + (ev.team === 'home' && ev.type === 'score' ? ev.value : 0)} – {ev.awayScoreBefore + (ev.team === 'away' && ev.type === 'score' ? ev.value : 0)}</span>
                        </div>
                      ))}
                    </div>
                }
              </div>
            )}

            {/* Quick Guide */}
            <div className="rounded-xl border border-slate-700/30 bg-slate-800/30 p-4">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Quick Guide</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  ['1', 'amber', 'Click +1/+2/+3 to add points to an active player'],
                  ['2', 'emerald', 'Click or drag active players to benched slots to swap them'],
                  ['3', 'sky', 'Navigate to the Tactical Court tab to reposition tokens'],
                  ['4', 'rose', 'Press "Undo Last" to revert the most recent score event'],
                ].map(([n, color, text]) => (
                  <div key={n} className="flex items-start gap-2">
                    <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white bg-${color}-600`}>{n}</div>
                    <p className="text-[10px] text-slate-400 leading-tight">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            VIEW 2: FULL TACTICAL COURT (NEW SEPARATE VIEW) [1]
           ========================================== */}
        {view === 'court' && (
          <div className="space-y-4">
            
            {/* COMPACT FLOATING SCOREBAR ON TOP OF TACTICAL COURT [1] */}
            <div className="grid grid-cols-3 gap-2 items-center bg-slate-800/80 border border-slate-700/50 rounded-xl p-3 shadow-lg select-none">
              {/* Home Team Mini Score */}
              <div className="flex items-center gap-3 justify-start pl-4">
                <span className="text-sm font-bold text-amber-400 uppercase tracking-wider">Home</span>
                <span className="text-3xl font-black text-orange-500">{homeScore}</span>
                <span className="text-xs text-slate-400">(Fouls: {homeFouls})</span>
              </div>
              
              {/* Game Timers */}
              <div className="text-center flex flex-col items-center">
                <div className="text-2xl font-mono font-black text-emerald-400 leading-none mb-1">
                  {formatTime(gameTime)}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-500">Period: <b className="text-slate-300 font-bold">{period}</b></span>
                  <span className="text-slate-500">|</span>
                  <span className={`font-mono font-bold ${shotUrgent ? 'text-red-400' : 'text-slate-300'}`}>Shot Clock: {shotClock}s</span>
                </div>
              </div>

              {/* Away Team Mini Score */}
              <div className="flex items-center gap-3 justify-end pr-4">
                <span className="text-xs text-slate-400">(Fouls: {awayFouls})</span>
                <span className="text-3xl font-black text-blue-500">{awayScore}</span>
                <span className="text-sm font-bold text-sky-400 uppercase tracking-wider">Away</span>
              </div>
            </div>

            {/* FULL COURTBOARD DIAGRAM WITH Sideline & Baseline Margins [3] */}
            <div className="rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl bg-slate-800/50 p-4">
              <div ref={courtRef}
                onPointerMove={handleCourtPointerMove}
                onPointerUp={handleCourtPointerUp}
                onPointerLeave={handleCourtPointerUp}
                // Custom out-of-bounds padding allows tokens to drag past the lines [3]
                className="relative aspect-[28/17] w-full rounded-xl overflow-hidden select-none border-2 border-amber-700/60 shadow-inner cursor-crosshair bg-[#bc5a10]"
              >
                {/* Court Inset Boundary Lines (Outer box is inset by 8% to create off-court space) [3] */}
                <div className="absolute inset-x-[8%] inset-y-[8%] border-2 border-white/50 pointer-events-none">
                  {/* Top & Bottom baselines (visible edges) */}
                  <div className="absolute left-0 right-0 h-px bg-white/60 top-0" />
                  <div className="absolute left-0 right-0 h-px bg-white/60 bottom-0" />
                  {/* Half-court center dividing line */}
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-white/40" />
                  {/* Center circle */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[16%] aspect-square border-2 border-white/40 rounded-full" />
                  {/* Left Paint key and free throw area */}
                  <div className="absolute top-1/2 left-0 -translate-y-1/2 h-[38%] w-[16%] border-y-2 border-r-2 border-white/40" />
                  <div className="absolute top-1/2 left-0 -translate-y-1/2 h-[22%] w-[8%] border-y border-r border-white/20" />
                  {/* Right Paint key and free throw area */}
                  <div className="absolute top-1/2 right-0 -translate-y-1/2 h-[38%] w-[16%] border-y-2 border-l-2 border-white/40" />
                  <div className="absolute top-1/2 right-0 -translate-y-1/2 h-[22%] w-[8%] border-y border-l border-white/20" />
                  {/* Left Three-point line arc */}
                  <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[22%] h-[80%] border-r-2 border-white/25 rounded-r-full" />
                  {/* Right Three-point line arc */}
                  <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[22%] h-[80%] border-l-2 border-white/25 rounded-l-full" />
                </div>

                {/* Tactical Tokens for Court Active Players */}
                {[...homePlayers.filter(p => p.status === 'court'), ...awayPlayers.filter(p => p.status === 'court')].map(player => (
                  <div key={player.id}
                    onPointerDown={e => handleCourtPointerDown(e, player.id)}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 cursor-grab active:cursor-grabbing ${courtDragId === player.id ? 'z-20 scale-110' : ''}`}
                    style={{ left: `${player.x}%`, top: `${player.y}%`, transition: courtDragId === player.id ? 'none' : 'transform 0.1s' }}>
                    <div className={`w-8.5 h-9 rounded-full border-2 border-white/95 shadow-lg flex items-center justify-center font-black text-white text-xs ${
                      player.team === 'home' ? 'bg-gradient-to-br from-red-500 to-red-700' : 'bg-gradient-to-br from-blue-500 to-blue-700'
                    } ${courtDragId === player.id ? 'ring-2 ring-yellow-400' : ''}`}>
                      {player.number}
                    </div>
                    <span className="text-[9px] bg-black/85 px-1.5 py-0.5 rounded text-white mt-0.5 leading-none max-w-[64px] truncate">
                      {player.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <p className="text-center text-xs text-slate-500 italic">💡 The court lines are inset. You can drag and position player tokens completely outside of the white boundary lines.</p>
          </div>
        )}

      </div>
    </div>
  );
};

// ==========================================
// ROSTER PANEL (DRAG & INSTANT CLICK TO SWAP)
// ==========================================
const RosterPanel: React.FC<{
  team: 'home' | 'away';
  players: Player[];
  onAddPoints: (team: 'home' | 'away', index: number, pts: number) => void;
  onAddFoul: (team: 'home' | 'away', index: number, delta: number) => void;
  onRename: (team: 'home' | 'away', id: string, name: string) => void;
  draggedId: string | null;
  dropTargetId: string | null;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragLeave: () => void;
  selectedCourtId: string | null;
  onSelectCourt: (id: string) => void;
  onBenchClick: (id: string) => void;
}> = ({ 
  team, players, onAddPoints, onAddFoul, onRename, 
  draggedId, dropTargetId, onDragStart, onDrop, onDragOver, onDragLeave,
  selectedCourtId, onSelectCourt, onBenchClick 
}) => {
  const isHome = team === 'home';
  const borderColor = isHome ? 'border-orange-500/60' : 'border-blue-500/60';
  const headerBg = isHome ? 'bg-orange-500/10' : 'bg-blue-500/10';
  const accentText = isHome ? 'text-amber-400' : 'text-sky-400';
  const accentPts = isHome ? 'text-amber-500' : 'text-sky-400';

  const courtPlayers = players.filter(p => p.status === 'court');
  const benchPlayers = players.filter(p => p.status === 'bench');

  const isDropTarget = (id: string) => dropTargetId === id && draggedId !== null && draggedId !== id;
  const isDragging = (id: string) => draggedId === id;

  return (
    <div className={`rounded-2xl border-2 ${borderColor} bg-slate-800/30 shadow-xl overflow-hidden`}>
      <div className={`${headerBg} px-4 py-2.5 border-b ${borderColor} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <UserCheck size={15} className={accentText} />
          <h3 className={`text-base font-bold ${accentText}`}>{isHome ? 'Home' : 'Away'} Roster</h3>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <span>Court: {courtPlayers.length}</span>
          <span className="text-slate-700">|</span>
          <span>Bench: {benchPlayers.length}</span>
          <span className="text-slate-700">|</span>
          <span className="text-[10px] text-slate-500 flex items-center gap-0.5"><ArrowRightLeft size={9} />Click or drag to sub</span>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Court */}
        <div>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block mb-2">On Court</span>
          <div className="grid grid-cols-5 gap-1.5">
            {courtPlayers.map((player, idx) => {
              const isSelected = selectedCourtId === player.id;
              return (
                <div key={player.id}
                  draggable
                  onDragStart={e => onDragStart(e, player.id)}
                  onDrop={e => onDrop(e, player.id)}
                  onDragOver={e => onDragOver(e, player.id)}
                  onDragLeave={onDragLeave}
                  onClick={() => onSelectCourt(player.id)}
                  className={`relative p-1.5 rounded-xl border-2 flex flex-col items-center bg-slate-800/90 transition-all cursor-pointer ${
                    isDragging(player.id) ? 'opacity-40 scale-95' : ''
                  } ${isDropTarget(player.id) ? 'border-emerald-400 ring-2 ring-emerald-400 scale-105 shadow-emerald-900/30 shadow-lg' : 
                    isSelected ? 'border-yellow-400 ring-2 ring-yellow-400 scale-105 shadow-lg' : 'border-slate-700/60'
                  } ${player.fouls >= 4 ? 'ring-2 ring-red-500/40' : ''}`}>

                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-xs mb-0.5 shadow-md ${
                    isHome ? 'bg-gradient-to-br from-red-500 to-red-700' : 'bg-gradient-to-br from-blue-500 to-blue-700'
                  }`}>
                    {player.number}
                  </div>
                  <InlineName name={player.name} onSave={n => onRename(team, player.id, n)}
                    className="text-[9px] text-slate-300 truncate max-w-[56px] leading-tight group" />
                  <div className={`text-[10px] font-bold ${accentPts} mt-0.5`}>{player.points}pts</div>
                  <div className={`text-[9px] font-semibold ${player.fouls >= 4 ? 'text-red-400' : 'text-slate-600'}`}>{player.fouls}f</div>
                  
                  {/* Score buttons with stopPropagation to avoid toggling select card */}
                  <div className="flex gap-0.5 mt-1">
                    {[1, 2, 3].map(p => (
                      <button key={p} 
                        onClick={(e) => { e.stopPropagation(); onAddPoints(team, idx, p); }}
                        className="bg-slate-700/80 hover:bg-slate-600 text-[8px] font-bold px-1 py-0.5 rounded text-white transition-colors active:scale-95">+{p}</button>
                    ))}
                  </div>
                  
                  {/* Foul buttons with stopPropagation */}
                  <div className="flex gap-0.5 mt-0.5">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onAddFoul(team, idx, 1); }} 
                      className="bg-red-900/60 hover:bg-red-800 text-[8px] font-bold px-1 py-0.5 rounded text-red-300 transition-colors active:scale-95">+F</button>
                    {player.fouls > 0 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onAddFoul(team, idx, -1); }} 
                        className="bg-slate-700/50 hover:bg-slate-600 text-[8px] font-bold px-1 py-0.5 rounded text-slate-400 transition-colors active:scale-95">-F</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bench */}
        <div>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block mb-2">Bench</span>
          <div className="grid grid-cols-5 gap-1.5">
            {benchPlayers.map(player => (
              <div key={player.id}
                draggable
                onDragStart={e => onDragStart(e, player.id)}
                onDrop={e => onDrop(e, player.id)}
                onDragOver={e => onDragOver(e, player.id)}
                onDragLeave={onDragLeave}
                onClick={() => onBenchClick(player.id)}
                className={`relative p-1.5 rounded-xl border flex flex-col items-center cursor-grab active:cursor-grabbing transition-all ${
                  isDragging(player.id) ? 'opacity-40 scale-95' : ''
                } ${isDropTarget(player.id) ? 'border-emerald-400 ring-2 ring-emerald-400 bg-emerald-900/20 scale-105' : 'border-slate-700/40 bg-slate-800/20 hover:bg-slate-700/40'
                }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white/60 font-bold text-[9px] mb-0.5 ${
                  isHome ? 'bg-red-900/50' : 'bg-blue-900/50'
                }`}>
                  {player.number}
                </div>
                <InlineName name={player.name} onSave={n => onRename(team, player.id, n)}
                  className="text-[9px] text-slate-500 truncate max-w-[52px]" />
                <div className={`text-[9px] ${accentPts} opacity-60 mt-0.5`}>{player.points}pts</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasketballBoard;