import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  X,
  Compass,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  MapPin,
  Calendar,
  Users,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Sparkles,
  ArrowUpRight,
  Globe,
} from 'lucide-react';
import { LatzEvent, EVENT_CATEGORIES } from '../types';
import { formatRussianDate } from '../utils/dateUtils';
import { PlayerAvatar } from './PlayerAvatar';

interface WorldMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: LatzEvent[];
  onSelectEvent: (eventId: string) => void;
  onShowToast: (msg: string) => void;
}

type Dimension = 'overworld' | 'nether' | 'the_end';

export const WorldMapModal: React.FC<WorldMapModalProps> = ({
  isOpen,
  onClose,
  events,
  onSelectEvent,
  onShowToast,
}) => {
  const [dimension, setDimension] = useState<Dimension>('overworld');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [mobileTab, setMobileTab] = useState<'radar' | 'points'>('radar');

  // Pan and zoom state for 2D radar
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cursorCoords, setCursorCoords] = useState<{ x: number; z: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStateRef = useRef<{
    startX: number;
    startY: number;
    initialPanX: number;
    initialPanY: number;
    initialDist: number | null;
    initialZoom: number;
  }>({
    startX: 0,
    startY: 0,
    initialPanX: 0,
    initialPanY: 0,
    initialDist: null,
    initialZoom: 1,
  });

  // Filter events by dimension with coordinates
  const mappedEvents = useMemo(() => {
    return events.filter((e) => {
      if (!e.coordinates) return false;
      const eventDim = e.coordinates.dimension || 'overworld';
      return eventDim === dimension;
    });
  }, [events, dimension]);

  // Selected event
  const selectedEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  // Reset viewport when dimension changes or opened
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (isOpen) {
      resetView();
    }
  }, [isOpen, dimension]);

  if (!isOpen) return null;

  // BlueMap URL generator
  const getBlueMapUrl = (
    dim: Dimension,
    coords?: { x: number; y?: number; z: number }
  ) => {
    const worldName =
      dim === 'nether'
        ? 'world_nether'
        : dim === 'the_end'
        ? 'world_the_end'
        : 'world';
    const x = coords?.x ?? 8;
    const y = coords?.y ?? 70;
    const z = coords?.z ?? 7;
    return `http://map.latzland.eu:29476/#${worldName}:${x}:${y}:${z}:50:1.61:0.78:0:0:perspective`;
  };

  const currentBlueMapUrl = getBlueMapUrl(
    dimension,
    selectedEvent?.coordinates
  );

  // Scale for 2D Radar: 1 block = 0.45px * zoom
  const BLOCK_SCALE = 0.45 * zoom;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const blockX = Math.round((mouseX - centerX - pan.x) / BLOCK_SCALE);
    const blockZ = Math.round((mouseY - centerY - pan.y) / BLOCK_SCALE);
    setCursorCoords({ x: blockX, z: blockZ });

    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.2 : 0.83;
    setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.25), 4));
  };

  // Touch Handlers for mobile panning and pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchStateRef.current = {
        startX: t.clientX,
        startY: t.clientY,
        initialPanX: pan.x,
        initialPanY: pan.y,
        initialDist: null,
        initialZoom: zoom,
      };
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchStateRef.current = {
        startX: (t1.clientX + t2.clientX) / 2,
        startY: (t1.clientY + t2.clientY) / 2,
        initialPanX: pan.x,
        initialPanY: pan.y,
        initialDist: dist,
        initialZoom: zoom,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    if (e.touches.length === 1) {
      const t = e.touches[0];
      const deltaX = t.clientX - touchStateRef.current.startX;
      const deltaY = t.clientY - touchStateRef.current.startY;
      const newPanX = touchStateRef.current.initialPanX + deltaX;
      const newPanY = touchStateRef.current.initialPanY + deltaY;
      setPan({ x: newPanX, y: newPanY });

      const blockX = Math.round((t.clientX - rect.left - centerX - newPanX) / BLOCK_SCALE);
      const blockZ = Math.round((t.clientY - rect.top - centerY - newPanY) / BLOCK_SCALE);
      setCursorCoords({ x: blockX, z: blockZ });
    } else if (e.touches.length === 2 && touchStateRef.current.initialDist) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const ratio = currentDist / touchStateRef.current.initialDist;
      setZoom(Math.min(Math.max(touchStateRef.current.initialZoom * ratio, 0.25), 4));
    }
  };

  const handleCopyCoords = (x: number, z: number, y?: number) => {
    const text = y !== undefined ? `${x} ${y} ${z}` : `${x} ${z}`;
    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    onShowToast(`Координаты скопированы: X: ${x}, Z: ${z}`);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-6xl h-[92vh] sm:h-[90vh] flex flex-col bg-[#0f0f0f] border border-white/15 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden text-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-0 sm:h-14 bg-[#141414] border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Compass className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5 truncate">
                  <span>Карта мира</span>
                  <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-semibold uppercase">
                    {dimension === 'overworld' ? 'Верхний мир' : dimension === 'nether' ? 'Незер' : 'Энд'}
                  </span>
                </h2>
              </div>
            </div>

            {/* Mobile Close Button (top-right on mobile) */}
            <div className="flex sm:hidden items-center gap-1.5">
              <a
                href={currentBlueMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                title="BlueMap"
              >
                <Globe className="w-4 h-4" />
              </a>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white border border-white/10"
                title="Закрыть"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dimension Selector & Desktop Action buttons */}
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            {/* Dimension Selector */}
            <div className="flex items-center bg-black/40 p-0.5 sm:p-1 rounded-xl border border-white/10 text-xs flex-1 sm:flex-none justify-center">
              <button
                onClick={() => {
                  setDimension('overworld');
                  setSelectedEventId(null);
                }}
                className={`px-2 sm:px-3 py-1 rounded-lg font-semibold text-[11px] sm:text-xs transition-all flex-1 sm:flex-none text-center ${
                  dimension === 'overworld'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span className="sm:hidden">Верхний</span>
                <span className="hidden sm:inline">Верхний мир</span>
              </button>
              <button
                onClick={() => {
                  setDimension('nether');
                  setSelectedEventId(null);
                }}
                className={`px-2 sm:px-3 py-1 rounded-lg font-semibold text-[11px] sm:text-xs transition-all flex-1 sm:flex-none text-center ${
                  dimension === 'nether'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Незер
              </button>
              <button
                onClick={() => {
                  setDimension('the_end');
                  setSelectedEventId(null);
                }}
                className={`px-2 sm:px-3 py-1 rounded-lg font-semibold text-[11px] sm:text-xs transition-all flex-1 sm:flex-none text-center ${
                  dimension === 'the_end'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Энд
              </button>
            </div>

            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
              <a
                href={currentBlueMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-semibold text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 transition-colors"
                title="Открыть интерактивную веб-карту BlueMap в новой вкладке браузера"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>BlueMap</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white border border-white/10 transition-colors"
                title="Закрыть карту"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile View Mode Tabs (< md only): Radar vs Points List */}
        <div className="md:hidden flex items-center bg-[#181818] border-b border-white/10 p-1 shrink-0 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMobileTab('radar')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'radar'
                ? 'bg-[#00e676] text-black font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>2D Радар карты</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('points')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'points'
                ? 'bg-[#00e676] text-black font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Точки ({mappedEvents.length})</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* 2D Coordinate Radar Canvas */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            onWheel={handleWheel}
            className={`flex-1 relative overflow-hidden bg-[#0a0a0a] select-none touch-none ${
              mobileTab === 'points' ? 'hidden md:block' : 'block'
            } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          >
            {/* Grid */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)
                `,
                backgroundSize: `${100 * BLOCK_SCALE}px ${100 * BLOCK_SCALE}px`,
                backgroundPosition: `calc(50% + ${pan.x}px) calc(50% + ${pan.y}px)`,
              }}
            />

            {/* Axes (0, 0) */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: `calc(50% + ${pan.x}px)`,
                top: 0,
                bottom: 0,
                width: '1px',
                backgroundColor: 'rgba(0, 230, 118, 0.3)',
              }}
            />
            <div
              className="absolute pointer-events-none"
              style={{
                top: `calc(50% + ${pan.y}px)`,
                left: 0,
                right: 0,
                height: '1px',
                backgroundColor: 'rgba(0, 230, 118, 0.3)',
              }}
            />

            {/* Spawn Marker */}
            <div
              className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
              style={{
                left: `calc(50% + ${pan.x}px)`,
                top: `calc(50% + ${pan.y}px)`,
              }}
            >
              <div className="w-5 h-5 rounded-full bg-[#00e676]/25 border-2 border-[#00e676] flex items-center justify-center shadow-[0_0_12px_rgba(0,230,118,0.5)]">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold font-mono tracking-wider text-[#00e676] bg-black/80 px-1.5 py-0.5 rounded border border-[#00e676]/30 mt-1 whitespace-nowrap shadow">
                СПАВН (0, 0)
              </span>
            </div>

            {/* Event Markers */}
            {mappedEvents.map((evt) => {
              if (!evt.coordinates) return null;
              const { x, z } = evt.coordinates;
              const cat = EVENT_CATEGORIES[evt.type] || EVENT_CATEGORIES.event;
              const isSelected = selectedEventId === evt.id;
              const distFromSpawn = Math.round(Math.hypot(x, z));

              return (
                <div
                  key={evt.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEventId(evt.id);
                  }}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group transition-transform ${
                    isSelected ? 'scale-125 z-30' : 'hover:scale-115'
                  }`}
                  style={{
                    left: `calc(50% + ${pan.x + x * BLOCK_SCALE}px)`,
                    top: `calc(50% + ${pan.y + z * BLOCK_SCALE}px)`,
                  }}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center border-2 transition-all shadow-lg ${
                      isSelected
                        ? 'ring-4 ring-white/40 border-white'
                        : 'border-[#0a0a0a]'
                    }`}
                    style={{
                      backgroundColor: cat.color,
                      boxShadow: `0 0 16px ${cat.color}66`,
                    }}
                  >
                    <cat.icon className="w-3.5 h-3.5 text-black stroke-[2.4]" />
                  </div>

                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:flex flex-col items-center pointer-events-none whitespace-nowrap z-40">
                    <div className="bg-[#181818] border border-white/20 rounded-lg px-2.5 py-1.5 shadow-xl text-center">
                      <p className="text-xs font-bold text-white leading-snug">
                        {evt.title}
                      </p>
                      <span className="font-mono text-[10px] text-emerald-400">
                        X: {x}, Z: {z} • {distFromSpawn} бл. от спавна
                      </span>
                    </div>
                    <div className="w-2 h-2 bg-[#181818] rotate-45 border-r border-b border-white/20 -mt-1" />
                  </div>
                </div>
              );
            })}

            {/* HUD: Cursor coordinates (Top-Left) */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/80 backdrop-blur-md border border-white/15 rounded-xl px-2.5 py-1 text-[10px] sm:text-xs text-neutral-300 font-mono z-20 pointer-events-none max-w-[calc(100%-120px)] truncate shadow-lg">
              <Compass className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">
                {cursorCoords ? (
                  <>
                    X: <strong className="text-white">{cursorCoords.x}</strong>, Z:{' '}
                    <strong className="text-white">{cursorCoords.z}</strong>
                    <span className="text-neutral-500 ml-1.5 hidden sm:inline">
                      (~{Math.round(Math.hypot(cursorCoords.x, cursorCoords.z))} бл.)
                    </span>
                  </>
                ) : (
                  'Перемещайте карту'
                )}
              </span>
            </div>

            {/* Zoom HUD (Top-Right) */}
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/80 backdrop-blur-md border border-white/15 rounded-xl p-1 z-20 shadow-lg">
              <button
                onClick={() => setZoom((z) => Math.min(z * 1.25, 4))}
                className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
                title="Приблизить"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(z * 0.8, 0.25))}
                className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
                title="Отдалить"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <div className="w-px h-3.5 bg-white/15" />
              <button
                onClick={resetView}
                className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
                title="К спавну (0, 0)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Floating Selected Event Card (bottom of map) */}
            {selectedEvent && (
              <div className="md:hidden absolute bottom-2.5 left-2.5 right-2.5 z-30 bg-[#161616]/95 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-3 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                      style={{
                        backgroundColor: `${EVENT_CATEGORIES[selectedEvent.type]?.color || '#00e676'}20`,
                        color: EVENT_CATEGORIES[selectedEvent.type]?.color || '#00e676',
                      }}
                    >
                      {EVENT_CATEGORIES[selectedEvent.type]?.label || selectedEvent.type}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {formatRussianDate(selectedEvent.date)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedEventId(null)}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white"
                    title="Закрыть карточку"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h4 className="text-sm font-bold text-white truncate mb-1">
                  {selectedEvent.title}
                </h4>

                {selectedEvent.coordinates && (
                  <div className="flex items-center justify-between text-xs font-mono text-emerald-400 mb-2.5 bg-white/5 px-2 py-1 rounded-lg">
                    <span>
                      X: {selectedEvent.coordinates.x}, Z: {selectedEvent.coordinates.z}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyCoords(
                          selectedEvent.coordinates!.x,
                          selectedEvent.coordinates!.z,
                          selectedEvent.coordinates!.y
                        )
                      }
                      className="text-neutral-400 hover:text-white flex items-center gap-1 text-[10px]"
                    >
                      {copiedCoords ? <Check className="w-3 h-3 text-[#00e676]" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCoords ? 'Скопировано' : 'Копировать'}</span>
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectEvent(selectedEvent.id);
                      onClose();
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>В ленту</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  {selectedEvent.coordinates && (
                    <a
                      href={getBlueMapUrl(
                        selectedEvent.coordinates.dimension || dimension,
                        selectedEvent.coordinates
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs flex items-center justify-center gap-1.5 border border-white/10"
                    >
                      <Globe className="w-3.5 h-3.5 text-emerald-400" />
                      <span>BlueMap</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Selected Event Details & Points List (Full on mobile when points tab active, side-by-side on desktop) */}
          <div
            className={`bg-[#121212] border-t md:border-t-0 md:border-l border-white/10 flex flex-col overflow-hidden ${
              mobileTab === 'points'
                ? 'flex-1 w-full'
                : 'hidden md:flex md:w-80 lg:w-88 shrink-0'
            }`}
          >
            {selectedEvent ? (
              <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Selected Event Header */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded uppercase"
                        style={{
                          backgroundColor: `${EVENT_CATEGORIES[selectedEvent.type]?.color || '#00e676'}20`,
                          color: EVENT_CATEGORIES[selectedEvent.type]?.color || '#00e676',
                        }}
                      >
                        {EVENT_CATEGORIES[selectedEvent.type]?.label || selectedEvent.type}
                      </span>
                      <button
                        onClick={() => setSelectedEventId(null)}
                        className="text-xs text-neutral-500 hover:text-white transition-colors"
                      >
                        К списку точек
                      </button>
                    </div>

                    <h3 className="text-base font-extrabold text-white leading-snug">
                      {selectedEvent.title}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">
                      {formatRussianDate(selectedEvent.date)}
                      {selectedEvent.season && ` • Сезон ${selectedEvent.season}`}
                    </p>
                  </div>

                  {/* Coordinates Banner */}
                  {selectedEvent.coordinates && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                          Координаты
                        </span>
                        <button
                          onClick={() =>
                            handleCopyCoords(
                              selectedEvent.coordinates!.x,
                              selectedEvent.coordinates!.z,
                              selectedEvent.coordinates!.y
                            )
                          }
                          className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white transition-colors"
                          title="Скопировать координаты"
                        >
                          {copiedCoords ? (
                            <Check className="w-3.5 h-3.5 text-[#00e676]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>Копировать</span>
                        </button>
                      </div>

                      <div className="font-mono text-xs text-emerald-400 font-bold">
                        X: {selectedEvent.coordinates.x},{' '}
                        {selectedEvent.coordinates.y !== undefined &&
                          `Y: ${selectedEvent.coordinates.y}, `}
                        Z: {selectedEvent.coordinates.z}
                      </div>
                      <span className="text-[11px] text-neutral-400 block mt-1">
                        ~{Math.round(Math.hypot(selectedEvent.coordinates.x, selectedEvent.coordinates.z))} блоков от спавна
                      </span>

                      {/* Direct Link to BlueMap coordinates */}
                      <a
                        href={getBlueMapUrl(
                          selectedEvent.coordinates.dimension || dimension,
                          selectedEvent.coordinates
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2.5 w-full py-1.5 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300 flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Открыть в BlueMap</span>
                        <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
                      </a>
                    </div>
                  )}

                  {/* Description */}
                  {selectedEvent.description && (
                    <p className="text-xs text-neutral-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                      {selectedEvent.description}
                    </p>
                  )}

                  {/* Participants */}
                  {selectedEvent.players && selectedEvent.players.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                        Участники
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedEvent.players.map((p) => (
                          <div
                            key={p}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-neutral-200"
                          >
                            <PlayerAvatar username={p} size={16} />
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 mt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      onSelectEvent(selectedEvent.id);
                      onClose();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <span>Перейти к событию в ленте</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Points List */
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-white/10">
                  <h3 className="text-sm font-bold text-white">
                    Точки на карте ({mappedEvents.length})
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Нажмите на точку на карте или выберите из списка
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {mappedEvents.length === 0 ? (
                    <div className="py-12 px-4 text-center text-neutral-500 text-xs">
                      В этом измерении пока нет отмеченных событий с координатами.
                    </div>
                  ) : (
                    mappedEvents.map((evt) => {
                      const { x, z, y } = evt.coordinates!;
                      const cat =
                        EVENT_CATEGORIES[evt.type] || EVENT_CATEGORIES.event;
                      return (
                        <button
                          key={evt.id}
                          onClick={() => {
                            setSelectedEventId(evt.id);
                            // Pan to this marker in 2D
                            setPan({
                              x: -x * BLOCK_SCALE,
                              y: -z * BLOCK_SCALE,
                            });
                            setMobileTab('radar');
                          }}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all flex items-start gap-2.5 group"
                        >
                          <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                            style={{
                              backgroundColor: `${cat.color}25`,
                              color: cat.color,
                            }}
                          >
                            <cat.icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-neutral-200 group-hover:text-white truncate">
                              {evt.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono mt-0.5">
                              <span>
                                X: {x}, Z: {z}
                              </span>
                              <span>•</span>
                              <span>
                                ~{Math.round(Math.hypot(x, z))} бл.
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


