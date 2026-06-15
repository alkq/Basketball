import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Play, Pause, Timer, ArrowRightLeft,
  ChevronUp, ChevronDown, Trophy,
  UserCheck, Edit3, Check, RotateCcw,
  Undo2, FileText, List, RefreshCw,
  LayoutDashboard, Move, Monitor, Smartphone
} from 'lucide-react';

// ==========================================
// 1. SUPABASE CLIENT INITIALIZATION (Safe Fallback)
// ==========================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

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
const InlineName: React.FC<{ name: string; onSave: (n: string) => void; className?: string; disabled?: boolean }> = ({ name, onSave, className = '', disabled = false }) => {
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

  if (disabled) {
    return <span className={className}>{name}</span>;
  }

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
      {name}
      <Edit3 size={16} className="hidden sm:inline ml-1 opacity-90 align-middle" />
    </span>
  );
};

// ==========================================
// SMALL INLINE NUMBER EDITOR
// ==========================================
const InlineNumber: React.FC<{ num: number; onSave: (n: number) => void; className?: string; compact?: boolean; disabled?: boolean }> = ({ num, onSave, className = '', compact = false, disabled = false }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(num));
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { setVal(String(num)); }, [num]);
  useEffect(() => { if (editing) ref.current?.select(); }, [editing]);
  const save = () => {
    const v = parseInt(val, 10);
    if (!isNaN(v) && v !== num) onSave(v);
    setEditing(false);
  };

  if (disabled) {
    return <span className={className}>{num}</span>;
  }

  if (!editing && compact) {
    return (
      <span className={`cursor-pointer ${className}`} onClick={(e) => { e.stopPropagation(); setEditing(true); }} title="Click to edit number">
        {num}
      </span>
    );
  }

  return editing ? (
    <div className={`flex items-center gap-1 ${className}`} onClick={e => e.stopPropagation()}>
      <input ref={ref} value={val} onChange={e => setVal(e.target.value)} autoFocus
        onBlur={save} onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
        className="w-14 bg-slate-700 border border-slate-600 rounded px-1 py-0 text-sm text-white focus:outline-none" />
      <button onClick={save}><Check size={12} className="text-emerald-400" /></button>
    </div>
  ) : (
    <span className={`cursor-pointer ${className}`} onClick={(e) => { e.stopPropagation(); setEditing(true); }} title="Click to edit number">
      {num}
      {!compact && <Edit3 size={10} className="hidden sm:inline ml-1 opacity-30" />}
    </span>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export const BasketballBoard: React.FC = () => {
  const [mode, setMode] = useState<'controller' | 'viewer'>('controller'); // Active Sync Role
  const [isSyncEnabled, setIsSyncEnabled] = useState<boolean>(true); // Manual Sync Toggle state [2]
  const [syncStatus, setSyncStatus] = useState<string>('DISCONNECTED'); // Realtime Status Logger
  const initialView = typeof window !== 'undefined' && window.location && window.location.pathname === '/court' ? 'court' : 'scoreboard';
  const [view, setView] = useState<'scoreboard' | 'court'>(initialView); // View switcher state
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

  // UI States (Correctly Declared)
  const [showDebug, setShowDebug] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [showScoresheetMobile, setShowScoresheetMobile] = useState(false);

  // Instant Click Substitution state
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);

  // Drag-drop substitution state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  // Tactical court drag state
  const [courtDragId, setCourtDragId] = useState<string | null>(null);
  const courtRef = useRef<HTMLDivElement>(null);

  const isViewer = mode === 'viewer';

  // ── 2. DERIVED VALUES (Safely placed at the top to resolve TDZ errors) ── [1.2.6]
  const homeScore = homePlayers.reduce((s, p) => s + p.points, 0);
  const awayScore = awayPlayers.reduce((s, p) => s + p.points, 0);
  const homeFouls = homePlayers.filter(p => p.status === 'court').reduce((s, p) => s + p.fouls, 0);
  const awayFouls = awayPlayers.filter(p => p.status === 'court').reduce((s, p) => s + p.fouls, 0);

  // Scoresheet map (Declared before effects use them) [1.2.6]
  const scoresheetMap = useMemo(() => {
    const home: Record<number, { playerNumber: number; playerName: string }> = {};
    const away: Record<number, { playerNumber: number; playerName: string }> = {};
    let homeTotal = 0;
    let awayTotal = 0;
    const events = [...gameEvents].filter(e => e.type === 'score').sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    for (const ev of events) {
      if (!ev.value || ev.value <= 0) continue;
      if (ev.team === 'home') {
        homeTotal += ev.value;
        home[homeTotal] = { playerNumber: ev.playerNumber, playerName: ev.playerName };
      } else {
        awayTotal += ev.value;
        away[awayTotal] = { playerNumber: ev.playerNumber, playerName: ev.playerName };
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

  // Processed events (Declared before JSX rendering use) [1.2.6]
  const processedEvents = useMemo(() => {
    let total = 0;
    return [...gameEvents]
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
      .map(ev => {
        if (ev.type === 'score' && ev.value && ev.value > 0) {
          total += ev.value;
          return { ...ev, cumulativeTotal: total };
        }
        return { ...ev, cumulativeTotal: total };
      });
  }, [gameEvents]);

  // Refs for local popup sync
  const bcRef = useRef<BroadcastChannel | null>(null);
  const syncChannelRef = useRef<any>(null);

  // ── LOCAL BROADCAST CHANNEL (Offline & Popup Window Sync) ── [2]
  useEffect(() => {
    try {
      bcRef.current = new BroadcastChannel('scoreboard');
      const chan = bcRef.current;
      chan.onmessage = (ev) => {
        if (!ev.data) return;
        if (ev.data.type === 'request') {
          chan.postMessage({ 
            type: 'init', 
            state: { homeScore, awayScore, period, gameTime, shotClock, homeFouls, awayFouls, homePlayers, awayPlayers } 
          });
        }
      };
      return () => { chan.close(); bcRef.current = null; };
    } catch (e) {
      bcRef.current = null;
    }
  }, [homeScore, awayScore, period, gameTime, shotClock, homeFouls, awayFouls, homePlayers, awayPlayers]);

  // Publish offline local broadcast updates
  useEffect(() => {
    const payload = { homeScore, awayScore, period, gameTime, shotClock, homeFouls, awayFouls };
    try { bcRef.current?.postMessage({ type: 'update', state: payload }); } catch (e) { /* ignore */ }
  }, [homeScore, awayScore, period, gameTime, shotClock, homeFouls, awayFouls]);

  // ── 3. ESTABLISH A SINGLE STABLE BROADCAST CHANNEL WITH ACTIVE SUBSCRIPTION ── [2]
  useEffect(() => {
    if (!supabase || !isSyncEnabled) {
      setSyncStatus('OFFLINE');
      return;
    }

    setSyncStatus('CONNECTING...');

    // Create a stable channel and subscribe to it permanently
    const channel = supabase.channel('basketball-sync', {
      config: { broadcast: { self: false } }
    });

    channel
      .on('broadcast', { event: 'state-update' }, (response: any) => {
        if (mode === 'viewer') {
          const data = response.payload; // Envelope wrapper is correct for payload structures
          if (!data) return;
          setHomePlayers(data.homePlayers);
          setAwayPlayers(data.awayPlayers);
          setGameTime(data.gameTime);
          setShotClock(data.shotClock);
          setIsRunning(data.isRunning);
          setPeriod(data.period);
          setGameEvents(data.gameEvents);
          setView(data.view);
          setClockMode(data.clockMode);
        }
      })
      .subscribe((status, err) => {
        // Track the connection status
        if (status === 'SUBSCRIBED') {
          setSyncStatus('SUBSCRIBED');
        } else if (status === 'CHANNEL_ERROR') {
          setSyncStatus('ERROR');
          console.error("Supabase Realtime Channel Error:", err);
        } else {
          setSyncStatus(status);
        }
      });

    syncChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      syncChannelRef.current = null;
    };
  }, [mode, isSyncEnabled]);

  // ── 4. BROADCAST STATE CHANGES VIA THE STABLE CHANNEL (Controller Mode Only) ── [2]
  useEffect(() => {
    if (mode !== 'controller' || !syncChannelRef.current || !isSyncEnabled) return;

    // Send update packages through the stable, pre-subscribed channel
    syncChannelRef.current.send({
      type: 'broadcast',
      event: 'state-update',
      payload: {
        homePlayers,
        awayPlayers,
        gameTime,
        shotClock,
        isRunning,
        period,
        gameEvents,
        view,
        clockMode
      }
    });
  }, [homePlayers, awayPlayers, gameTime, shotClock, isRunning, period, gameEvents, view, clockMode, mode, isSyncEnabled]);

  // ── GLOBAL TACTICAL COURT POINTER TRACKING ── [3]
  // Actively tracks finger drag globally to prevent token stuttering on fast movements
  useEffect(() => {
    if (!courtDragId || isViewer) return;

    const handleGlobalPointerMove = (e: PointerEvent) => {
      const rect = courtRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100);
      const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100);

      const upd = (prev: Player[]) => prev.map(p => p.id === courtDragId ? { ...p, x, y } : p);
      setHomePlayers(upd);
      setAwayPlayers(upd);
    };

    const handleGlobalPointerUp = () => {
      setCourtDragId(null);
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [courtDragId, isViewer]);

  // Timer loop
  useEffect(() => {
    if (!isRunning) return;
    const t = setInterval(() => {
      setGameTime(p => {
        if (clockMode === 'countdown') {
          if (p <= 1) { setIsRunning(false); return 0; }
          return p - 1;
        }
        return p + 1;
      });
      setShotClock(p => p <= 1 ? 0 : p - 1);
    }, 1000);
    return () => clearInterval(t);
  }, [isRunning, clockMode]);

  // Substitution execution logic
  const executeSubstitution = useCallback((id1: string, id2: string) => {
    if (id1 === id2 || isViewer) return;
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
  }, [homePlayers, awayPlayers, isViewer]);

  // Point scoring actions
  const addPoints = useCallback((team: 'home' | 'away', courtIndex: number, pts: number) => {
    if (isViewer) return;
    const setter = team === 'home' ? setHomePlayers : setAwayPlayers;
    setter(prev => {
      const court = prev.filter(p => p.status === 'court');
      const target = court[courtIndex];
      if (!target) return prev;
      setGameEvents(prevEvs => {
        const now = Date.now();
        const hs = prevEvs.filter(ev => ev.type === 'score' && ev.team === 'home').reduce((s, e) => s + e.value, 0);
        const as = prevEvs.filter(ev => ev.type === 'score' && ev.team === 'away').reduce((s, e) => s + e.value, 0);
        const newEv = {
          id: uid(), type: 'score' as const, team, playerId: target.id,
          playerNumber: target.number, playerName: target.name,
          value: pts, homeScoreBefore: hs, awayScoreBefore: as, timestamp: now
        };
        const last = prevEvs[prevEvs.length - 1];
        if (last && last.type === 'score' && last.team === team && last.playerId === target.id && last.value === pts && Math.abs((last.timestamp || 0) - now) < 60) {
          return prevEvs;
        }
        return [...prevEvs, newEv];
      });
      return prev.map(p => p.id === target.id ? { ...p, points: Math.max(0, p.points + pts) } : p);
    });
  }, [homePlayers, awayPlayers, isViewer]);

  // Foul assignment actions
  const addFoul = useCallback((team: 'home' | 'away', courtIndex: number, delta: number) => {
    if (isViewer) return;
    const setter = team === 'home' ? setHomePlayers : setAwayPlayers;
    setter(prev => {
      const court = prev.filter(p => p.status === 'court');
      const target = court[courtIndex];
      if (!target) return prev;
      if (delta > 0) {
        setGameEvents(prevEvs => {
          const now = Date.now();
          const hs = prevEvs.filter(ev => ev.type === 'score' && ev.team === 'home').reduce((s, e) => s + e.value, 0);
          const as = prevEvs.filter(ev => ev.type === 'score' && ev.team === 'away').reduce((s, e) => s + e.value, 0);
          const newEv = {
            id: uid(), type: 'foul' as const, team, playerId: target.id,
            playerNumber: target.number, playerName: target.name,
            value: delta, homeScoreBefore: hs, awayScoreBefore: as, timestamp: now
          };
          const last = prevEvs[prevEvs.length - 1];
          if (last && last.type === 'foul' && last.team === team && last.playerId === target.id && last.value === delta && Math.abs((last.timestamp || 0) - now) < 60) {
            return prevEvs;
          }
          return [...prevEvs, newEv];
        });
      }
      return prev.map(p => p.id === target.id ? { ...p, fouls: Math.max(0, p.fouls + delta) } : p);
    });
  }, [homePlayers, awayPlayers, isViewer]);

  const undoLast = useCallback(() => {
    if (isViewer) return;
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
  }, [isViewer]);

  const resetGame = useCallback(() => {
    if (isViewer) return;
    setHomePlayers(createHomePlayers());
    setAwayPlayers(createAwayPlayers());
    setGameTime(600);
    setShotClock(24);
    setIsRunning(false);
    setPeriod(1);
    setGameEvents([]);
    setSelectedCourtId(null);
  }, [isViewer]);

  const renamePlayer = useCallback((team: 'home' | 'away', id: string, name: string) => {
    if (isViewer) return;
    (team === 'home' ? setHomePlayers : setAwayPlayers)(prev =>
      prev.map(p => p.id === id ? { ...p, name } : p)
    );
  }, [isViewer]);

  const changePlayerNumber = useCallback((team: 'home' | 'away', id: string, number: number) => {
    if (isViewer) return;
    (team === 'home' ? setHomePlayers : setAwayPlayers)(prev => prev.map(p => p.id === id ? { ...p, number } : p));
  }, [isViewer]);

  // Instant substitution selection handlers
  const handleSelectCourt = useCallback((id: string) => {
    if (isViewer) return;
    setSelectedCourtId(prev => prev === id ? null : id);
  }, [isViewer]);

  const handleBenchClick = useCallback((benchPlayerId: string) => {
    if (selectedCourtId && !isViewer) {
      executeSubstitution(selectedCourtId, benchPlayerId);
      setSelectedCourtId(null);
    }
  }, [selectedCourtId, executeSubstitution, isViewer]);

  // Drag-drop substitution handlers
  const handleRosterDragStart = useCallback((e: React.DragEvent, playerId: string) => {
    if (isViewer) return;
    e.dataTransfer.effectAllowed = 'move';
    setDraggedId(playerId);
  }, [isViewer]);

  const handleRosterDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDropTargetId(null);
    if (!draggedId || isViewer) return;
    executeSubstitution(draggedId, targetId);
    setDraggedId(null);
  }, [draggedId, executeSubstitution, isViewer]);

  // Tactical court drag trigger
  const handleCourtPointerDown = useCallback((e: React.PointerEvent, id: string) => {
    if (isViewer) return;
    e.preventDefault();
    setCourtDragId(id);
  }, [isViewer]);

  const handleSetTime = useCallback(() => {
    if (isViewer) return;
    const m = parseInt(inputMins, 10);
    if (!isNaN(m) && m >= 0) {
      setGameTime(m * 60);
      setIsRunning(false);
    }
  }, [inputMins, isViewer]);

  const shotUrgent = shotClock <= 5 && shotClock > 0;

  // Opens local display popup via BroadcastChannel [1]
  const openDisplay = useCallback(() => {
    try {
      const features = 'toolbar=0,location=0,menubar=0,resizable=1,scrollbars=0,width=1280,height=720';
      window.open('/display', 'scoreboard_display', features);
      
      // send init state immediately
      setTimeout(() => {
        try {
          bcRef.current?.postMessage({
            type: 'init',
            state: { homeScore, awayScore, period, gameTime, shotClock, homeFouls, awayFouls, homePlayers, awayPlayers }
          });
        } catch (e) {}
      }, 250);
    } catch (e) {
      // ignore
    }
  }, [homeScore, awayScore, period, gameTime, shotClock, homeFouls, awayFouls, homePlayers, awayPlayers]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="max-w-screen-2xl mx-auto p-3 md:p-5 space-y-4">

        {/* ── REALTIME ROLE BAR ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-700/40 shadow-inner">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sync Connection:</span>
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${
              supabase && isSyncEnabled 
                ? (syncStatus === 'SUBSCRIBED' ? 'bg-emerald-500 animate-pulse' : 'bg-yellow-500') 
                : 'bg-red-500'
            }`} />
            <span className="text-xs text-slate-400 font-medium">
              {supabase && isSyncEnabled 
                ? `Connected (${syncStatus})` 
                : !supabase 
                  ? 'Offline Mode (Configure VITE_SUPABASE_URL)' 
                  : 'Sync Connection Closed'}
            </span>
            
            {/* Toggle Sync Button [2] */}
            {supabase && (
              <button
                onClick={() => setIsSyncEnabled(!isSyncEnabled)}
                className={`ml-2 px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all active:scale-95 ${
                  isSyncEnabled 
                    ? 'bg-red-900/40 text-red-300 border border-red-700/30 hover:bg-red-900/60' 
                    : 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/30 hover:bg-emerald-900/60'
                }`}
              >
                {isSyncEnabled ? 'Close Sync' : 'Turn On Sync'}
              </button>
            )}
          </div>
          
          <div className="flex gap-2 bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setMode('controller')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                mode === 'controller' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone size={13} /> Controller (Tablet)
            </button>
            <button
              onClick={() => setMode('viewer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                mode === 'viewer' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor size={13} /> Viewer (TV Screen)
            </button>
          </div>
        </div>

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
            {/* Top Action Bar (Hides in Viewer mode to maintain cleanliness) */}
            {!isViewer && (
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <List size={16} className="text-amber-400" />
                  <span className="text-sm font-bold text-amber-400">Game Log</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Desktop actions (hidden on small screens) */}
                  <div className="hidden sm:flex items-center gap-2">
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
                    <button onClick={openDisplay}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700/90 hover:bg-blue-600 text-white text-xs font-semibold transition-all active:scale-95 shadow-md">
                      <LayoutDashboard size={13} /> Display
                    </button>
                  </div>

                  {/* Mobile actions: single menu button that expands into a vertical list */}
                  <div className="sm:hidden relative">
                    <button onClick={() => setShowMobileActions(s => !s)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-700/90 text-white text-sm font-semibold">
                      Actions
                    </button>
                    {showMobileActions && (
                      <div className="absolute right-0 mt-2 w-44 bg-slate-800 border border-slate-700 rounded shadow-lg z-30 p-2 space-y-2">
                        <button onClick={undoLast} disabled={gameEvents.length === 0}
                          className="w-full text-left px-2 py-1 rounded bg-amber-700/80 text-white text-sm disabled:opacity-40">Undo Last</button>
                        <button onClick={() => window.print()} className="w-full text-left px-2 py-1 rounded bg-violet-700/80 text-white text-sm">Scoresheet PDF</button>
                        <button onClick={() => { setShowEvents(v => !v); setShowMobileActions(false); }} className="w-full text-left px-2 py-1 rounded bg-emerald-700/80 text-white text-sm">Events</button>
                        <button onClick={resetGame} className="w-full text-left px-2 py-1 rounded bg-slate-700/80 text-white text-sm">Reset</button>
                        <button onClick={() => window.open('/court', '_blank')} className="w-full text-left px-2 py-1 rounded bg-emerald-700/80 text-white text-sm">Open Tactical Page</button>
                        <button onClick={() => { openDisplay(); setShowMobileActions(false); }} className="w-full text-left px-2 py-1 rounded bg-blue-700/80 text-white text-sm">Display</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Scoreboard Banner */}
            <div className="relative overflow-hidden rounded-2xl shadow-2xl border border-slate-700/50">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-900/20 via-slate-800 to-blue-900/20 pointer-events-none" />
              <div className="relative grid grid-cols-2 sm:grid-cols-3 gap-2">
                {/* Home Team Display */}
                <div className="flex flex-col items-center justify-center py-3 sm:py-5 border-r border-slate-700/40 bg-gradient-to-b from-orange-950/30 to-transparent">
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
                  <div className="mt-2 flex items-center gap-2 text-sm sm:text-base text-slate-400">
                    <span className="text-sm sm:text-base">Fouls:</span>
                    <span className={`ml-2 text-xl sm:text-2xl md:text-4xl font-extrabold ${homeFouls >= 5 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>{homeFouls}</span>
                  </div>
                </div>

                {/* Clock Controllers */}
                <div className="col-span-2 sm:col-span-1 order-first sm:order-none flex flex-col items-center gap-2 py-3 sm:gap-2.5 sm:py-4 bg-slate-800/50">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest">Period</span>
                    {!isViewer && <button onClick={() => setPeriod(p => Math.max(1, p - 1))} className="p-0.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"><ChevronDown size={13} /></button>}
                    <span className="text-lg font-black text-white tabular-nums min-w-[1.25rem] text-center">{period}</span>
                    {!isViewer && <button onClick={() => setPeriod(p => Math.min(9, p + 1))} className="p-0.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"><ChevronUp size={13} /></button>}
                  </div>

                  <div className="text-center">
                    <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest block mb-0.5">Game Clock</span>
                    <div className={`text-2xl sm:text-3xl md:text-4xl font-mono font-black tabular-nums select-none ${gameTime <= 30 && gameTime > 0 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                      {formatTime(gameTime)}
                    </div>
                    {!isViewer && (
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
                    )}
                  </div>

                  <div className="w-3/4 border-t border-slate-700/50" />

                  <div className="text-center">
                    <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest block mb-0.5">Shot Clock</span>
                    <div className={`text-2xl sm:text-3xl md:text-4xl font-mono font-black tabular-nums select-none ${
                      shotClock === 0 ? 'text-red-500 animate-bounce' : shotUrgent ? 'text-red-400 animate-pulse' : 'text-rose-400'
                    }`}>
                      {shotClock}
                    </div>
                    {!isViewer && (
                      <div className="flex gap-1 mt-1.5 justify-center flex-wrap">
                        <button onClick={() => setShotClock(24)}
                          className="flex items-center gap-1 bg-rose-700/90 hover:bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow transition-all active:scale-95">
                          <RefreshCw size={9} />24s
                        </button>
                        <button onClick={() => setShotClock(14)}
                          className="flex items-center gap-1 bg-amber-700/90 hover:bg-amber-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow transition-all active:scale-95">
                          <RefreshCw size={9} />14s
                        </button>
                      </div>
                    )}
                  </div>

                  {!isViewer && (
                    <button onClick={() => setIsRunning(!isRunning)}
                      className={`w-full max-w-[200px] py-2 rounded-xl font-bold transition-all text-xs shadow-lg active:scale-[0.98] flex items-center justify-center gap-1.5 ${
                        isRunning ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white' : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white'
                      }`}>
                      {isRunning ? <><Pause size={14} />Pause Clock</> : <><Play size={14} />Start Clock</>}
                    </button>
                  )}
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
                  <div className="mt-2 flex items-center gap-2 text-base md:text-lg text-slate-400">
                    <span className="text-base md:text-lg">Fouls:</span>
                    <span className={`ml-2 text-xl sm:text-2xl md:text-4xl font-extrabold ${awayFouls >= 5 ? 'text-red-400 animate-pulse' : 'text-sky-400'}`}>{awayFouls}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Roster Panels (Equipped with Dual Drag + Instant Swap system) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RosterPanel team="home" players={homePlayers}
                onAddPoints={addPoints} onAddFoul={addFoul}
                onRename={renamePlayer}
                onChangeNumber={changePlayerNumber}
                draggedId={draggedId} dropTargetId={dropTargetId}
                onDragStart={handleRosterDragStart} onDrop={handleRosterDrop}
                onDragOver={(e, id) => { e.preventDefault(); setDropTargetId(id); }}
                onDragLeave={() => setDropTargetId(null)}
                selectedCourtId={selectedCourtId} onSelectCourt={handleSelectCourt}
                onBenchClick={handleBenchClick} isViewer={isViewer} />
              <RosterPanel team="away" players={awayPlayers}
                onAddPoints={addPoints} onAddFoul={addFoul}
                onRename={renamePlayer}
                onChangeNumber={changePlayerNumber}
                draggedId={draggedId} dropTargetId={dropTargetId}
                onDragStart={handleRosterDragStart} onDrop={handleRosterDrop}
                onDragOver={(e, id) => { e.preventDefault(); setDropTargetId(id); }}
                onDragLeave={() => setDropTargetId(null)}
                selectedCourtId={selectedCourtId} onSelectCourt={handleSelectCourt}
                onBenchClick={handleBenchClick} isViewer={isViewer} />
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
                <div className="flex items-center justify-center mt-2">
                  <button onClick={() => setShowDebug(d => !d)} className="text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded">{showDebug ? 'Hide' : 'Show'} Debug</button>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Point sequence 1–{maxSheetRows}</div>
                  <button className="sm:hidden text-xs text-amber-300 underline" onClick={() => setShowScoresheetMobile(s => !s)}>{showScoresheetMobile ? 'Hide Scoresheet' : 'Show Scoresheet'}</button>
                </div>
                <div className={`${showScoresheetMobile ? 'block' : 'hidden sm:block'} overflow-x-auto`}>
                  <table className="mx-auto w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        <th className="bg-orange-900/40 text-amber-400 border border-slate-600 px-3 py-1.5 font-bold w-20 text-center">Home</th>
                        <th className="bg-slate-700/60 text-slate-300 border border-slate-600 px-3 py-1.5 font-bold w-14 text-center">Score</th>
                        <th className="bg-blue-900/40 text-sky-400 border border-slate-600 px-3 py-1.5 font-bold w-20 text-center">Away</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: maxSheetRows }, (_, i) => i + 1).map(n => {
                        const homeEntry = scoresheetMap.home[n];
                        const awayEntry = scoresheetMap.away[n];
                        return (
                          <tr key={n} className={n % 2 === 0 ? 'bg-slate-800/30' : ''}>
                            <td className="border border-slate-700/50 px-3 py-0.5 text-center">
                              {homeEntry !== undefined
                                ? <span className="font-black text-amber-400 text-sm">#{homeEntry.playerNumber} <span className="text-sm font-medium">{homeEntry.playerName}</span></span>
                                : <span className="text-slate-700">—</span>}
                            </td>
                            <td className="border border-slate-600 px-3 py-0.5 text-center bg-slate-700/30">
                              <span className="font-bold text-slate-300 tabular-nums">{n}</span>
                            </td>
                            <td className="border border-slate-700/50 px-3 py-0.5 text-center">
                              {awayEntry !== undefined
                                ? <span className="font-black text-sky-400 text-sm">#{awayEntry.playerNumber} <span className="text-sm font-medium">{awayEntry.playerName}</span></span>
                                : <span className="text-slate-700">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Score stats footer */}
                <div className="mt-4 flex flex-col sm:flex-row gap-3 border-t border-slate-700/40 pt-3">
                  <div className="flex-1">
                    <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-widest mb-1.5">Top Scorers — Home</div>
                    <div className="flex flex-col gap-1">
                      {homeScorers.length > 0 ? homeScorers.map((p, i) => (
                          <div key={p.id} className="flex items-center gap-2 text-[12px] bg-orange-950/10 border border-orange-700/20 px-2 py-1 rounded">
                            <span className="w-4 text-xs text-slate-400">{i + 1}.</span>
                            <span className="text-sm text-amber-200 truncate">#{p.number} {p.name}</span>
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
                            <span className="text-sm text-sky-200 truncate">#{p.number} {p.name}</span>
                            <span className="ml-auto font-bold text-sky-300">{p.points} pts</span>
                        </div>
                      )) : <span className="text-[10px] text-slate-600 italic">No scorers yet</span>}
                    </div>
                  </div>
                </div>
                <p className="text-center text-[10px] text-slate-600 italic mt-2">Player numbers appear at the cumulative score when they scored.</p>
              </div>
              
              {/* FIXED STRUCTURAL TAG ERROR: Removed the extra closing </div> on line 593 that closed the scoresheet container prematurely. */}
              {showDebug && (
                <div className="mt-3 p-3 bg-slate-900/70 rounded text-xs overflow-auto max-h-64 hidden sm:block">
                  <div className="text-[11px] font-bold text-slate-300 mb-2">Debug — gameEvents (chronological)</div>
                  <pre className="text-[11px] text-slate-200 whitespace-pre-wrap mb-3">{JSON.stringify(processedEvents, null, 2)}</pre>
                  <div className="text-[11px] font-bold text-slate-300 mb-2">Derived scoresheetMap</div>
                  <pre className="text-[11px] text-slate-200 whitespace-pre-wrap">{JSON.stringify(scoresheetMap, null, 2)}</pre>
                </div>
              )}
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
                          <span className="text-sm text-slate-300">#{ev.playerNumber} {ev.playerName}</span>
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
            <div className="rounded-xl border border-slate-700/30 bg-slate-800/30 p-4 hidden sm:block">
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
                <span className="text-sm md:text-base text-slate-300">(Fouls: <span className="font-bold text-2xl md:text-3xl">{homeFouls}</span>)</span>
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
                <span className="text-sm md:text-base text-slate-300">(Fouls: <span className="font-bold text-2xl md:text-3xl">{awayFouls}</span>)</span>
                <span className="text-3xl font-black text-blue-500">{awayScore}</span>
                <span className="text-sm font-bold text-sky-400 uppercase tracking-wider">Away</span>
              </div>
            </div>

            {/* FULL COURTBOARD DIAGRAM WITH Sideline & Baseline Margins [3] */}
            <div className="rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl bg-slate-800/50 p-4">
              <div className="w-full overflow-auto">{/* allows horizontal scroll on small screens */}
              <div ref={courtRef}
                // Custom out-of-bounds padding allows tokens to drag past the lines [3]
                className="min-w-[560px] md:min-w-0 relative aspect-[28/17] w-full rounded-xl overflow-hidden select-none border-2 border-amber-700/60 shadow-inner cursor-crosshair bg-[#bc5a10] touch-none"
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
                  <div className="absolute top-1/2 right-0 -translate-y-1/2 h-[22%] w-[8%] border-y-l border-white/20" />
                  {/* Left Three-point line arc */}
                  <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[22%] h-[80%] border-r-2 border-white/25 rounded-r-full" />
                  {/* Right Three-point line arc */}
                  <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[22%] h-[80%] border-l-2 border-white/25 rounded-l-full" />
                </div>

                {/* Tactical Tokens for Court Active Players */}
                {[...homePlayers.filter(p => p.status === 'court'), ...awayPlayers.filter(p => p.status === 'court')].map(player => (
                  <div key={player.id}
                    onPointerDown={e => handleCourtPointerDown(e, player.id)}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 touch-none ${isViewer ? '' : 'cursor-grab active:cursor-grabbing'} ${courtDragId === player.id ? 'z-20 scale-110' : ''}`}
                    style={{ left: `${player.x}%`, top: `${player.y}%`, transition: courtDragId === player.id ? 'none' : 'transform 0.1s' }}>
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full border-2 border-white/95 shadow-lg flex items-center justify-center font-black text-white text-xs md:text-sm ${
                      player.team === 'home' ? 'bg-gradient-to-br from-red-500 to-red-700' : 'bg-gradient-to-br from-blue-500 to-blue-700'
                    } ${courtDragId === player.id ? 'ring-2 ring-yellow-400' : ''}`}>
                      {player.number}
                    </div>
                      <span className="text-sm bg-black/85 px-2 py-0.5 rounded text-white mt-0.5 leading-none max-w-[64px] sm:max-w-[80px] truncate">
                      {player.name}
                    </span>
                  </div>
                ))}
              </div>
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
  onChangeNumber: (team: 'home' | 'away', id: string, number: number) => void;
  draggedId: string | null;
  dropTargetId: string | null;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragLeave: () => void;
  selectedCourtId: string | null;
  onSelectCourt: (id: string) => void;
  onBenchClick: (id: string) => void;
  isViewer?: boolean;
}> = ({ 
  team, players, onAddPoints, onAddFoul, onRename, 
  onChangeNumber,
  draggedId, dropTargetId, onDragStart, onDrop, onDragOver, onDragLeave,
  selectedCourtId, onSelectCourt, onBenchClick, isViewer = false
}) => {
  const isHome = team === 'home';
  const borderColor = isHome ? 'border-orange-500/60' : 'border-blue-500/60';
  const headerBg = isHome ? 'bg-orange-500/10' : 'bg-blue-500/10';
  const accentText = isHome ? 'text-amber-400' : 'text-sky-400';
  const accentPts = isHome ? 'text-amber-500' : 'text-sky-400';

  const courtPlayers = players.filter(p => p.status === 'court');
  const benchPlayers = players.filter(p => p.status === 'bench');

  // Per-team sorted scorers (highest -> lowest). Include players who have fouls
  // even if they haven't scored, and sort by points then fouls.
  const teamScorers = [...players]
    .filter(p => p.points > 0 || p.fouls > 0)
    .sort((a, b) => (b.points - a.points) || (b.fouls - a.fouls));

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
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {courtPlayers.map((player, idx) => {
              const isSelected = selectedCourtId === player.id;
              return (
                <div key={player.id}
                  draggable={!isViewer}
                  onContextMenu={e => e.preventDefault()}
                  onDragStart={e => onDragStart(e, player.id)}
                  onDrop={e => onDrop(e, player.id)}
                  onDragOver={e => onDragOver(e, player.id)}
                  onDragLeave={onDragLeave}
                  onClick={() => onSelectCourt(player.id)}
                  className={`relative p-1.5 rounded-xl border-2 flex flex-col items-center bg-slate-800/90 transition-all ${isViewer ? '' : 'cursor-pointer'} ${
                    isDragging(player.id) ? 'opacity-40 scale-95' : ''
                  } ${isDropTarget(player.id) ? 'border-emerald-400 ring-2 ring-emerald-400 scale-105 shadow-emerald-900/30 shadow-lg' : 
                    isSelected ? 'border-yellow-400 ring-2 ring-yellow-400 scale-105 shadow-lg' : 'border-slate-700/60'
                  } ${player.fouls >= 4 ? 'ring-2 ring-red-500/40' : ''}`}>

                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-xs md:text-sm mb-0.5 shadow-md ${
                    isHome ? 'bg-gradient-to-br from-red-500 to-red-700' : 'bg-gradient-to-br from-blue-500 to-blue-700'
                  }`}>
                    <InlineNumber num={player.number} onSave={(v) => onChangeNumber(team, player.id, v)} className="text-sm" compact={true} disabled={isViewer} />
                  </div>
                  <InlineName name={player.name} onSave={n => onRename(team, player.id, n)} disabled={isViewer}
                    className="text-sm text-slate-300 truncate max-w-[64px] sm:max-w-[72px]" />
                  <div className={`text-[10px] font-bold ${accentPts} mt-0.5`}>{player.points}pts</div>
                  <div className={`mt-1 text-sm text-slate-400 flex items-center gap-1`}>
                    <span className="text-xs md:text-sm">Fouls:</span>
                    <span className={`${player.fouls >= 4 ? 'text-red-400' : 'text-slate-300'} font-bold text-sm md:text-base`}>{player.fouls}</span>
                  </div>
                  
                  {/* Score buttons with stopPropagation to avoid toggling select card */}
                  {!isViewer && (
                    <>
                      <div className="flex flex-wrap sm:flex-row gap-2 mt-2 w-full items-stretch justify-center">
                        {[1, 2, 3].map(p => (
                          <button key={p}
                            onClick={(e) => { e.stopPropagation(); onAddPoints(team, idx, p); }}
                            className="bg-slate-700/80 hover:bg-slate-600 text-sm font-bold flex items-center justify-center w-9 h-9 min-w-[36px] px-2 py-1 rounded-md text-white transition-colors active:scale-95">
                            +{p}
                          </button>
                        ))}
                      </div>
                      
                      {/* Foul buttons with stopPropagation */}
                      <div className="flex flex-wrap sm:flex-row gap-2 mt-1 w-full items-stretch justify-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); onAddFoul(team, idx, 1); }}
                          className="bg-red-900/60 hover:bg-red-800 text-sm font-bold flex items-center justify-center w-9 h-9 min-w-[36px] px-2 py-1 rounded-md text-red-300 transition-colors active:scale-95">+F</button>
                        {player.fouls > 0 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onAddFoul(team, idx, -1); }}
                            className="bg-slate-700/50 hover:bg-slate-600 text-sm font-bold flex items-center justify-center w-9 h-9 min-w-[36px] px-2 py-1 rounded-md text-slate-400 transition-colors active:scale-95">-F</button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bench */}
        <div>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block mb-2">Bench</span>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {benchPlayers.map(player => (
              <div key={player.id}
                draggable={!isViewer}
                onContextMenu={e => e.preventDefault()}
                onDragStart={e => onDragStart(e, player.id)}
                onDrop={e => onDrop(e, player.id)}
                onDragOver={e => onDragOver(e, player.id)}
                onDragLeave={onDragLeave}
                onClick={() => onBenchClick(player.id)}
                className={`relative p-1.5 rounded-xl border flex flex-col items-center cursor-grab active:cursor-grabbing transition-all ${
                  isDragging(player.id) ? 'opacity-40 scale-95' : ''
                } ${isDropTarget(player.id) ? 'border-emerald-400 ring-2 ring-emerald-400 bg-emerald-900/20 scale-105' : 'border-slate-700/40 bg-slate-800/20 hover:bg-slate-750 flex flex-col items-center justify-pointer transition-all hover:scale-105'}
                `}>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-white/60 font-bold text-[10px] md:text-xs mb-0.5 ${
                  isHome ? 'bg-red-900/50' : 'bg-blue-900/50'
                }`}>
                  <InlineNumber num={player.number} onSave={(v) => onChangeNumber(team, player.id, v)} className="text-sm" compact={true} disabled={isViewer} />
                </div>
                <InlineName name={player.name} onSave={n => onRename(team, player.id, n)} disabled={isViewer}
                  className="text-sm text-slate-500 truncate max-w-[64px] sm:max-w-[72px]" />
                <div className={`text-sm ${accentPts} opacity-60 mt-0.5`}>{player.points}pts</div>
              </div>
            ))}
          </div>
        </div>
            
            {/* Player stats: quick per-team scorers under roster (restored style yes) */}
            <div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block mb-2">Player Stats</span>
              <div className="flex items-center gap-4 text-xs">
                {teamScorers.length > 0 ? teamScorers.map(p => (
                  <div key={p.id} className={`flex items-center gap-3 px-2 py-1 rounded ${isHome ? 'bg-orange-900/5' : 'bg-blue-900/5'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-white text-xs ${isHome ? 'bg-orange-500' : 'bg-blue-500'}`}>
                      {/* FIXED TYPO: Changed Inlinenum to InlineNumber */}
                      <InlineNumber num={p.number} onSave={() => {}} className="text-xs" compact={true} disabled={isViewer} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-slate-200 truncate max-w-[9rem]">#{p.number} {p.name}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Fouls: <span className={`font-bold ${p.fouls >= 4 ? 'text-red-400' : isHome ? 'text-amber-300' : 'text-sky-300'}`}>{p.fouls}</span></span>
                    </div>
                    <span className={`ml-auto text-[11px] font-bold ${isHome ? 'text-amber-300' : 'text-sky-300'}`}>{p.points} pts</span>
                </div>
                )) : <span className="text-[10px] text-slate-600 italic">No scorers yet</span>}
              </div>
            </div>
      </div>
    </div>
  );
};

export default BasketballBoard;