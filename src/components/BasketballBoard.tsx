import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Play, Pause, Timer, ArrowRightLeft,
  ChevronUp, ChevronDown, Trophy,
  UserCheck, Edit3, Check, RotateCcw,
  Undo2, FileText, List, RefreshCw,
  LayoutDashboard, Move, Monitor, Smartphone,
  Info, Pencil, Eraser, Trash2
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
  x: number; // Position along the court's long axis (0 - 100)
  y: number; // Position along the court's short axis (0 - 100)
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
// HELPERS
// ==========================================
const formatTime = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const uid = () => Math.random().toString(36).slice(2);

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

// Default setup with coordinates aligned to screenshot
const createHomePlayers = (): Player[] => [
  { id: 'h1', name: 'Kwong', number: 1, points: 0, fouls: 0, status: 'court', team: 'home', x: 35, y: 50 },
  { id: 'h2', name: 'Hua',   number: 2, points: 0, fouls: 0, status: 'court', team: 'home', x: 42, y: 25 },
  { id: 'h3', name: 'Vis',   number: 3, points: 0, fouls: 0, status: 'court', team: 'home', x: 42, y: 75 },
  { id: 'h4', name: 'Nan',   number: 4, points: 0, fouls: 0, status: 'court', team: 'home', x: 18, y: 30 },
  { id: 'h5', name: 'Shyong',number: 5, points: 0, fouls: 0, status: 'court', team: 'home', x: 18, y: 70 },
  // Bench players aligned in a vertical column along the right sideline in Vertical View
  { id: 'h6', name: 'Dexter',number: 6, points: 0, fouls: 0, status: 'bench', team: 'home', x: 10, y: 92 },
  { id: 'h7', name: 'Cheng', number: 7, points: 0, fouls: 0, status: 'bench', team: 'home', x: 18, y: 92 },
  { id: 'h8', name: 'Vin',   number: 8, points: 0, fouls: 0, status: 'bench', team: 'home', x: 26, y: 92 },
  { id: 'h9', name: 'Kelvin',number: 9, points: 0, fouls: 0, status: 'bench', team: 'home', x: 34, y: 92 },
  { id: 'h10',name: 'Kenny', number: 10,points: 0, fouls: 0, status: 'bench', team: 'home', x: 42, y: 92 },
];

const createAwayPlayers = (): Player[] => [
  { id: 'a1', name: 'Fu',      number: 1, points: 0, fouls: 0, status: 'court', team: 'away', x: 65, y: 50 },
  { id: 'a2', name: 'Ci',      number: 2, points: 0, fouls: 0, status: 'court', team: 'away', x: 58, y: 25 },
  { id: 'a3', name: 'Sheng',   number: 3, points: 0, fouls: 0, status: 'court', team: 'away', x: 58, y: 75 },
  { id: 'a4', name: 'Ping',    number: 4, points: 0, fouls: 0, status: 'court', team: 'away', x: 82, y: 30 },
  { id: 'a5', name: 'Ivan',    number: 5, points: 0, fouls: 0, status: 'court', team: 'away', x: 82, y: 70 },
  // Bench players aligned in a vertical column along the right sideline in Vertical View
  { id: 'a6', name: 'Qian',    number: 6, points: 0, fouls: 0, status: 'bench', team: 'away', x: 58, y: 92 },
  { id: 'a7', name: 'Ren',     number: 7, points: 0, fouls: 0, status: 'bench', team: 'away', x: 66, y: 92 },
  { id: 'a8', name: 'Player 8',number: 8, points: 0, fouls: 0, status: 'bench', team: 'away', x: 74, y: 92 },
  { id: 'a9', name: 'Player 9',number: 9, points: 0, fouls: 0, status: 'bench', team: 'away', x: 82, y: 92 },
  { id: 'a10',name: 'Player 10',number:10,points: 0, fouls: 0, status: 'bench', team: 'away', x: 90, y: 92 },
];

// ==========================================
// MAIN COMPONENT
// ==========================================
export const BasketballBoard: React.FC = () => {
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
  const [gameTime, setGameTime] = useState(600);
  const [shotClock, setShotClock] = useState(24);
  const [isRunning, setIsRunning] = useState(false);
  const [inputMins, setInputMins] = useState('10');
  const [clockMode, setClockMode] = useState<'countdown' | 'stopwatch'>('countdown');
  const [period, setPeriod] = useState(1);
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([]);
  const [showEvents, setShowEvents] = useState(false);
  const [showDiagramLabels, setShowDiagramLabels] = useState(true);
  
  // Tactical Board State & Drawing Systems
  const [activeTool, setActiveTool] = useState<'move' | 'draw' | 'erase'>('move');
  const [drawings, setDrawings] = useState<{ id: string; points: { x: number; y: number }[]; color: string; width: number }[]>([]);
  const [currentDrawingPoints, setCurrentDrawingPoints] = useState<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#ff4444');
  const [penSize, setPenSize] = useState<number>(4);
  const [eraserSize, setEraserSize] = useState<number>(8);
  
  // Dynamic Orientation State
  const [isPortrait, setIsPortrait] = useState<boolean>(true);

  // Responsive Screen Orientation Tracking
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Map drawing coordinates to SVG pixels depending on active aspect ratio
  const getSvgPoints = useCallback((points: { x: number; y: number }[]) => {
    return points.map(p => {
      if (isPortrait) {
        // Vertical layout mapping: SVG X is mapped to short axis (y), SVG Y is mapped to long axis (x)
        return `${p.y * 1.5},${p.x * 2.8}`;
      }
      // Horizontal layout mapping: SVG X is long axis (x), SVG Y is short axis (y)
      return `${p.x * 2.8},${p.y * 1.5}`;
    }).join(' ');
  }, [isPortrait]);

  const activeDragsRef = useRef<Record<number, { 
    playerId: string; 
    startX: number; 
    startY: number; 
    playerStartX: number; 
    playerStartY: number;
  }>>({});

  const [timerResetKey, setTimerResetKey] = useState(0);

  // UI States
  const [showDebug, setShowDebug] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [showScoresheetMobile, setShowScoresheetMobile] = useState(false);

  // Instant Substitution Selection
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);

  // Drag-drop substitution
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const [courtDragId, setCourtDragId] = useState<string | null>(null);
  const courtRef = useRef<HTMLDivElement>(null);

  const isViewer = mode === 'viewer';

  // Derived Score / Foul Totals
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

  // Swap statuses and tactical coordinates seamlessly
  const executeSubstitution = useCallback((id1: string, id2: string) => {
    if (id1 === id2 || isViewer) return;
    const allPlayers = [...homePlayers, ...awayPlayers];
    const p1 = allPlayers.find(p => p.id === id1);
    const p2 = allPlayers.find(p => p.id === id2);

    if (!p1 || !p2 || p1.team !== p2.team) return;
    if (p1.status === p2.status) return;

    const setter = p1.team === 'home' ? setHomePlayers : setAwayPlayers;
    setter(prev => prev.map(p => {
      if (p.id === p1.id) return { ...p, status: p2.status, x: p2.x, y: p2.y };
      if (p.id === p2.id) return { ...p, status: p1.status, x: p1.x, y: p1.y };
      return p;
    }));
  }, [homePlayers, awayPlayers, isViewer]);

  // Local Broadcast Sync Channel
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

  // Establish Supabase Sync Channel
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

  // Broadcast Controllers State Changes
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

  // Standard drag tracking mapped directly to dynamic court orientation
  const handleCourtPointerDown = (e: React.PointerEvent<HTMLDivElement>, playerId: string) => {
    if (isViewer || activeTool !== 'move') return;
    
    e.preventDefault();
    e.stopPropagation();

    const rect = courtRef.current?.getBoundingClientRect();
    if (!rect) return;

    const allPlayers = [...homePlayers, ...awayPlayers];
    const p = allPlayers.find(pl => pl.id === playerId);
    if (!p) return;

    const clientXPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const clientYPercent = ((e.clientY - rect.top) / rect.height) * 100;

    // Map axes cleanly: In Portrait, Y-axis represents court X, X-axis represents court Y
    const startX = isPortrait ? clientYPercent : clientXPercent;
    const startY = isPortrait ? clientXPercent : clientYPercent;

    e.currentTarget.setPointerCapture(e.pointerId);

    activeDragsRef.current[e.pointerId] = {
      playerId,
      startX,
      startY,
      playerStartX: p.x,
      playerStartY: p.y
    };
    
    setCourtDragId(playerId);
  };

  const handleCourtPointerMove = (e: React.PointerEvent<HTMLDivElement>, playerId: string) => {
    if (isViewer || activeTool !== 'move') return;
    const dragInfo = activeDragsRef.current[e.pointerId];
    if (!dragInfo || dragInfo.playerId !== playerId) return;

    const rect = courtRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientXPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const clientYPercent = ((e.clientY - rect.top) / rect.height) * 100;

    const currentX = isPortrait ? clientYPercent : clientXPercent;
    const currentY = isPortrait ? clientXPercent : clientYPercent;

    const deltaX = currentX - dragInfo.startX;
    const deltaY = currentY - dragInfo.startY;

    const newX = clamp(dragInfo.playerStartX + deltaX, 0, 100);
    const newY = clamp(dragInfo.playerStartY + deltaY, 0, 100);

    const updater = (prev: Player[]) => prev.map(p => {
      if (p.id === playerId) {
        return { ...p, x: newX, y: newY };
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
    } catch (err) {}
    delete activeDragsRef.current[e.pointerId];
    setCourtDragId(null);
  };

  // Drawing Pointer Event Handlers
  const handleCourtBgPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isViewer || activeTool === 'move') return;
    e.preventDefault();
    e.stopPropagation();

    const rect = courtRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientXPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const clientYPercent = ((e.clientY - rect.top) / rect.height) * 100;

    const x = isPortrait ? clientYPercent : clientXPercent;
    const y = isPortrait ? clientXPercent : clientYPercent;

    e.currentTarget.setPointerCapture(e.pointerId);

    if (activeTool === 'draw') {
      setIsDrawing(true);
      setCurrentDrawingPoints([{ x, y }]);
    } else if (activeTool === 'erase') {
      setIsDrawing(true);
      eraseAtPoint(x, y);
    }
  };

  const handleCourtBgPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isViewer || !isDrawing) return;

    const rect = courtRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientXPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const clientYPercent = ((e.clientY - rect.top) / rect.height) * 100;

    const x = isPortrait ? clientYPercent : clientXPercent;
    const y = isPortrait ? clientXPercent : clientYPercent;

    if (activeTool === 'draw') {
      setCurrentDrawingPoints(prev => [...prev, { x, y }]);
    } else if (activeTool === 'erase') {
      eraseAtPoint(x, y);
    }
  };

  const handleCourtBgPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isViewer) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}

    if (activeTool === 'draw' && isDrawing && currentDrawingPoints.length > 1) {
      setDrawings(prev => [
        ...prev,
        { id: uid(), points: currentDrawingPoints, color: strokeColor, width: penSize }
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

  // Game/Shot clock tickers
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

  useEffect(() => {
    if (!isRunning) return;
    const t = setInterval(() => {
      setShotClock(p => (p <= 1 ? 0 : p - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [isRunning, timerResetKey]);

  // Roster Actions
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
        return [...prevEvs, newEv];
      });
      return prev.map(p => p.id === target.id ? { ...p, points: Math.max(0, p.points + pts) } : p);
    });
  }, [homePlayers, awayPlayers, isViewer]);

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
          return [...prevEvs, {
            id: uid(), type: 'foul' as const, team, playerId: target.id,
            playerNumber: target.number, playerName: target.name,
            value: delta, homeScoreBefore: hs, awayScoreBefore: as, timestamp: now
          }];
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
    } catch (e) {}
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 pb-12">
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
              {supabase && isSyncEnabled ? `Connected (${syncStatus})` : 'Offline Mode'}
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
              <Smartphone size={13} /> Controller
            </button>
            <button
              onClick={() => setMode('viewer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                mode === 'viewer' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor size={13} /> Viewer
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
              view === 'court' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-md scale-[1.01]' : 'text-slate-400 hover:text-white'
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
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-700/90 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-semibold transition-all shadow-md">
                      <Undo2 size={13} /> Undo Last
                    </button>
                  )}
                  <button onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-700/90 hover:bg-violet-600 text-white text-xs font-semibold transition-all shadow-md">
                    <FileText size={13} /> Scoresheet PDF
                  </button>
                  <button onClick={() => setShowEvents(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700/90 hover:bg-emerald-600 text-white text-xs font-semibold transition-all shadow-md">
                    <List size={13} /> Events
                  </button>
                  <button onClick={openDisplay}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700/90 hover:bg-blue-600 text-white text-xs font-semibold transition-all shadow-md">
                    <LayoutDashboard size={13} /> Display
                  </button>
                  {!isViewer && (
                    <button onClick={resetGame}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition-all shadow-md">
                      <RotateCcw size={13} /> Reset
                    </button>
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
                      {!isViewer && <button onClick={resetGame} className="w-full text-left px-2 py-1 rounded bg-slate-700/80 text-white text-sm">Reset</button>}
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
                    <h2 className="text-amber-400 text-base md:text-lg font-bold tracking-wider uppercase font-sans">Home</h2>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full opacity-50" />
                    <div className="relative bg-gradient-to-br from-orange-500 to-orange-700 text-white text-6xl md:text-8xl lg:text-9xl font-black py-4 px-8 md:px-12 rounded-2xl shadow-2xl select-none leading-none tabular-nums">
                      {homeScore}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm sm:text-base text-slate-400">
                    <span>Fouls:</span>
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
                            className={`px-2 text-[10px] py-0.5 ${clockMode === 'countdown' ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300'}`}>
                            Countdown
                          </button>
                          <button onClick={() => setClockMode('stopwatch')}
                            className={`px-2 text-[10px] py-0.5 ${clockMode === 'stopwatch' ? 'bg-emerald-500 text-slate-900' : 'bg-slate-700 text-slate-300'}`}>
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
                          className="flex items-center gap-1 bg-rose-700/90 hover:bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all active:scale-95">
                          <RefreshCw size={9} />24s
                        </button>
                        <button onClick={() => handleResetShotClock(14)}
                          className="flex items-center gap-1 bg-amber-700/90 hover:bg-amber-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all active:scale-95">
                          <RefreshCw size={9} />14s
                        </button>
                      </div>
                    )}
                  </div>

                  {!isViewer && (
                    <button onClick={() => setIsRunning(!isRunning)}
                      className={`w-full max-w-[200px] py-2 rounded-xl font-bold transition-all text-xs shadow-lg flex items-center justify-center gap-1.5 ${
                        isRunning ? 'bg-gradient-to-r from-red-600 to-red-700 text-white' : 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white'
                      }`}>
                      {isRunning ? <><Pause size={14} />Pause Clock</> : <><Play size={14} />Start Clock</>}
                    </button>
                  )}
                </div>

                {/* Away Team Display */}
                <div className="flex flex-col items-center justify-center py-5 md:py-7 border-l border-slate-700/40 bg-gradient-to-b from-blue-950/30 to-transparent">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Trophy size={16} className="text-sky-500/80" />
                    <h2 className="text-sky-400 text-base md:text-lg font-bold tracking-wider uppercase font-sans">Away</h2>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-sky-500/20 blur-2xl rounded-full opacity-50" />
                    <div className="relative bg-gradient-to-br from-blue-500 to-blue-700 text-white text-6xl md:text-8xl lg:text-9xl font-black py-4 px-8 md:px-12 rounded-2xl shadow-2xl select-none leading-none tabular-nums">
                      {awayScore}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-base md:text-lg text-slate-400">
                    <span>Fouls:</span>
                    <span className={`ml-2 text-xl sm:text-2xl md:text-4xl font-extrabold ${awayFouls >= 5 ? 'text-red-400 animate-pulse' : 'text-sky-400'}`}>{awayFouls}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Roster Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RosterPanel team="home" players={homePlayers}
                onAddPoints={addPoints} onAddFoul={addFoul}
                onRename={renamePlayer} onChangeNumber={changePlayerNumber}
                draggedId={draggedId} dropTargetId={dropTargetId}
                onDragStart={handleRosterDragStart} onDrop={handleRosterDrop}
                onDragOver={(e, id) => { e.preventDefault(); setDropTargetId(id); }}
                onDragLeave={() => setDropTargetId(null)}
                selectedCourtId={selectedCourtId} onSelectCourt={handleSelectCourt}
                onBenchClick={handleBenchClick} isViewer={isViewer} />
              <RosterPanel team="away" players={awayPlayers}
                onAddPoints={addPoints} onAddFoul={addFoul}
                onRename={renamePlayer} onChangeNumber={changePlayerNumber}
                draggedId={draggedId} dropTargetId={dropTargetId}
                onDragStart={handleRosterDragStart} onDrop={handleRosterDrop}
                onDragOver={(e, id) => { e.preventDefault(); setDropTargetId(id); }}
                onDragLeave={() => setDropTargetId(null)}
                selectedCourtId={selectedCourtId} onSelectCourt={handleSelectCourt}
                onBenchClick={handleBenchClick} isViewer={isViewer} />
            </div>
          </div>
        )}

        {/* ==========================================
            VIEW 2: FULL TACTICAL COURT (ACCURATE ROTATION)
           ========================================== */}
        {view === 'court' && (
          <div className="space-y-4">
            
            {/* RESPONSIVE SCOREBAR */}
            <div className="grid grid-cols-3 gap-2 items-center bg-slate-800/80 border border-slate-700/50 rounded-xl p-3 shadow-lg select-none">
              <div className="flex items-center gap-3 justify-start pl-4">
                <span className="text-xs sm:text-sm font-bold text-amber-400 uppercase tracking-wider">Home</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-3xl font-black text-orange-500">{homeScore}</span>
                  <span className="text-xs text-slate-400">({homeFouls} F)</span>
                </div>
              </div>
              <div className="text-center flex flex-col items-center">
                <div className="text-lg sm:text-2xl font-mono font-black text-emerald-400 mb-1">
                  {formatTime(gameTime)}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>P: <b className="text-slate-300">{period}</b></span>
                  <span>|</span>
                  <span className={shotUrgent ? 'text-red-400 font-bold' : 'text-slate-300'}>Shot: {shotClock}s</span>
                </div>
              </div>
              <div className="flex items-center gap-3 justify-end pr-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-slate-400">({awayFouls} F)</span>
                  <span className="text-xl sm:text-3xl font-black text-blue-500">{awayScore}</span>
                </div>
                <span className="text-xs sm:text-sm font-bold text-sky-400 uppercase tracking-wider">Away</span>
              </div>
            </div>

            {/* ACTION / CONTROL ROW */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Info size={14} className="text-amber-400 flex-shrink-0" />
                <span>Move tool dragging stays responsive when your device's orientation changes.</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDiagramLabels(prev => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow ${
                    showDiagramLabels 
                      ? 'bg-amber-500 text-slate-900 border-amber-400' 
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {showDiagramLabels ? 'Hide Labels' : 'Show Labels'}
                </button>
              </div>
            </div>

            {/* ==========================================
                NEW DESIGN: EDIT PANEL CARRIED TO TOP OF COURT 
                (Renders inline above court container to prevent blocking the court)
               ========================================== */}
            {!isViewer && (
              <div className="flex justify-center w-full">
                <div className="flex flex-wrap items-center justify-center gap-3 p-2 bg-slate-900/95 border border-slate-700/50 rounded-xl shadow-2xl w-full max-w-lg">
                  {/* Select Move Tool */}
                  <button
                    onClick={() => setActiveTool('move')}
                    title="Move Players"
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      activeTool === 'move' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Move size={14} /> Move (✥)
                  </button>

                  {/* Select Draw Tool */}
                  <button
                    onClick={() => setActiveTool('draw')}
                    title="Draw Lines"
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      activeTool === 'draw' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Pencil size={14} /> Draw (✎)
                  </button>

                  {/* Select Erase Tool */}
                  <button
                    onClick={() => setActiveTool('erase')}
                    title="Eraser"
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      activeTool === 'erase' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Eraser size={14} /> Erase (⌫)
                  </button>

                  <div className="border-l border-slate-700 h-6 mx-1" />

                  {/* Clear Drawings */}
                  <button
                    onClick={() => {
                      setDrawings([]);
                      setCurrentDrawingPoints([]);
                    }}
                    title="Clear All Drawings"
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>

                  {/* Drawing Configurations */}
                  {activeTool === 'draw' && (
                    <div className="flex items-center gap-2 border-l border-slate-700 pl-3">
                      <div className="flex gap-1">
                        {[
                          ['#ff4444', 'bg-red-500'],
                          ['#3b82f6', 'bg-blue-500'],
                          ['#ffffff', 'bg-white border border-slate-600']
                        ].map(([colorCode, bgClass]) => (
                          <button
                            key={colorCode}
                            onClick={() => setStrokeColor(colorCode)}
                            className={`w-4 h-4 rounded-full ${bgClass} transition-transform ${
                              strokeColor === colorCode ? 'scale-125 ring-2 ring-amber-400' : 'opacity-70'
                            }`}
                          />
                        ))}
                      </div>
                      <select
                        value={penSize}
                        onChange={e => setPenSize(Number(e.target.value))}
                        className="bg-slate-850 text-slate-300 border border-slate-700 text-[10px] px-1 py-0.5 rounded focus:outline-none"
                      >
                        <option value={2}>Thin</option>
                        <option value={4}>Medium</option>
                        <option value={8}>Thick</option>
                      </select>
                    </div>
                  )}

                  {activeTool === 'erase' && (
                    <div className="flex items-center gap-2 border-l border-slate-700 pl-3">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Size:</span>
                      <select
                        value={eraserSize}
                        onChange={e => setEraserSize(Number(e.target.value))}
                        className="bg-slate-850 text-slate-300 border border-slate-700 text-[10px] px-1 py-0.5 rounded focus:outline-none"
                      >
                        <option value={4}>Small</option>
                        <option value={8}>Medium</option>
                        <option value={15}>Large</option>
                        <option value={24}>XL</option>
                      </select>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* COURT CANVAS CONTAINER */}
            <div className="rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl bg-slate-800/50 p-4 flex justify-center">
              <div className="w-full relative max-w-2xl">
                <div ref={courtRef}
                  onPointerDown={handleCourtBgPointerDown}
                  onPointerMove={handleCourtBgPointerMove}
                  onPointerUp={handleCourtBgPointerUp}
                  onPointerCancel={handleCourtBgPointerUp}
                  className={`relative w-full rounded-xl overflow-hidden select-none border-2 border-slate-700 shadow-2xl bg-slate-900 ${
                    isPortrait ? 'aspect-[150/280]' : 'aspect-[280/150]'
                  } ${
                    courtDragId || isDrawing || activeTool !== 'move' ? 'touch-none' : 'touch-auto'
                  }`}
                  style={{ backgroundColor: '#fdd2ab' }}
                >
                  
                  {/* COURT DRAWINGS LAYER */}
                  <svg viewBox={isPortrait ? "0 0 150 280" : "0 0 280 150"} className="w-full h-full absolute inset-0 pointer-events-none select-none">
                    {isPortrait ? (
                      // ── VERTICAL SVG MARKINGS ──
                      <g>
                        <rect x="0" y="0" width="150" height="280" fill="#fdd2ab" />
                        
                        {/* Orange-painted Key Areas */}
                        <rect x="50" y="5" width="50" height="50" fill="#f2913f" />
                        <rect x="50" y="225" width="50" height="50" fill="#f2913f" />

                        {/* Court Boundaries */}
                        <rect x="5" y="5" width="140" height="270" fill="none" stroke="white" strokeWidth="1.5" />
                        
                        {/* Center Court Division Line */}
                        <line x1="5" y1="140" x2="145" y2="140" stroke="white" strokeWidth="1.8" />
                        <circle cx="75" cy="140" r="22" fill="none" stroke="white" strokeWidth="1.5" />
                        <circle cx="75" cy="140" r="6" fill="none" stroke="white" strokeWidth="1" strokeDasharray="1.5,1.5" />

                        {/* TOP HALF COURT KEY & HOOP */}
                        <line x1="50" y1="55" x2="100" y2="55" stroke="white" strokeWidth="1.5" />
                        <path d="M 50,55 A 25,25 0 0,0 100,55" fill="none" stroke="white" strokeWidth="1.2" strokeDasharray="2,2" />
                        <path d="M 50,55 A 25,25 0 0,1 100,55" fill="none" stroke="white" strokeWidth="1.5" />
                        <path d="M 15,5 L 15,40 A 60,60 0 0,0 135,40 L 135,5" fill="none" stroke="white" strokeWidth="1.5" />
                        <line x1="63" y1="15" x2="87" y2="15" stroke="white" strokeWidth="2.5" />
                        <line x1="75" y1="5" x2="75" y2="15" stroke="white" strokeWidth="1" />
                        <circle cx="75" cy="18" r="4.5" fill="none" stroke="#ff5500" strokeWidth="2.2" />

                        {/* BOTTOM HALF COURT KEY & HOOP */}
                        <line x1="50" y1="225" x2="100" y2="225" stroke="white" strokeWidth="1.5" />
                        <path d="M 50,225 A 25,25 0 0,1 100,225" fill="none" stroke="white" strokeWidth="1.2" strokeDasharray="2,2" />
                        <path d="M 50,225 A 25,25 0 0,0 100,225" fill="none" stroke="white" strokeWidth="1.5" />
                        <path d="M 15,275 L 15,240 A 60,60 0 0,1 135,240 L 135,275" fill="none" stroke="white" strokeWidth="1.5" />
                        <line x1="63" y1="265" x2="87" y2="265" stroke="white" strokeWidth="2.5" />
                        <line x1="75" y1="275" x2="75" y2="265" stroke="white" strokeWidth="1" />
                        <circle cx="75" cy="262" r="4.5" fill="none" stroke="#ff5500" strokeWidth="2.2" />

                        {/* Bench Zones below division */}
                        <rect x="15" y="145" width="30" height="15" fill="#dfd0c0" stroke="#bdaea0" strokeWidth="0.8" rx="3" />
                        <rect x="60" y="145" width="30" height="15" fill="#ebd9c8" stroke="#bdaea0" strokeWidth="0.8" rx="3" />
                        <rect x="105" y="145" width="30" height="15" fill="#dfd0c0" stroke="#bdaea0" strokeWidth="0.8" rx="3" />
                      </g>
                    ) : (
                      // ── HORIZONTAL SVG MARKINGS ──
                      <g>
                        <rect x="0" y="0" width="280" height="150" fill="#fdd2ab" />
                        
                        <rect x="5" y="50" width="50" height="50" fill="#f2913f" />
                        <rect x="225" y="50" width="50" height="50" fill="#f2913f" />

                        <rect x="5" y="5" width="270" height="140" fill="none" stroke="white" strokeWidth="1.5" />
                        <line x1="140" y1="5" x2="140" y2="145" stroke="white" strokeWidth="1.8" />
                        <circle cx="140" cy="75" r="22" fill="none" stroke="white" strokeWidth="1.5" />
                        <circle cx="140" cy="75" r="6" fill="none" stroke="white" strokeWidth="1" strokeDasharray="1.5,1.5" />

                        {/* LEFT HALF COURT KEY & HOOP */}
                        <line x1="55" y1="50" x2="55" y2="100" stroke="white" strokeWidth="1.5" />
                        <path d="M 55,50 A 25,25 0 0,0 55,100" fill="none" stroke="white" strokeWidth="1.2" strokeDasharray="2,2" />
                        <path d="M 55,50 A 25,25 0 0,1 55,100" fill="none" stroke="white" strokeWidth="1.5" />
                        <path d="M 5,15 L 40,15 A 60,60 0 0,1 40,135 L 5,135" fill="none" stroke="white" strokeWidth="1.5" />
                        <line x1="15" y1="63" x2="15" y2="87" stroke="white" strokeWidth="2.5" />
                        <line x1="5" y1="75" x2="15" y2="75" stroke="white" strokeWidth="1" />
                        <circle cx="18" cy="75" r="4.5" fill="none" stroke="#ff5500" strokeWidth="2.2" />

                        {/* RIGHT HALF COURT KEY & HOOP */}
                        <line x1="225" y1="50" x2="225" y2="100" stroke="white" strokeWidth="1.5" />
                        <path d="M 225,50 A 25,25 0 0,1 225,100" fill="none" stroke="white" strokeWidth="1.2" strokeDasharray="2,2" />
                        <path d="M 225,50 A 25,25 0 0,0 225,100" fill="none" stroke="white" strokeWidth="1.5" />
                        <path d="M 275,15 L 240,15 A 60,60 0 0,0 240,135 L 275,135" fill="none" stroke="white" strokeWidth="1.5" />
                        <line x1="265" y1="63" x2="265" y2="87" stroke="white" strokeWidth="2.5" />
                        <line x1="275" y1="75" x2="265" y2="75" stroke="white" strokeWidth="1" />
                        <circle cx="262" cy="75" r="4.5" fill="none" stroke="#ff5500" strokeWidth="2.2" />

                        {/* Bench Zones along sidelines */}
                        <rect x="145" y="15" width="15" height="30" fill="#dfd0c0" stroke="#bdaea0" strokeWidth="0.8" rx="3" />
                        <rect x="145" y="60" width="15" height="30" fill="#ebd9c8" stroke="#bdaea0" strokeWidth="0.8" rx="3" />
                        <rect x="145" y="105" width="15" height="30" fill="#dfd0c0" stroke="#bdaea0" strokeWidth="0.8" rx="3" />
                      </g>
                    )}

                    {/* Bench area overlays */}
                    {showDiagramLabels && (
                      <g opacity="0.4">
                        <style>{`
                          .sh-lbl { font-family: sans-serif; font-size: 5px; font-weight: bold; fill: #4a3420; text-anchor: middle; }
                        `}</style>
                        {isPortrait ? (
                          <>
                            <text x="30" y="154" className="sh-lbl">Bench Area</text>
                            <text x="75" y="154" className="sh-lbl">Sub Box</text>
                            <text x="120" y="154" className="sh-lbl">Bench Area</text>
                          </>
                        ) : (
                          <>
                            <text x="152.5" y="32" className="sh-lbl" transform="rotate(-90 152.5 32)">Bench Area</text>
                            <text x="152.5" y="77" className="sh-lbl" transform="rotate(-90 152.5 77)">Sub Box</text>
                            <text x="152.5" y="122" className="sh-lbl" transform="rotate(-90 152.5 122)">Bench Area</text>
                          </>
                        )}
                      </g>
                    )}

                    {/* RENDER ALL REGISTERED TACTICAL LINES */}
                    {drawings.map(drawing => (
                      <polyline
                        key={drawing.id}
                        points={getSvgPoints(drawing.points)}
                        fill="none"
                        stroke={drawing.color}
                        strokeWidth={drawing.width || 4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.9"
                      />
                    ))}

                    {/* CURRENT DRAG PATH */}
                    {currentDrawingPoints.length > 1 && (
                      <polyline
                        points={getSvgPoints(currentDrawingPoints)}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={penSize}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.9"
                      />
                    )}
                  </svg>

                  {/* ACTIVE & BENCH COURT PLAYER TOKENS */}
                  {[
                    ...homePlayers,
                    ...awayPlayers
                  ].map(player => (
                    <div key={player.id}
                      onPointerDown={e => handleCourtPointerDown(e, player.id)}
                      onPointerMove={e => handleCourtPointerMove(e, player.id)}
                      onPointerUp={e => handleCourtPointerUp(e, player.id)}
                      onPointerCancel={e => handleCourtPointerUp(e, player.id)}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 touch-none ${
                        isViewer ? '' : 'cursor-grab active:cursor-grabbing'
                      } ${courtDragId === player.id ? 'z-20 scale-110' : ''}`}
                      style={{ 
                        left: `${isPortrait ? player.y : player.x}%`, 
                        top: `${isPortrait ? player.x : player.y}%`, 
                        transition: courtDragId === player.id ? 'none' : 'transform 0.1s',
                        pointerEvents: activeTool === 'move' ? 'auto' : 'none'
                      }}>
                      <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full border-2 border-white/95 shadow-lg flex items-center justify-center font-black text-white text-xs ${
                        player.team === 'home' ? 'bg-gradient-to-br from-red-500 to-red-700' : 'bg-gradient-to-br from-blue-500 to-blue-700'
                      } ${courtDragId === player.id ? 'ring-2 ring-yellow-400' : ''} ${selectedCourtId === player.id ? 'ring-2 ring-yellow-400' : ''}`}>
                        {player.number}
                      </div>
                      <span className="text-[10px] bg-black/85 px-1 py-0.5 rounded text-white mt-0.5 max-w-[50px] truncate leading-none">
                        {player.name}
                      </span>
                    </div>
                  ))}

                </div>
              </div>
            </div>
            
            <p className="text-center text-xs text-slate-500 italic">💡 The top edit bar will shift automatically to fit desktop or tablet viewports.</p>
          </div>
        )}

      </div>
    </div>
  );
};

// ==========================================
// ROSTER PANEL COMPONENT
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
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Court Members */}
        <div>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block mb-2 font-sans">Active On Court</span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {courtPlayers.map((player, idx) => {
              const isSelected = selectedCourtId === player.id;
              return (
                <div key={player.id}
                  draggable={!isViewer}
                  onDragStart={e => onDragStart(e, player.id)}
                  onDrop={e => onDrop(e, player.id)}
                  onDragOver={e => onDragOver(e, player.id)}
                  onDragLeave={onDragLeave}
                  onClick={() => onSelectCourt(player.id)}
                  className={`relative p-2 rounded-xl border flex flex-col items-center bg-slate-800/95 transition-all ${isViewer ? '' : 'cursor-pointer'} ${
                    isDragging(player.id) ? 'opacity-40 scale-95' : ''
                  } ${isDropTarget(player.id) ? 'border-emerald-400 ring-2 ring-emerald-400' : 
                    isSelected ? 'border-yellow-400 ring-2 ring-yellow-400 scale-105 shadow-lg' : 'border-slate-700'
                  }`}>

                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs mb-1 shadow-md ${
                    isHome ? 'bg-gradient-to-br from-red-500 to-red-700' : 'bg-gradient-to-br from-blue-500 to-blue-700'
                  }`}>
                    <InlineNumber num={player.number} onSave={(v) => onChangeNumber(team, player.id, v)} className="text-xs" compact={true} disabled={isViewer} />
                  </div>
                  
                  <InlineName name={player.name} onSave={n => onRename(team, player.id, n)} disabled={isViewer}
                    className="text-xs text-slate-300 font-semibold truncate max-w-[64px] sm:max-w-[72px]" />
                  <div className={`text-[10px] font-bold ${accentPts} mt-0.5`}>{player.points} pts</div>
                  <div className="text-[10px] text-slate-400 font-medium">Fouls: <span className="font-bold">{player.fouls}</span></div>
                  
                  {!isViewer && (
                    <div className="flex flex-col gap-1.5 w-full mt-2">
                      <div className="flex gap-1 w-full justify-center">
                        {[1, 2, 3].map(p => (
                          <button key={p}
                            onClick={(e) => { e.stopPropagation(); onAddPoints(team, idx, p); }}
                            className="bg-slate-700 hover:bg-slate-600 text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded text-white transition-colors">
                            +{p}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-1 w-full justify-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); onAddFoul(team, idx, 1); }}
                          className="bg-red-900/60 hover:bg-red-850 text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded text-red-200 transition-colors">+F</button>
                        {player.fouls > 0 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onAddFoul(team, idx, -1); }}
                            className="bg-slate-700 hover:bg-slate-600 text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded text-slate-400 transition-colors">-F</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bench Members */}
        <div>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block mb-2 font-sans">Bench</span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {benchPlayers.map(player => (
              <div key={player.id}
                draggable={!isViewer}
                onDragStart={e => onDragStart(e, player.id)}
                onDrop={e => onDrop(e, player.id)}
                onDragOver={e => onDragOver(e, player.id)}
                onDragLeave={onDragLeave}
                onClick={() => onBenchClick(player.id)}
                className={`relative p-2 rounded-xl border flex flex-col items-center transition-all ${
                  isViewer ? '' : 'cursor-grab hover:scale-105 active:cursor-grabbing'
                } ${isDragging(player.id) ? 'opacity-40' : ''} ${
                  isDropTarget(player.id) ? 'border-emerald-400 ring-2 ring-emerald-400 bg-emerald-900/10' : 'border-slate-800 bg-slate-800/20'
                }`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white/70 font-bold text-[10px] mb-1 ${
                  isHome ? 'bg-red-950/60' : 'bg-blue-950/60'
                }`}>
                  <InlineNumber num={player.number} onSave={(v) => onChangeNumber(team, player.id, v)} className="text-xs" compact={true} disabled={isViewer} />
                </div>
                <InlineName name={player.name} onSave={n => onRename(team, player.id, n)} disabled={isViewer}
                  className="text-xs text-slate-400 truncate max-w-[64px]" />
                <div className="text-[9px] text-slate-500">{player.points} pts</div>
              </div>
            ))}
          </div>
        </div>
            
        {/* Cumulative Stats View */}
        <div>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block mb-2 font-sans">Active Scorers</span>
          <div className="flex flex-wrap gap-2 text-xs">
            {teamScorers.length > 0 ? teamScorers.map(p => (
              <div key={p.id} className={`flex items-center gap-2 px-2 py-1 rounded ${isHome ? 'bg-orange-950/20' : 'bg-blue-950/20'}`}>
                <span className={`font-bold ${accentText}`}>#{p.number}</span>
                <span className="text-slate-300 font-medium truncate max-w-[72px]">{p.name}</span>
                <span className="text-slate-400">({p.points}pts, {p.fouls}F)</span>
              </div>
            )) : <span className="text-[10px] text-slate-600 italic">No activity recorded yet</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasketballBoard;