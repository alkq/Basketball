import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Play, Pause, Timer, ArrowRightLeft,
  ChevronUp, ChevronDown, Trophy,
  UserCheck, Edit3, Check, RotateCcw,
  Undo2, FileText, List, RefreshCw,
  LayoutDashboard, Move, Monitor, Smartphone,
  Info, Pencil, Eraser, Trash2, Users
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
  status: 'court' | 'bench' | 'pool';
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
// HELPERS & MAPPERS
// ==========================================
const formatTime = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const uid = () => Math.random().toString(36).slice(2);

const createHomePlayers = (): Player[] => [
  { id: 'h1', name: 'Kwong', number: 1, points: 0, fouls: 0, status: 'court', team: 'home', x: 35, y: 45 },
  { id: 'h2', name: 'Hua',   number: 2, points: 0, fouls: 0, status: 'court', team: 'home', x: 42, y: 22 },
  { id: 'h3', name: 'Vis',   number: 3, points: 0, fouls: 0, status: 'court', team: 'home', x: 42, y: 78 },
  { id: 'h4', name: 'Nan',   number: 4, points: 0, fouls: 0, status: 'court', team: 'home', x: 18, y: 30 },
  { id: 'h5', name: 'Shyong',number: 5, points: 0, fouls: 0, status: 'court', team: 'home', x: 18, y: 70 },
  { id: 'h6', name: 'Dexter',number: 6, points: 0, fouls: 0, status: 'bench', team: 'home', x: 9.5, y: 91 },
  { id: 'h7', name: 'Cheng', number: 7, points: 0, fouls: 0, status: 'bench', team: 'home', x: 15.5, y: 91 },
  { id: 'h8', name: 'Vin',   number: 8, points: 0, fouls: 0, status: 'bench', team: 'home', x: 21.5, y: 91 },
  { id: 'h9', name: 'Kelvin',number: 9, points: 0, fouls: 0, status: 'bench', team: 'home', x: 27.5, y: 91 },
  { id: 'h10',name: 'Kenny', number: 10,points: 0, fouls: 0, status: 'bench', team: 'home', x: 33.5, y: 91 },
];

const createAwayPlayers = (): Player[] => [
  { id: 'a1', name: 'Fu',      number: 1, points: 0, fouls: 0, status: 'court', team: 'away', x: 65, y: 45 },
  { id: 'a2', name: 'Ci',      number: 2, points: 0, fouls: 0, status: 'court', team: 'away', x: 58, y: 22 },
  { id: 'a3', name: 'Sheng',   number: 3, points: 0, fouls: 0, status: 'court', team: 'away', x: 58, y: 78 },
  { id: 'a4', name: 'Ping',    number: 4, points: 0, fouls: 0, status: 'court', team: 'away', x: 82, y: 30 },
  { id: 'a5', name: 'Ivan',    number: 5, points: 0, fouls: 0, status: 'court', team: 'away', x: 82, y: 70 },
  { id: 'a6', name: 'Qian',    number: 6, points: 0, fouls: 0, status: 'bench', team: 'away', x: 64.5, y: 91 },
  { id: 'a7', name: 'Ren',     number: 7, points: 0, fouls: 0, status: 'bench', team: 'away', x: 70.5, y: 91 },
  { id: 'a8', name: 'Player 8',number: 8, points: 0, fouls: 0, status: 'bench', team: 'away', x: 76.5, y: 91 },
  { id: 'a9', name: 'Player 9',number: 9, points: 0, fouls: 0, status: 'bench', team: 'away', x: 82.5, y: 91 },
  { id: 'a10',name: 'Player 10',number:10,points: 0, fouls: 0, status: 'bench', team: 'away', x: 88.5, y: 91 },
];

// Helper to compute point-to-line segment distance for relative percentages
const getPointToSegmentDistance = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) {
    return Math.sqrt(Math.pow(px - x1, 2) + Math.pow(py - y1, 2));
  }
  let t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;
  return Math.sqrt(Math.pow(px - closestX, 2) + Math.pow(py - closestY, 2));
};

// Maps coordinate scales dynamically when viewing the court vertically [1]
const getPlayerPos = (player: Player, isVertical: boolean) => {
  if (!isVertical) {
    return { x: player.x, y: player.y };
  }
  
  if (player.status === 'bench') {
    if (player.team === 'home') {
      const idx = parseInt(player.id.replace('h', ''), 10) - 6; // index 0 to 4
      const x = 9 + idx * 6;
      return { x, y: 94 };
    } else {
      const idx = parseInt(player.id.replace('a', ''), 10) - 6; // index 0 to 4
      const x = 71 + idx * 6;
      return { x, y: 94 };
    }
  }
  
  // swap coordinates for visual vertical layout (baseline to height, sideline to width) [1]
  return { x: player.y, y: player.x };
};

// projects manual drawings dynamically depending on the current viewport layout [1]
const projectDrawings = (points: { x: number; y: number }[], isVertical: boolean) => {
  if (!isVertical) {
    return points.map(p => `${p.x * 5.8},${p.y * 3.8}`).join(' ');
  } else {
    return points.map(p => `${p.y * 3.8},${p.x * 5.8}`).join(' ');
  }
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export const BasketballBoard: React.FC = () => {
  useEffect(() => { console.log('[BB] mount'); });

  // Sync Role States
  const [mode, setMode] = useState<'controller' | 'viewer'>('controller'); 
  const [isSyncEnabled, setIsSyncEnabled] = useState<boolean>(true); 
  const [syncStatus, setSyncStatus] = useState<string>('DISCONNECTED'); 

  // UI View States
  const initialView = typeof window !== 'undefined' && window.location && window.location.pathname === '/court' ? 'court' : 'scoreboard';
  const [view, setView] = useState<'scoreboard' | 'court'>(initialView); 

  // Game States
  const [homePlayers, setHomePlayers] = useState<Player[]>(createHomePlayers);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>(createAwayPlayers);
  const [poolPlayers, setPoolPlayers] = useState<Player[]>([]);
  const [poolName, setPoolName] = useState('');
  const [poolNumber, setPoolNumber] = useState<number>(1);
  const [gameTime, setGameTime] = useState(600);
  const [shotClock, setShotClock] = useState(24);
  const [isRunning, setIsRunning] = useState(false);
  const [inputMins, setInputMins] = useState('10');
  const [clockMode, setClockMode] = useState<'countdown' | 'stopwatch'>('countdown');
  const [period, setPeriod] = useState(1);
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([]);
  const [showEvents, setShowEvents] = useState(false);
  const [showDiagramLabels, setShowDiagramLabels] = useState(false);
  
  // Tactical Board State & Drawing Systems
  const [activeTool, setActiveTool] = useState<'move' | 'draw' | 'erase'>('move');
  const [drawings, setDrawings] = useState<{ id: string; points: { x: number; y: number }[]; color: string; width: number }[]>([]);
  const [currentDrawingPoints, setCurrentDrawingPoints] = useState<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#ff4444');
  const [penSize, setPenSize] = useState<number>(4);
  const [eraserSize, setEraserSize] = useState<number>(8);
  
  // Multi-Touch Pointer Drag Tracking Refs
  const activeDragsRef = useRef<Record<number, { 
    playerId: string; 
    startX: number; 
    startY: number; 
    playerStartX: number; 
    playerStartY: number;
  }>>({});

  // Timer sync helper key
  const [timerResetKey, setTimerResetKey] = useState(0);

  // UI States
  const [showDebug, setShowDebug] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [showScoresheetMobile, setShowScoresheetMobile] = useState(false);

  // Instant Substitution
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);

  // Drag-drop substitution
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  // Tactical court drag states
  const [courtDragId, setCourtDragId] = useState<string | null>(null);
  const courtRef = useRef<HTMLDivElement>(null);

  const isViewer = mode === 'viewer';

  // SSR-Safe Mobile Device Touch Detection
  const isMobileDevice = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Monitor physical mobile screen layout context (Portrait vs Landscape) [1]
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !isMobileDevice) {
      setIsPortrait(false);
      return;
    }

    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, [isMobileDevice]);

  // Evaluates active layout profile (Restricted strictly to mobile setups) [1]
  const isVerticalView = isMobileDevice && isPortrait;

  // ── DERIVED VALUES ──
  const homeScore = homePlayers.reduce((s, p) => s + p.points, 0);
  const awayScore = awayPlayers.reduce((s, p) => s + p.points, 0);
  const homeFouls = homePlayers.filter(p => p.status === 'court').reduce((s, p) => s + p.fouls, 0);
  const awayFouls = awayPlayers.filter(p => p.status === 'court').reduce((s, p) => s + p.fouls, 0);

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

  const homeScorers = useMemo(() =>
    [...homePlayers].filter(p => p.points > 0).sort((a, b) => b.points - a.points),
    [homePlayers]
  );

  const awayScorers = useMemo(() =>
    [...awayPlayers].filter(p => p.points > 0).sort((a, b) => b.points - a.points),
    [awayPlayers]
  );

  const bcRef = useRef<BroadcastChannel | null>(null);
  const syncChannelRef = useRef<any>(null);

  // Substitution execution logic
  const executeSubstitution = useCallback((id1: string, id2: string) => {
    if (id1 === id2 || isViewer) return;
    const allPlayers = [...homePlayers, ...awayPlayers];
    const p1 = allPlayers.find(p => p.id === id1);
    const p2 = allPlayers.find(p => p.id === id2);

    if (!p1 || !p2 || p1.team !== p2.team) return;
    if (p1.status === p2.status) return;

    const setter = p1.team === 'home' ? setHomePlayers : setAwayPlayers;
    setter(prev => {
      const idx1 = prev.findIndex(p => p.id === id1);
      const idx2 = prev.findIndex(p => p.id === id2);
      if (idx1 === -1 || idx2 === -1) return prev;
      const result = [...prev];
      [result[idx1], result[idx2]] = [result[idx2], result[idx1]];
      return result.map(p => {
        if (p.id === id1) return { ...p, status: p2.status };
        if (p.id === id2) return { ...p, status: p1.status };
        return p;
      });
    });
  }, [homePlayers, awayPlayers, isViewer]);

  // ── LOCAL BROADCAST CHANNEL ──
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

  useEffect(() => {
    const payload = { homeScore, awayScore, period, gameTime, shotClock, homeFouls, awayFouls };
    try { bcRef.current?.postMessage({ type: 'update', state: payload }); } catch (e) { /* ignore */ }
  }, [homeScore, awayScore, period, gameTime, shotClock, homeFouls, awayFouls]);

  // ── ESTABLISH REALTIME CONNECTION ──
  useEffect(() => {
    if (!supabase || !isSyncEnabled) {
      setSyncStatus('OFFLINE');
      return;
    }

    setSyncStatus('CONNECTING...');

    const channel = supabase.channel('basketball-sync', {
      config: { broadcast: { self: false } }
    });

    channel
      .on('broadcast', { event: 'state-update' }, (response: any) => {
        if (mode === 'viewer') {
          const data = response.payload;
          if (!data) return;
          setHomePlayers(data.homePlayers);
          setAwayPlayers(data.awayPlayers);
          setGameTime(data.gameTime);
          
          if (data.shotClock !== shotClock && (data.shotClock === 24 || data.shotClock === 14)) {
            setTimerResetKey(k => k + 1);
          }
          setShotClock(data.shotClock);
          
          setIsRunning(data.isRunning);
          setPeriod(data.period);
          setGameEvents(data.gameEvents);
          setView(data.view);
          setClockMode(data.clockMode);
          
          if (data.drawings !== undefined) setDrawings(data.drawings);
          if (data.currentDrawingPoints !== undefined) setCurrentDrawingPoints(data.currentDrawingPoints);
        }
      })
      .subscribe((status, err) => {
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
  }, [mode, isSyncEnabled, shotClock]);

  // ── BROADCAST STATE CHANGES ──
  useEffect(() => {
    if (mode !== 'controller' || !syncChannelRef.current || !isSyncEnabled) return;

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
        clockMode,
        drawings,
        currentDrawingPoints
      }
    });
  }, [homePlayers, awayPlayers, gameTime, shotClock, isRunning, period, gameEvents, view, clockMode, mode, isSyncEnabled, drawings, currentDrawingPoints]);

  // ── INDEPENDENT MULTI-POINTER TOUCH & DRAG EVENT HANDLERS ──
  const handleCourtPointerDown = (e: React.PointerEvent<HTMLDivElement>, playerId: string) => {
    if (isViewer) return;
    
    e.preventDefault();
    e.stopPropagation();

    const rect = courtRef.current?.getBoundingClientRect();
    if (!rect) return;

    const startX = ((e.clientX - rect.left) / rect.width) * 100;
    const startY = ((e.clientY - rect.top) / rect.height) * 100;

    const allPlayers = [...homePlayers, ...awayPlayers];
    const p = allPlayers.find(pl => pl.id === playerId);
    if (!p) return;

    e.currentTarget.setPointerCapture(e.pointerId);

    // Get position in current visual perspective (vertical or horizontal) [1]
    const projected = getPlayerPos(p, isVerticalView);

    activeDragsRef.current[e.pointerId] = {
      playerId,
      startX,
      startY,
      playerStartX: projected.x,
      playerStartY: projected.y
    };
    
    setCourtDragId(playerId);
  };

  const handleCourtPointerMove = (e: React.PointerEvent<HTMLDivElement>, playerId: string) => {
    if (isViewer) return;
    const dragInfo = activeDragsRef.current[e.pointerId];
    if (!dragInfo || dragInfo.playerId !== playerId) return;

    const rect = courtRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientXPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const clientYPercent = ((e.clientY - rect.top) / rect.height) * 100;

    const deltaX = clientXPercent - dragInfo.startX;
    const deltaY = clientYPercent - dragInfo.startY;

    const visualX = clamp(dragInfo.playerStartX + deltaX, 0, 100);
    const visualY = clamp(dragInfo.playerStartY + deltaY, 0, 100);

    let updatedX = visualX;
    let updatedY = visualY;

    if (isVerticalView) {
      // Swapping values back to persistent horizontal profiles [1]
      updatedX = visualY;
      updatedY = visualX;
    }

    const updater = (prev: Player[]) => prev.map(p => {
      if (p.id === playerId) {
        return { ...p, x: updatedX, y: updatedY };
      }
      return p;
    });

    setHomePlayers(updater);
    setAwayPlayers(updater);
  };

  const handleCourtPointerUp = (e: React.PointerEvent<HTMLDivElement>, playerId: string) => {
    if (isViewer) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // ignore
    }
    delete activeDragsRef.current[e.pointerId];
    setCourtDragId(null);
  };

  const handleCourtPointerCancel = (e: React.PointerEvent<HTMLDivElement>, playerId: string) => {
    if (isViewer) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // ignore
    }
    delete activeDragsRef.current[e.pointerId];
    setCourtDragId(null);
  };

  // ── TACTICAL BOARD FREEHAND DRAWING & ERASING HANDLERS ──
  const handleCourtBgPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isViewer || activeTool === 'move') return;
    e.preventDefault();
    e.stopPropagation();

    const rect = courtRef.current?.getBoundingClientRect();
    if (!rect) return;

    const visualX = ((e.clientX - rect.left) / rect.width) * 100;
    const visualY = ((e.clientY - rect.top) / rect.height) * 100;

    // Save drawing point in the base horizontal reference system [1]
    const savedX = isVerticalView ? visualY : visualX;
    const savedY = isVerticalView ? visualX : visualY;

    e.currentTarget.setPointerCapture(e.pointerId);

    if (activeTool === 'draw') {
      setIsDrawing(true);
      setCurrentDrawingPoints([{ x: savedX, y: savedY }]);
    } else if (activeTool === 'erase') {
      setIsDrawing(true);
      eraseAtPoint(savedX, savedY);
    }
  };

  const handleCourtBgPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isViewer || !isDrawing) return;

    const rect = courtRef.current?.getBoundingClientRect();
    if (!rect) return;

    const visualX = ((e.clientX - rect.left) / rect.width) * 100;
    const visualY = ((e.clientY - rect.top) / rect.height) * 100;

    const savedX = isVerticalView ? visualY : visualX;
    const savedY = isVerticalView ? visualX : visualY;

    if (activeTool === 'draw') {
      setCurrentDrawingPoints(prev => [...prev, { x: savedX, y: savedY }]);
    } else if (activeTool === 'erase') {
      eraseAtPoint(savedX, savedY);
    }
  };

  const handleCourtBgPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isViewer) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}

    if (activeTool === 'draw' && isDrawing && currentDrawingPoints.length > 1) {
      setDrawings(prev => [
        ...prev,
        {
          id: uid(),
          points: currentDrawingPoints,
          color: strokeColor,
          width: penSize
        }
      ]);
    }

    setIsDrawing(false);
    setCurrentDrawingPoints([]);
  };

  const eraseAtPoint = (ex: number, ey: number) => {
    setDrawings(prev => {
      return prev.filter(drawing => {
        const pts = drawing.points;
        const threshold = eraserSize; 
        for (let i = 0; i < pts.length - 1; i++) {
          const dist = getPointToSegmentDistance(ex, ey, pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y);
          if (dist < threshold) {
            return false;
          }
        }
        return true;
      });
    });
  };

  // ── INDEPENDENT GAME CLOCK LOOP ──
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
    }, 1000);
    return () => clearInterval(t);
  }, [isRunning, clockMode]);

  // ── INDEPENDENT SHOT CLOCK LOOP ──
  useEffect(() => {
    if (!isRunning) return;
    const t = setInterval(() => {
      setShotClock(p => (p <= 1 ? 0 : p - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [isRunning, timerResetKey]);

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

  const handleEmptyCourtDrop = useCallback((e: React.DragEvent, team: 'home' | 'away') => {
    e.preventDefault();
    if (!draggedId || isViewer) return;
    const setter = team === 'home' ? setHomePlayers : setAwayPlayers;
    setter(prev => prev.map(p => p.id === draggedId ? { ...p, status: 'court' as const } : p));
    setDraggedId(null);
    setDropTargetId(null);
  }, [draggedId, isViewer]);

  const handleEmptyBenchDrop = useCallback((e: React.DragEvent, team: 'home' | 'away') => {
    e.preventDefault();
    if (!draggedId || isViewer) return;
    const setter = team === 'home' ? setHomePlayers : setAwayPlayers;
    setter(prev => prev.map(p => p.id === draggedId ? { ...p, status: 'bench' as const } : p));
    setDraggedId(null);
    setDropTargetId(null);
  }, [draggedId, isViewer]);

  const handleCourtGridDrop = useCallback((e: React.DragEvent, team: 'home' | 'away') => {
    e.preventDefault();
    if (!draggedId || isViewer) return;
    const setter = team === 'home' ? setHomePlayers : setAwayPlayers;
    setter(prev => {
      const court = prev.filter(p => p.status === 'court');
      const dragged = prev.find(p => p.id === draggedId);
      if (court.length >= 5 || !dragged || dragged.status !== 'bench') return prev;
      const otherBench = prev.filter(p => p.status === 'bench' && p.id !== draggedId);
      return [
        ...court,
        { ...dragged, status: 'court' as const },
        ...otherBench
      ];
    });
    setDraggedId(null);
    setDropTargetId(null);
  }, [draggedId, isViewer]);

  const addPoolPlayer = useCallback(() => {
    if (isViewer) return;
    const name = poolName.trim() || 'Player';
    const id = `pool_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const newPlayer: Player = {
      id,
      name,
      number: poolNumber || 1,
      points: 0,
      fouls: 0,
      status: 'pool',
      team: 'home',
      x: 50,
      y: 50,
    };
    setPoolPlayers(prev => [...prev, newPlayer]);
    setPoolName('');
  }, [poolName, poolNumber, isViewer]);

  const handlePoolDragStart = useCallback((e: React.DragEvent, playerId: string) => {
    if (isViewer) return;
    e.dataTransfer.effectAllowed = 'move';
    setDraggedId(playerId);
  }, [isViewer]);

  const handleSetTime = useCallback(() => {
    if (isViewer) return;
    const m = parseInt(inputMins, 10);
    if (!isNaN(m) && m >= 0) {
      setGameTime(m * 60);
      setIsRunning(false);
    }
  }, [inputMins, isViewer]);

  const handleResetShotClock = (seconds: number) => {
    if (isViewer) return;
    setShotClock(seconds);
    setTimerResetKey(k => k + 1);
  };

  const shotUrgent = shotClock <= 5 && shotClock > 0;

  const openDisplay = useCallback(() => {
    try {
      const features = 'toolbar=0,location=0,menubar=0,resizable=1,scrollbars=0,width=1280,height=720';
      window.open('/display', 'scoreboard_display', features);
      
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
              view === 'scoreboard' ? 'bg-gradient-to-r from-amber-500 to-amber-650 text-slate-900 shadow-md scale-[1.01]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard size={16} /> Scoreboard & Rosters
          </button>
          <button
            onClick={() => setView('court')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              view === 'court' ? 'bg-gradient-to-r from-emerald-500 to-emerald-650 text-slate-950 shadow-md scale-[1.01]' : 'text-slate-400 hover:text-white'
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
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2">
                  {!isViewer && (
                    <button onClick={undoLast} disabled={gameEvents.length === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-700/90 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all active:scale-95 shadow-md">
                      <Undo2 size={13} /> Undo Last
                    </button>
                  )}
                  <button onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-700/90 hover:bg-violet-600 text-white text-xs font-semibold transition-all active:scale-95 shadow-md">
                    <FileText size={13} /> Scoresheet PDF
                  </button>
                  <button onClick={() => setShowEvents(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700/90 hover:bg-emerald-600 text-white text-xs font-semibold transition-all active:scale-95 shadow-md">
                    <List size={13} /> Events
                  </button>
                  <button onClick={openDisplay}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700/90 hover:bg-blue-600 text-white text-xs font-semibold transition-all active:scale-95 shadow-md">
                    <LayoutDashboard size={13} /> Display
                  </button>
                  {!isViewer && (
                    <>
                      <button onClick={resetGame}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition-all active:scale-95 shadow-md">
                        <RotateCcw size={13} /> Reset
                      </button>
                      <button onClick={() => setView('court')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700/90 hover:bg-emerald-600 text-white text-xs font-semibold transition-all active:scale-95 shadow-md">
                        <Move size={13} /> Open Tactical Page
                      </button>
                    </>
                  )}
                </div>

                <div className="sm:hidden relative">
                  <button onClick={() => setShowMobileActions(s => !s)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-700/90 text-white text-sm font-semibold">
                    Actions
                  </button>
                  {showMobileActions && (
                    <div className="absolute right-0 mt-2 w-44 bg-slate-800 border border-slate-700 rounded shadow-lg z-30 p-2 space-y-2">
                      {!isViewer && (
                        <button onClick={undoLast} disabled={gameEvents.length === 0}
                          className="w-full text-left px-2 py-1 rounded bg-amber-700/80 text-white text-sm disabled:opacity-40">Undo Last</button>
                      )}
                      <button onClick={() => window.print()} className="w-full text-left px-2 py-1 rounded bg-violet-700/80 text-white text-sm">Scoresheet PDF</button>
                      <button onClick={() => { setShowEvents(v => !v); setShowMobileActions(false); }} className="w-full text-left px-2 py-1 rounded bg-emerald-700/80 text-white text-sm">Events</button>
                      
                      <button onClick={() => { openDisplay(); setShowMobileActions(false); }} className="w-full text-left px-2 py-1 rounded bg-blue-700/80 text-white text-sm">Display</button>

                      {!isViewer && (
                        <>
                          <button onClick={resetGame} className="w-full text-left px-2 py-1 rounded bg-slate-700/80 text-white text-sm">Reset</button>
                          <button onClick={() => { setView('court'); setShowMobileActions(false); }} className="w-full text-left px-2 py-1 rounded bg-emerald-700/80 text-white text-sm">Open Tactical Page</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Scoreboard Banner */}
            <div className="relative overflow-hidden rounded-2xl shadow-2xl border border-slate-700/50">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-950/20 via-slate-800 to-blue-900/20 pointer-events-none" />
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
                        <button onClick={() => handleResetShotClock(24)}
                          className="flex items-center gap-1 bg-rose-700/90 hover:bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow transition-all active:scale-95">
                          <RefreshCw size={9} />24s
                        </button>
                        <button onClick={() => handleResetShotClock(14)}
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

            {/* Player Pool */}
            <div className="rounded-2xl border-2 border-slate-700/60 bg-slate-800/30 shadow-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-700/40 flex items-center justify-between bg-slate-800/60">
                <div className="flex items-center gap-2">
                  <Users size={15} className="text-slate-400" />
                  <h3 className="text-base font-bold text-slate-200">Player Pool</h3>
                </div>
                {poolPlayers.length > 0 && (
                  <button onClick={() => setPoolPlayers([])} className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-0.5">
                    <Trash2 size={10} /> Clear
                  </button>
                )}
              </div>
              <div className="p-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    value={poolName}
                    onChange={e => setPoolName(e.target.value)}
                    placeholder="Name"
                    className="flex-1 bg-slate-900/60 border border-slate-700/60 rounded-lg px-2 py-1 text-sm text-slate-200 focus:outline-none focus:border-slate-500"
                  />
                  <input
                    type="number"
                    value={poolNumber}
                    onChange={e => setPoolNumber(parseInt(e.target.value || '0'))}
                    placeholder="#"
                    className="w-14 bg-slate-900/60 border border-slate-700/60 rounded-lg px-2 py-1 text-sm text-slate-200 focus:outline-none focus:border-slate-500"
                  />
                  <button
                    onClick={addPoolPlayer}
                    className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm px-3 py-1 rounded-lg transition-colors">
                    Add
                  </button>
                </div>
                {poolPlayers.length === 0 ? (
                  <div className="text-center text-[11px] text-slate-600 italic">No players in pool</div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    {poolPlayers.map(player => (
                      <div key={player.id}
                        draggable
                        onDragStart={e => handlePoolDragStart(e, player.id)}
                        onDragEnd={() => setDraggedId(null)}
                        className="relative group p-1 rounded-lg border border-slate-700/40 bg-slate-800/20 flex flex-col items-center cursor-grab active:cursor-grabbing transition-all hover:scale-105 hover:border-slate-600/60">
                        <button
                          onClick={(e) => { e.stopPropagation(); e.preventDefault(); setPoolPlayers(prev => prev.filter(p => p.id !== player.id)); setDraggedId(null); }}
                          className="absolute -top-1.5 -right-1.5 rounded-full bg-slate-700 text-slate-300 hover:text-white hover:bg-red-900/70 border border-slate-600/60 shadow-sm transition-colors w-5 h-5 flex items-center justify-center leading-none"
                          title="Remove">
                          ✕
                        </button>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-slate-300 font-bold text-[10px] bg-slate-700/60 mb-0.5">
                          <InlineNumber num={player.number} className="text-[11px]" compact disabled />
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[54px] leading-tight">{player.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Roster Panels */}
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
                onBenchClick={handleBenchClick} isViewer={isViewer}
                onClear={() => setHomePlayers(prev => prev.map(p => ({ ...p, status: 'bench' })))}
                onEmptyCourtDrop={e => handleEmptyCourtDrop(e, 'home')}
                onEmptyBenchDrop={e => handleEmptyBenchDrop(e, 'home')}
                onCourtGridDrop={e => handleCourtGridDrop(e, 'home')} />
              <RosterPanel team="away" players={awayPlayers}
                onAddPoints={addPoints} onAddFoul={addFoul}
                onRename={renamePlayer}
                onChangeNumber={changePlayerNumber}
                draggedId={draggedId} dropTargetId={dropTargetId}
                onDragStart={handleRosterDragStart} onDrop={handleRosterDrop}
                onDragOver={(e, id) => { e.preventDefault(); setDropTargetId(id); }}
                onDragLeave={() => setDropTargetId(null)}
                selectedCourtId={selectedCourtId} onSelectCourt={handleSelectCourt}
                onBenchClick={handleBenchClick} isViewer={isViewer}
                onClear={() => setAwayPlayers(prev => prev.map(p => ({ ...p, status: 'bench' })))}
                onEmptyCourtDrop={e => handleEmptyCourtDrop(e, 'away')}
                onEmptyBenchDrop={e => handleEmptyBenchDrop(e, 'away')}
                onCourtGridDrop={e => handleCourtGridDrop(e, 'away')} />
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
                          <div key={p.id} className="flex items-center gap-3 text-[12px] bg-blue-900/10 border border-blue-700/20 px-2.5 py-1 rounded">
                            <span className="w-4 text-xs text-slate-400">{i + 1}.</span>
                            <span className="text-sm text-sky-200 truncate">#{p.number} {p.name}</span>
                            <span className="ml-auto font-bold text-sky-350">{p.points} pts</span>
                          </div>
                      )) : <span className="text-[10px] text-slate-600 italic">No scorers yet</span>}
                    </div>
                  </div>
                </div>
                <p className="text-center text-[10px] text-slate-600 italic mt-2">Player numbers appear at the cumulative score when they scored.</p>
              </div>
              
              {showDebug && (
                <div className="mt-3 p-3 bg-slate-900/70 rounded text-xs overflow-auto max-h-64 hidden sm:block">
                  <div className="text-[11px] font-bold text-slate-300 mb-2">Debug — gameEvents</div>
                  <pre className="text-[11px] text-slate-200 whitespace-pre-wrap mb-3">{JSON.stringify(gameEvents, null, 2)}</pre>
                  <div className="text-[11px] font-bold text-slate-300 mb-2">Derived scoresheetMap</div>
                  <pre className="text-[11px] text-slate-200 whitespace-pre-wrap">{JSON.stringify(scoresheetMap, null, 2)}</pre>
                </div>
              )}
            </div>

            {/* Events Log */}
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
            VIEW 2: FULL TACTICAL COURT (AUTO-ROTATING VIEW)
           ========================================== */}
        {view === 'court' && (
          <div className="space-y-4">
            
            {/* COMPACT FLOATING SCOREBAR */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-1 sm:gap-2 items-center bg-slate-800/80 border border-slate-700/50 rounded-xl p-2 sm:p-3 shadow-lg select-none">
              
              {/* Home Team Mini Score */}
              <div className="flex items-center gap-1.5 sm:gap-3 justify-start pl-1 sm:pl-4">
                <span className="text-xs sm:text-sm font-bold text-amber-400 uppercase tracking-wider">Home</span>
                <span className="text-xl sm:text-3xl font-black text-orange-500">{homeScore}</span>
                <span className="text-[10px] sm:text-sm text-slate-400 truncate">
                  (F: <span className="font-extrabold text-sm sm:text-xl text-amber-500">{homeFouls}</span>)
                </span>
              </div>
              
              {/* Game Timers (Spans full width on mobile, 1 column on tablet+) */}
              <div className="col-span-2 sm:col-span-1 order-last sm:order-none text-center flex flex-col items-center border-t border-slate-700/30 pt-1.5 sm:pt-0 sm:border-t-0">
                <div className="text-xl sm:text-2xl font-mono font-black text-emerald-400 leading-none mb-1">
                  {formatTime(gameTime)}
                </div>
                <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
                  <span className="text-slate-500">Period: <b className="text-slate-300 font-bold">{period}</b></span>
                  <span className="text-slate-500">|</span>
                  <span className={`font-mono font-bold ${shotUrgent ? 'text-red-400 animate-pulse' : 'text-slate-300'}`}>
                    Shot: {shotClock}s
                  </span>
                </div>
              </div>

              {/* Away Team Mini Score */}
              <div className="flex items-center gap-1.5 sm:gap-3 justify-end pr-1 sm:pr-4">
                <span className="text-[10px] sm:text-sm text-slate-400 truncate">
                  (F: <span className="font-extrabold text-sm sm:text-xl text-sky-400">{awayFouls}</span>)
                </span>
                <span className="text-xl sm:text-3xl font-black text-blue-500">{awayScore}</span>
                <span className="text-xs sm:text-sm font-bold text-sky-400 uppercase tracking-wider">Away</span>
              </div>
            </div>

            {/* ACTION ROW */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Info size={14} className="text-amber-400" />
                <span>💡 Drag any player token to move them individually. To move multiple players, touch them simultaneously on mobile.</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDiagramLabels(prev => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow ${
                    showDiagramLabels 
                      ? 'bg-amber-500 text-slate-900 border-amber-400' 
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  {showDiagramLabels ? 'Hide Court Labels' : 'Show Court Labels'}
                </button>
              </div>
            </div>

            {/* DIAGRAM COURT AND CONTROLS CARD */}
            <div className="rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl bg-slate-800/50 p-4 flex flex-col items-center gap-4">
              
              {/* TOOLBAR CONTROL PANEL (OUTSIDE THE COURT WORKSPACE) [1] */}
              {!isViewer && (
                <div className="flex flex-row flex-wrap items-center justify-center gap-2 p-1.5 bg-slate-900/95 border border-slate-700/50 rounded-xl shadow-lg select-none">
                  <button
                    onClick={() => setActiveTool('move')}
                    title="Move Players"
                    className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold ${
                      activeTool === 'move' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Move size={15} /> Move
                  </button>

                  <button
                    onClick={() => setActiveTool('draw')}
                    title="Draw Lines"
                    className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold ${
                      activeTool === 'draw' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Pencil size={15} /> Draw
                  </button>

                  <button
                    onClick={() => setActiveTool('erase')}
                    title="Eraser"
                    className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold ${
                      activeTool === 'erase' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Eraser size={15} /> Eraser
                  </button>

                  <div className="border-l h-6 mx-1 border-slate-700/50" />

                  <button
                    onClick={() => {
                      setDrawings([]);
                      setCurrentDrawingPoints([]);
                    }}
                    title="Clear All Drawings"
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>

                  {activeTool === 'draw' && (
                    <>
                      <div className="border-l h-6 mx-1 border-slate-700/50" />
                      <div className="flex items-center gap-1.5 flex-row px-1">
                        {[
                          ['#ff4444', 'bg-red-500'],
                          ['#3b82f6', 'bg-blue-500'],
                          ['#ffffff', 'bg-white border border-slate-600']
                        ].map(([colorCode, bgClass]) => (
                          <button
                            key={colorCode}
                            onClick={() => setStrokeColor(colorCode)}
                            className={`w-3.5 h-3.5 rounded-full ${bgClass} transition-transform ${
                              strokeColor === colorCode ? 'scale-125 ring-2 ring-amber-400' : 'opacity-70 hover:opacity-100 hover:scale-110'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* DIAGRAM PANEL */}
              <div className="w-full relative">
                <div ref={courtRef}
                  onPointerDown={handleCourtBgPointerDown}
                  onPointerMove={handleCourtBgPointerMove}
                  onPointerUp={handleCourtBgPointerUp}
                  onPointerCancel={handleCourtBgPointerUp}
                  className={`relative w-full rounded-xl overflow-hidden select-none border-2 border-slate-700 shadow-2xl cursor-crosshair bg-slate-900 ${
                    isVerticalView 
                      ? 'aspect-[38/58] max-w-[420px] mx-auto' 
                      : 'min-w-[560px] md:min-w-0 aspect-[58/38]'
                  } ${courtDragId || isDrawing || activeTool !== 'move' ? 'touch-none' : 'touch-auto'}`}
                  style={{ backgroundColor: '#fdd2ab' }}
                >
                  
                  {isVerticalView ? (
                    // ==================================================
                    // 1. VERTICAL VIEW SVG (ViewBox: 380 x 580) [1]
                    // ==================================================
                    <svg viewBox="0 0 380 580" className="w-full h-full absolute inset-0 pointer-events-none select-none">
                      <rect x="0" y="0" width="380" height="510" fill="#fdd2ab" />
                      <rect x="0" y="510" width="380" height="70" fill="#dfd0c0" />
                      <rect x="140" y="10" width="100" height="100" fill="#f2913f" />
                      <rect x="140" y="410" width="100" height="100" fill="#f2913f" />
                      
                      {/* Court Boundary Lines (Thicker stroke) */}
                      <rect x="50" y="10" width="280" height="500" fill="none" stroke="white" strokeWidth="3.5" />
                      <line x1="50" y1="260" x2="330" y2="260" stroke="white" strokeWidth="3.5" />
                      
                      {/* Center Circles (Thicker stroke, smaller center court circle radius) [1] */}
                      <circle cx="190" cy="260" r="28" fill="none" stroke="white" strokeWidth="3" />
                      <circle cx="190" cy="260" r="7" fill="none" stroke="white" strokeWidth="1.8" strokeDasharray="2.5,2.5" />

                      {/* TOP BASKET ZONE (Thicker stroke, wider corner three-point area) [1] */}
                      <line x1="140" y1="110" x2="240" y2="110" stroke="white" strokeWidth="3.5" />
                      <path d="M 170,29 A 20,20 0 0,0 210,29" fill="none" stroke="white" strokeWidth="2" strokeDasharray="2.2,2.2" />
                      <path d="M 140,110 A 50,50 0 0,0 240,110" fill="none" stroke="white" strokeWidth="3" />
                      <path d="M 140,110 A 50,50 0 0,1 240,110" fill="none" stroke="white" strokeWidth="2" strokeDasharray="2.5,2.5" />
                      <path d="M 75,10 L 75,80 A 115,115 0 0,0 305,80 L 305,10" fill="none" stroke="white" strokeWidth="3.2" />
                      <line x1="160" y1="22" x2="220" y2="22" stroke="white" strokeWidth="4" />
                      <line x1="190" y1="10" x2="190" y2="22" stroke="white" strokeWidth="2" />
                      <circle cx="190" cy="29" r="7" fill="none" stroke="#ff5500" strokeWidth="3" />

                      {/* BOTTOM BASKET ZONE (Thicker lines, wider corner three-point area) [1] */}
                      <line x1="140" y1="410" x2="240" y2="410" stroke="white" strokeWidth="2.5" />
                      <path d="M 170,491 A 20,20 0 0,1 210,491" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="2.2,2.2" />
                      <path d="M 140,410 A 50,50 0 0,1 240,410" fill="none" stroke="white" strokeWidth="3" />
                      <path d="M 140,410 A 50,50 0 0,0 240,410" fill="none" stroke="white" strokeWidth="2" strokeDasharray="2.5,2.5" />
                      <path d="M 75,510 L 75,440 A 115,115 0 0,1 305,440 L 305,510" fill="none" stroke="white" strokeWidth="3.2" />
                      <line x1="160" y1="498" x2="220" y2="498" stroke="white" strokeWidth="4" />
                      <line x1="190" y1="510" x2="190" y2="498" stroke="white" strokeWidth="2" />
                      <circle cx="190" cy="491" r="7" fill="none" stroke="#ff5500" strokeWidth="3" />

                      {/* Hashmarks */}
                      <line x1="50" y1="170" x2="60" y2="170" stroke="white" strokeWidth="2" />
                      <line x1="50" y1="350" x2="60" y2="350" stroke="white" strokeWidth="2" />
                      <line x1="320" y1="170" x2="330" y2="170" stroke="white" strokeWidth="2" />
                      <line x1="320" y1="350" x2="330" y2="350" stroke="white" strokeWidth="2" />

                      {/* Bench Graphic Outlines */}
                      <rect x="20" y="525" width="110" height="40" fill="#bfaea0" stroke="#9d8c7d" strokeWidth="1" rx="4" />
                      <rect x="150" y="525" width="80" height="40" fill="#ebd9c8" stroke="#9d8c7d" strokeWidth="1" rx="4" />
                      <rect x="250" y="525" width="110" height="40" fill="#bfaea0" stroke="#9d8c7d" strokeWidth="1" rx="4" />

                      <text x="75" y="548" fill="#4d3b2b" opacity="0.15" fontSize="8" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">Bench</text>
                      <text x="190" y="548" fill="#4d3b2b" opacity="0.15" fontSize="8" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">Sub Box</text>
                      <text x="305" y="548" fill="#4d3b2b" opacity="0.15" fontSize="8" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">Bench</text>

                      {/* Render drawings projected vertically */}
                      {drawings.map(drawing => (
                        <polyline
                          key={drawing.id}
                          points={projectDrawings(drawing.points, true)}
                          fill="none"
                          stroke={drawing.color}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.9"
                        />
                      ))}

                      {currentDrawingPoints.length > 1 && (
                        <polyline
                          points={projectDrawings(currentDrawingPoints, true)}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.9"
                        />
                      )}

                      {/* Vertical Labels */}
                      {showDiagramLabels && (
                        <g className="transition-opacity duration-300 opacity-95">
                          <style>{`
                            .diag-lbl { font-family: sans-serif; font-size: 9px; font-weight: bold; fill: #2c1c0a; text-shadow: 1px 1px 1px #ffebda, -1px -1px 1px #ffebda, 1px -1px 1px #ffebda, -1px 1px 1px #ffebda; }
                          `}</style>
                          <text x="65" y="25" className="diag-lbl" textAnchor="start">Corner</text>
                          <text x="315" y="25" className="diag-lbl" textAnchor="end">Corner</text>
                          <text x="65" y="495" className="diag-lbl" textAnchor="start">Corner</text>
                          <text x="315" y="495" className="diag-lbl" textAnchor="end">Corner</text>
                          
                          <text x="140" y="125" className="diag-lbl" textAnchor="end">Elbow</text>
                          <text x="240" y="125" className="diag-lbl" textAnchor="start">Elbow</text>
                          <text x="140" y="395" className="diag-lbl" textAnchor="end">Elbow</text>
                          <text x="240" y="395" className="diag-lbl" textAnchor="start">Elbow</text>
                          
                          <text x="190" y="70" className="diag-lbl" textAnchor="middle">Painted Area</text>
                          <text x="190" y="455" className="diag-lbl" textAnchor="middle">Painted Area</text>

                          <text x="190" y="170" className="diag-lbl" textAnchor="middle">Top of the Key</text>
                          <text x="190" y="350" className="diag-lbl" textAnchor="middle">Top of the Key</text>
                          
                          <text x="190" y="270" className="diag-lbl" textAnchor="middle">Center Circle</text>
                          <text x="190" y="250" className="diag-lbl" textAnchor="middle">Half-Court Line</text>
                          <text x="45" y="260" className="diag-lbl" textAnchor="middle" transform="rotate(-90 45 260)">Sideline</text>
                          <text x="190" y="505" className="diag-lbl" textAnchor="middle">Baseline</text>
                        </g>
                      )}
                    </svg>
                  ) : (
                    // ==================================================
                    // 2. HORIZONTAL VIEW SVG (ViewBox: 580 x 380) [1]
                    // ==================================================
                    <svg viewBox="0 0 580 380" className="w-full h-full absolute inset-0 pointer-events-none select-none">
                      <rect x="0" y="0" width="580" height="310" fill="#fdd2ab" />
                      <rect x="0" y="310" width="580" height="70" fill="#dfd0c0" />
                      <rect x="40" y="120" width="105" height="100" fill="#f2913f" />
                      <rect x="435" y="120" width="105" height="100" fill="#f2913f" />

                      {/* Outer Court Lines (Thicker stroke) */}
                      <rect x="40" y="30" width="500" height="280" fill="none" stroke="white" strokeWidth="3.5" />
                      <line x1="290" y1="30" x2="290" y2="310" stroke="white" strokeWidth="3.5" />
                      
                      {/* Center Circles (Thicker stroke, smaller center court circle radius) [1] */}
                      <circle cx="290" cy="170" r="28" fill="none" stroke="white" strokeWidth="3" />
                      <circle cx="290" cy="170" r="7" fill="none" stroke="white" strokeWidth="1.8" strokeDasharray="2.5,2.5" />

                      {/* Basket area lines (Wider corner three-point area) [1] */}
                      <line x1="145" y1="120" x2="145" y2="220" stroke="white" strokeWidth="3.5" />
                      <path d="M 59,150 A 20,20 0 0,1 59,190" fill="none" stroke="white" strokeWidth="2" strokeDasharray="2.2,2.2" />
                      <path d="M 145,120 A 50,50 0 0,1 145,220" fill="none" stroke="white" strokeWidth="3" />
                      <path d="M 145,120 A 50,50 0 0,0 145,220" fill="none" stroke="white" strokeWidth="2" strokeDasharray="2.5,2.5" />
                      <path d="M 40,60 L 110,60 A 110,110 0 0,1 110,280 L 40,280" fill="none" stroke="white" strokeWidth="3.2" />
                      <line x1="52" y1="140" x2="52" y2="200" stroke="white" strokeWidth="4" />
                      <line x1="40" y1="170" x2="52" y2="170" stroke="white" strokeWidth="2" />
                      <circle cx="59" cy="170" r="7" fill="none" stroke="#ff5500" strokeWidth="3" />

                      {/* Right-hand side Basket area lines (Wider corner three-point area) [1] */}
                      <line x1="435" y1="120" x2="435" y2="220" stroke="white" strokeWidth="3.5" />
                      <path d="M 521,150 A 20,20 0 0,0 521,190" fill="none" stroke="white" strokeWidth="2" strokeDasharray="2.2,2.2" />
                      <path d="M 435,120 A 50,50 0 0,0 435,220" fill="none" stroke="white" strokeWidth="3" />
                      <path d="M 435,120 A 50,50 0 0,1 435,220" fill="none" stroke="white" strokeWidth="2" strokeDasharray="2.5,2.5" />
                      <path d="M 540,60 L 470,60 A 110,110 0 0,0 470,280 L 540,280" fill="none" stroke="white" strokeWidth="3.2" />
                      <line x1="528" y1="140" x2="528" y2="200" stroke="white" strokeWidth="4" />
                      <line x1="540" y1="170" x2="528" y2="170" stroke="white" strokeWidth="2" />
                      <circle cx="521" cy="170" r="7" fill="none" stroke="#ff5500" strokeWidth="3" />

                      <line x1="190" y1="30" x2="190" y2="40" stroke="white" strokeWidth="2" />
                      <line x1="390" y1="30" x2="390" y2="40" stroke="white" strokeWidth="2" />
                      <line x1="190" y1="300" x2="190" y2="310" stroke="white" strokeWidth="2" />
                      <line x1="390" y1="300" x2="390" y2="310" stroke="white" strokeWidth="2" />

                      <rect x="40" y="325" width="180" height="40" fill="#bfaea0" stroke="#9d8c7d" strokeWidth="1" rx="4" />
                      <rect x="250" y="325" width="80" height="40" fill="#ebd9c8" stroke="#9d8c7d" strokeWidth="1" rx="4" />
                      <rect x="360" y="325" width="180" height="40" fill="#bfaea0" stroke="#9d8c7d" strokeWidth="1" rx="4" />

                      <text x="130" y="348" fill="#4d3b2b" opacity="0.15" fontSize="10" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">Coaching box and Team bench area</text>
                      <text x="290" y="348" fill="#4d3b2b" opacity="0.15" fontSize="10" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">Substitution box</text>
                      <text x="450" y="348" fill="#4d3b2b" opacity="0.15" fontSize="10" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">Coaching box and Team bench area</text>

                      {drawings.map(drawing => (
                        <polyline
                          key={drawing.id}
                          points={projectDrawings(drawing.points, false)}
                          fill="none"
                          stroke={drawing.color}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.9"
                        />
                      ))}

                      {currentDrawingPoints.length > 1 && (
                        <polyline
                          points={projectDrawings(currentDrawingPoints, false)}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.9"
                        />
                      )}

                      {showDiagramLabels && (
                        <g className="transition-opacity duration-300 opacity-95">
                          <style>{`
                            .diag-lbl { font-family: sans-serif; font-size: 10px; font-weight: bold; fill: #2c1c0a; text-shadow: 1px 1px 1px #ffebda, -1px -1px 1px #ffebda, 1px -1px 1px #ffebda, -1px 1px 1px #ffebda; }
                          `}</style>
                          <text x="55" y="40" className="diag-lbl" textAnchor="start">Corner</text>
                          <text x="55" y="290" className="diag-lbl" textAnchor="start">Corner</text>
                          <text x="55" y="100" className="diag-lbl" textAnchor="start">Short Corner</text>
                          
                          <text x="100" y="125" className="diag-lbl" textAnchor="end">Low Post / Block</text>
                          <text x="480" y="125" className="diag-lbl" textAnchor="start">Low Post / Block</text>
                          
                          <text x="73" y="160" className="diag-lbl" textAnchor="middle">Restricted area</text>
                          <text x="507" y="160" className="diag-lbl" textAnchor="middle">Restricted area</text>
                          
                          <text x="145" y="115" className="diag-lbl" textAnchor="end">High Post / Elbow</text>
                          <text x="435" y="115" className="diag-lbl" textAnchor="start">High Post / Elbow</text>
                          
                          <text x="205" y="174" className="diag-lbl" textAnchor="middle">Top of the Key</text>
                          <text x="375" y="174" className="diag-lbl" textAnchor="middle">Top of the Key</text>
                          
                          <text x="180" y="75" className="diag-lbl" textAnchor="middle">Wing</text>
                          <text x="400" y="75" className="diag-lbl" textAnchor="middle">Wing</text>

                          <text x="290" y="120" className="diag-lbl" textAnchor="middle">Center circle</text>
                          <text x="290" y="55" className="diag-lbl" textAnchor="middle">Half-court line</text>
                          <text x="290" y="25" className="diag-lbl" textAnchor="middle">Sideline</text>
                          <text x="15" y="174" className="diag-lbl" textAnchor="middle" transform="rotate(-90 15 174)">Baseline or Endline</text>

                          <text x="105" y="165" className="diag-lbl" textAnchor="middle" fontSize="8">Painted area</text>
                          <text x="215" y="90" className="diag-lbl" textAnchor="start">Three-Point line / The Arc</text>
                        </g>
                      )}
                    </svg>
                  )}

                  {/* ACTIVE PRESENTATION PLAYER TOKENS */}
                  {[
                    ...homePlayers,
                    ...awayPlayers
                  ].map(player => {
                    const pos = getPlayerPos(player, isVerticalView);
                    return (
                      <div key={player.id}
                        onPointerDown={e => handleCourtPointerDown(e, player.id)}
                        onPointerMove={e => handleCourtPointerMove(e, player.id)}
                        onPointerUp={e => handleCourtPointerUp(e, player.id)}
                        onPointerCancel={e => handleCourtPointerCancel(e, player.id)}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 touch-none ${isViewer ? '' : 'cursor-grab active:cursor-grabbing'} ${courtDragId === player.id ? 'z-20 scale-110' : ''} ${player.status === 'bench' ? 'opacity-85' : ''}`}
                        style={{ 
                          left: `${pos.x}%`, 
                          top: `${pos.y}%`, 
                          transition: courtDragId === player.id ? 'none' : 'transform 0.1s',
                          pointerEvents: activeTool === 'move' ? 'auto' : 'none'
                        }}>
                        <div className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full border-2 border-white/95 shadow-lg flex items-center justify-center font-black text-white text-xs md:text-sm ${
                          player.team === 'home' ? 'bg-gradient-to-br from-red-500 to-red-700' : 'bg-gradient-to-br from-blue-500 to-blue-700'
                        } ${courtDragId === player.id ? 'ring-2 ring-yellow-400' : ''} ${selectedCourtId === player.id ? 'ring-2 ring-yellow-400' : ''}`}>
                          {player.number}
                        </div>
                        <span className="text-[11px] bg-black/85 px-1.5 py-0.5 rounded text-white mt-0.5 leading-none max-w-[64px] sm:max-w-[80px] truncate">
                          {player.name}
                        </span>
                      </div>
                    );
                  })}

                </div>
              </div>
            </div>
            
            <p className="text-center text-xs text-slate-500 italic">💡 Tactical positioning is completely independent of scoreboard roster statuses.</p>
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
  onClear?: () => void;
  onEmptyCourtDrop?: (e: React.DragEvent) => void;
  onEmptyBenchDrop?: (e: React.DragEvent) => void;
  onCourtGridDrop?: (e: React.DragEvent) => void;
}> = ({ 
  team, players, onAddPoints, onAddFoul, onRename, 
  onChangeNumber,
  draggedId, dropTargetId, onDragStart, onDrop, onDragOver, onDragLeave,
  selectedCourtId, onSelectCourt, onBenchClick, isViewer = false,
  onClear,
  onEmptyCourtDrop,
  onEmptyBenchDrop,
  onCourtGridDrop
}) => {
  const isHome = team === 'home';
  const borderColor = isHome ? 'border-orange-500/60' : 'border-blue-500/60';
  const headerBg = isHome ? 'bg-orange-500/10' : 'bg-blue-500/10';
  const accentText = isHome ? 'text-amber-400' : 'text-sky-400';
  const accentPts = isHome ? 'text-amber-500' : 'text-sky-400';

  const courtPlayers = players.filter(p => p.status === 'court');
  const benchPlayers = players.filter(p => p.status === 'bench');

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
          <span className="text-[10px] text-slate-500 flex items-center gap-0.5"><ArrowRightLeft size={9} />Click/drag to sub</span>
          {onClear && (
            <button onClick={onClear} className="ml-1 text-[10px] text-red-400 hover:text-red-300 flex items-center gap-0.5">
              <Trash2 size={10} /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="p-3 space-y-3">
        <div>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block mb-2">On Court</span>
          {courtPlayers.length === 0 ? (
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={onEmptyCourtDrop}
              onDragLeave={onDragLeave}
              className="rounded-xl border border-dashed border-slate-700/60 bg-slate-900/40 p-3">
              <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Cleared - drop here</div>
            </div>
          ) : (
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={onCourtGridDrop}
              onDragLeave={onDragLeave}
              className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {courtPlayers.map((player, idx) => {
              const isSelected = selectedCourtId === player.id;
              return (
                <div key={player.id}
                  draggable={!isViewer}
                  onContextMenu={e => e.preventDefault()}
                  onDragStart={e => onDragStart(e, player.id)}
                  onDrop={e => { e.stopPropagation(); onDrop(e, player.id); }}
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
                    className="text-sm text-slate-300 truncate max-w-[64px] sm:max-w-[72px] leading-tight group" />
                  <div className={`text-[10px] font-bold ${accentPts} mt-0.5`}>{player.points}pts</div>
                  <div className={`mt-1 text-sm text-slate-400 flex items-center gap-1`}>
                    <span className="text-xs md:text-sm">Fouls:</span>
                    <span className={`${player.fouls >= 4 ? 'text-red-400' : 'text-slate-300'} font-bold text-sm md:text-base`}>{player.fouls}</span>
                  </div>
                  
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
        )}
        </div>

        <div>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block mb-2">Bench</span>
          {benchPlayers.length === 0 ? (
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={onEmptyBenchDrop}
              onDragLeave={onDragLeave}
              className="rounded-xl border border-dashed border-slate-700/60 bg-slate-900/40 p-3">
              <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Cleared - drop here</div>
            </div>
          ) : (
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={benchPlayers.length === 0 ? onEmptyBenchDrop : undefined}
              onDragLeave={onDragLeave}
              className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
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
                  } ${isDropTarget(player.id) ? 'border-emerald-400 ring-2 ring-emerald-400 bg-emerald-900/20 scale-105' : 'border-slate-700/40 bg-slate-800/20 hover:bg-slate-750 flex flex-col items-center justify-pointer transition-all hover:scale-105'}`}
                >
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-white/60 font-bold text-[10px] md:text-xs mb-0.5 ${
                    isHome ? 'bg-red-900/50' : 'bg-blue-950/50'
                  }`}>
                    <InlineNumber num={player.number} onSave={(v) => onChangeNumber(team, player.id, v)} className="text-sm" compact={true} disabled={isViewer} />
                  </div>
                  <InlineName name={player.name} onSave={n => onRename(team, player.id, n)} disabled={isViewer}
                    className="text-sm text-slate-500 truncate max-w-[64px] sm:max-w-[72px]" />
                  <div className={`text-sm ${accentPts} opacity-60 mt-0.5`}>{player.points}pts</div>
                </div>
              ))}
            </div>
          )}
        </div>
            
        <div>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block mb-2">Player Stats</span>
          <div className="flex items-center gap-4 text-xs">
            {teamScorers.length > 0 ? teamScorers.map(p => (
              <div key={p.id} className={`flex items-center gap-3 px-2 py-1 rounded ${isHome ? 'bg-orange-900/5' : 'bg-blue-900/5'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-white text-xs ${isHome ? 'bg-orange-500' : 'bg-blue-500'}`}>
                  <InlineNumber num={p.number} onSave={(v) => onChangeNumber(team, p.id, v)} className="text-xs" compact={true} disabled={isViewer} />
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