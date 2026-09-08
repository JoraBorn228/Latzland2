import React, { useState, useMemo } from 'react';
import {
  X,
  Compass,
  ArrowRight,
  MapPin,
  Flame,
  Globe,
  Footprints,
  Ship,
  Wind,
  Navigation,
  Copy,
  Check,
  ExternalLink,
  Search,
  Sparkles,
  Layers,
} from 'lucide-react';
import { LatzEvent } from '../types';

interface NetherCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: LatzEvent[];
  onSelectEvent: (eventId: string) => void;
  onShowToast: (msg: string) => void;
}

type Mode = 'convert' | 'highway' | 'nearby';

export const NetherCalculatorModal: React.FC<NetherCalculatorModalProps> = ({
  isOpen,
  onClose,
  events,
  onSelectEvent,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<Mode>('convert');

  // Convert tab state
  const [convDir, setConvDir] = useState<'overworld_to_nether' | 'nether_to_overworld'>('overworld_to_nether');
  const [inputX, setInputX] = useState<string>('0');
  const [inputY, setInputY] = useState<string>('70');
  const [inputZ, setInputZ] = useState<string>('0');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');

  // Highway planner state
  const [pointAId, setPointAId] = useState<string>('spawn');
  const [pointBId, setPointBId] = useState<string>('');

  // Custom coordinates for Point A/B if manual
  const [customAX, setCustomAX] = useState<string>('0');
  const [customAZ, setCustomAZ] = useState<string>('0');
  const [customBX, setCustomBX] = useState<string>('1000');
  const [customBZ, setCustomBZ] = useState<string>('1000');

  // Nearby radar state
  const [myF3X, setMyF3X] = useState<string>('0');
  const [myF3Z, setMyF3Z] = useState<string>('0');
  const [myDim, setMyDim] = useState<'overworld' | 'nether' | 'the_end'>('overworld');

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Filter events with coordinates for selection
  const eventsWithCoords = useMemo(() => {
    return events.filter((e) => Boolean(e.coordinates));
  }, [events]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onShowToast(`Скопировано: ${label}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Convert Math
  const numX = parseFloat(inputX) || 0;
  const numY = parseFloat(inputY) || 70;
  const numZ = parseFloat(inputZ) || 0;

  const convertedX =
    convDir === 'overworld_to_nether'
      ? Math.floor(numX / 8)
      : Math.floor(numX * 8);

  const convertedZ =
    convDir === 'overworld_to_nether'
      ? Math.floor(numZ / 8)
      : Math.floor(numZ * 8);

  const netherHighwayY = 120; // Recommended ceiling highway height

  // Highway Calculation Math
  const getPointCoords = (pointId: string, isA: boolean) => {
    if (pointId === 'spawn') return { x: 0, z: 0, name: 'Спавн (0, 0)' };
    if (pointId === 'custom') {
      return {
        x: parseFloat(isA ? customAX : customBX) || 0,
        z: parseFloat(isA ? customAZ : customBZ) || 0,
        name: isA ? `Точка A (${customAX}, ${customAZ})` : `Точка B (${customBX}, ${customBZ})`,
      };
    }
    const evt = events.find((e) => e.id === pointId);
    if (evt && evt.coordinates) {
      return { x: evt.coordinates.x, z: evt.coordinates.z, name: evt.title };
    }
    return { x: 0, z: 0, name: 'Не выбрано' };
  };

  const ptA = getPointCoords(pointAId, true);
  const ptB = getPointCoords(pointBId || (eventsWithCoords[0]?.id ?? 'spawn'), false);

  const dxOverworld = ptB.x - ptA.x;
  const dzOverworld = ptB.z - ptA.z;
  const distOverworld = Math.round(Math.hypot(dxOverworld, dzOverworld));

  const dxNether = Math.round(dxOverworld / 8);
  const dzNether = Math.round(dzOverworld / 8);
  const distNether = Math.round(Math.hypot(dxNether, dzNether));

  // Compass Angle & Cardinal Direction
  const angleRad = Math.atan2(dzOverworld, dxOverworld);
  let angleDeg = Math.round((angleRad * 180) / Math.PI) + 90;
  if (angleDeg < 0) angleDeg += 360;

  const getCompassDirection = (deg: number) => {
    const dirs = ['Север (↑)', 'Северо-Восток (↗)', 'Восток (→)', 'Юго-Восток (↘)', 'Юг (↓)', 'Юго-Запад (↙)', 'Запад (←)', 'Северо-Запад (↖)'];
    const index = Math.round(deg / 45) % 8;
    return dirs[index];
  };

  const compassDir = getCompassDirection(angleDeg);

  // Travel Times (seconds)
  const timeWalkingSec = Math.round(distOverworld / 4.3);
  const timeElytraSec = Math.round(distOverworld / 30);
  const timeIceBoatNetherSec = Math.max(1, Math.round(distNether / 72));

  // Nearby Locations Sorted
  const userX = parseFloat(myF3X) || 0;
  const userZ = parseFloat(myF3Z) || 0;

  const nearbyLocations = eventsWithCoords
    .filter((e) => (e.coordinates?.dimension || 'overworld') === myDim)
    .map((e) => {
      const dx = e.coordinates!.x - userX;
      const dz = e.coordinates!.z - userZ;
      const dist = Math.round(Math.hypot(dx, dz));
      let ang = Math.round((Math.atan2(dz, dx) * 180) / Math.PI) + 90;
      if (ang < 0) ang += 360;
      return {
        event: e,
        distance: dist,
        direction: getCompassDirection(ang),
        angle: ang,
        dx,
        dz,
      };
    })
    .sort((a, b) => a.distance - b.distance);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#111111] border border-white/15 rounded-2xl shadow-2xl overflow-hidden text-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#161616] border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                Калькулятор Незера и Навигатор
              </h2>
              <p className="text-xs text-neutral-400">
                Связка порталов 8:1, расчёт тоннелей и поиск ближайших мест
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white border border-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-[#0d0d0d] px-5 pt-3 border-b border-white/10 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('convert')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'convert'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Порталы (8 : 1)</span>
          </button>

          <button
            onClick={() => setActiveTab('highway')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'highway'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Магистрали и тоннели</span>
          </button>

          <button
            onClick={() => setActiveTab('nearby')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'nearby'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Что рядом со мной (F3)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* TAB 1: PORTAL CONVERTER */}
          {activeTab === 'convert' && (
            <div className="space-y-5">
              {/* Preset Selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">
                  Выбрать локацию из истории сервера
                </label>
                <select
                  value={selectedPresetId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedPresetId(id);
                    if (id === 'spawn') {
                      setInputX('0');
                      setInputY('70');
                      setInputZ('0');
                      setConvDir('overworld_to_nether');
                    } else {
                      const evt = events.find((ev) => ev.id === id);
                      if (evt && evt.coordinates) {
                        setInputX(String(evt.coordinates.x));
                        setInputY(String(evt.coordinates.y ?? 70));
                        setInputZ(String(evt.coordinates.z));
                        if (evt.coordinates.dimension === 'nether') {
                          setConvDir('nether_to_overworld');
                        } else {
                          setConvDir('overworld_to_nether');
                        }
                      }
                    }
                  }}
                  className="w-full bg-[#181818] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="">-- Ввести свои координаты вручную --</option>
                  <option value="spawn">Спавн мира (X: 0, Z: 0)</option>
                  {eventsWithCoords.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.title} ({evt.coordinates?.dimension === 'nether' ? 'Незер' : 'Верхний мир'} • X: {evt.coordinates?.x}, Z: {evt.coordinates?.z})
                    </option>
                  ))}
                </select>
              </div>

              {/* Direction Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-xl border border-white/10 text-xs">
                <button
                  onClick={() => setConvDir('overworld_to_nether')}
                  className={`py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                    convDir === 'overworld_to_nether'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Верхний мир → Незер</span>
                </button>
                <button
                  onClick={() => setConvDir('nether_to_overworld')}
                  className={`py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                    convDir === 'nether_to_overworld'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Незер → Верхний мир</span>
                </button>
              </div>

              {/* Coordinates Inputs */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                  {convDir === 'overworld_to_nether' ? 'Координаты в Верхнем мире (F3)' : 'Координаты в Незере (F3)'}
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">X (Блок)</label>
                    <input
                      type="number"
                      value={inputX}
                      onChange={(e) => setInputX(e.target.value)}
                      className="w-full bg-[#181818] border border-white/15 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">Y (Высота)</label>
                    <input
                      type="number"
                      value={inputY}
                      onChange={(e) => setInputY(e.target.value)}
                      className="w-full bg-[#181818] border border-white/15 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">Z (Блок)</label>
                    <input
                      type="number"
                      value={inputZ}
                      onChange={(e) => setInputZ(e.target.value)}
                      className="w-full bg-[#181818] border border-white/15 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Result Card */}
              <div className="bg-gradient-to-br from-rose-500/10 via-black/40 to-black/60 border border-rose-500/30 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-rose-400" />
                    {convDir === 'overworld_to_nether' ? 'Точная точка портала в Незере' : 'Точная точка портала в Верхнем мире'}
                  </span>
                  <button
                    onClick={() =>
                      handleCopy(
                        `${convertedX} ${numY} ${convertedZ}`,
                        'result',
                        `X: ${convertedX}, Y: ${numY}, Z: ${convertedZ}`
                      )
                    }
                    className="inline-flex items-center gap-1 text-xs text-rose-300 hover:text-white px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 transition-colors"
                  >
                    {copiedKey === 'result' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Копировать</span>
                  </button>
                </div>

                <div className="flex items-baseline gap-4 my-2">
                  <span className="text-2xl sm:text-3xl font-mono font-black text-white">
                    X: <span className="text-rose-400">{convertedX}</span>, Z: <span className="text-rose-400">{convertedZ}</span>
                  </span>
                  <span className="text-xs font-mono text-neutral-400">
                    Y: ~{numY} (или под крышей Незера Y: {netherHighwayY})
                  </span>
                </div>

                <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                  💡 <strong>Совет для идеальной связки:</strong> Постройте портал ровно на этих координатах в{' '}
                  {convDir === 'overworld_to_nether' ? 'Незере' : 'Верхнем мире'}, чтобы порталы не путались и вели строго 1-в-1 без смещения.
                </p>

                {/* Direct BlueMap Link */}
                <a
                  href={`http://map.latzland.eu:29476/#${
                    convDir === 'overworld_to_nether' ? 'world_nether' : 'world'
                  }:${convertedX}:${numY}:${convertedZ}:50:1.61:0.78:0:0:perspective`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-200 hover:text-white transition-all"
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Посмотреть точку на BlueMap</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 2: HIGHWAY & TUNNEL PLANNER */}
          {activeTab === 'highway' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Point A */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2.5">
                  <label className="text-xs font-bold text-neutral-300 block">
                    📍 Точка отправления (Точка A)
                  </label>
                  <select
                    value={pointAId}
                    onChange={(e) => setPointAId(e.target.value)}
                    className="w-full bg-[#181818] border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="spawn">Спавн (X: 0, Z: 0)</option>
                    <option value="custom">Ручной ввод координат</option>
                    {eventsWithCoords.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.title} (X: {evt.coordinates?.x}, Z: {evt.coordinates?.z})
                      </option>
                    ))}
                  </select>

                  {pointAId === 'custom' && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <input
                        type="number"
                        placeholder="X"
                        value={customAX}
                        onChange={(e) => setCustomAX(e.target.value)}
                        className="bg-[#181818] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                      />
                      <input
                        type="number"
                        placeholder="Z"
                        value={customAZ}
                        onChange={(e) => setCustomAZ(e.target.value)}
                        className="bg-[#181818] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                      />
                    </div>
                  )}
                  <div className="text-[11px] font-mono text-neutral-400">
                    Координаты A: X: {ptA.x}, Z: {ptA.z}
                  </div>
                </div>

                {/* Point B */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2.5">
                  <label className="text-xs font-bold text-neutral-300 block">
                    🏁 Точка назначения (Точка B)
                  </label>
                  <select
                    value={pointBId}
                    onChange={(e) => setPointBId(e.target.value)}
                    className="w-full bg-[#181818] border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {eventsWithCoords.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.title} (X: {evt.coordinates?.x}, Z: {evt.coordinates?.z})
                      </option>
                    ))}
                    <option value="spawn">Спавн (X: 0, Z: 0)</option>
                    <option value="custom">Ручной ввод координат</option>
                  </select>

                  {pointBId === 'custom' && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <input
                        type="number"
                        placeholder="X"
                        value={customBX}
                        onChange={(e) => setCustomBX(e.target.value)}
                        className="bg-[#181818] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                      />
                      <input
                        type="number"
                        placeholder="Z"
                        value={customBZ}
                        onChange={(e) => setCustomBZ(e.target.value)}
                        className="bg-[#181818] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                      />
                    </div>
                  )}
                  <div className="text-[11px] font-mono text-neutral-400">
                    Координаты B: X: {ptB.x}, Z: {ptB.z}
                  </div>
                </div>
              </div>

              {/* Tunnel & Highway Stats */}
              <div className="bg-gradient-to-br from-emerald-500/10 via-black/40 to-black/60 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-emerald-400" />
                    Параметры маршрута и тоннеля
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    Направление: {compassDir} ({angleDeg}°)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                      Верхний мир
                    </span>
                    <span className="text-lg font-mono font-bold text-white">
                      {distOverworld} <span className="text-xs font-normal text-neutral-400">бл.</span>
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <span className="text-[10px] text-emerald-400 uppercase font-bold block">
                      Незер-магистраль
                    </span>
                    <span className="text-lg font-mono font-bold text-emerald-300">
                      {distNether} <span className="text-xs font-normal text-emerald-400/80">бл.</span>
                    </span>
                    <span className="text-[10px] text-emerald-400/70 block mt-0.5">В 8 раз ближе!</span>
                  </div>

                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-[10px] text-neutral-400 uppercase font-bold block flex items-center gap-1">
                      <Ship className="w-3 h-3 text-cyan-400" />
                      Лодка по льду (Незер)
                    </span>
                    <span className="text-lg font-mono font-bold text-cyan-300">
                      ~{timeIceBoatNetherSec} <span className="text-xs font-normal text-neutral-400">сек.</span>
                    </span>
                  </div>

                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-[10px] text-neutral-400 uppercase font-bold block flex items-center gap-1">
                      <Wind className="w-3 h-3 text-purple-400" />
                      Элитры (Верхний мир)
                    </span>
                    <span className="text-lg font-mono font-bold text-purple-300">
                      ~{timeElytraSec} <span className="text-xs font-normal text-neutral-400">сек.</span>
                    </span>
                  </div>
                </div>

                {/* Tunnel Mining coordinates in Nether */}
                <div className="p-3 bg-black/60 rounded-xl border border-white/10 text-xs font-mono space-y-1 text-neutral-300">
                  <div className="text-white font-bold mb-1">
                    ⛏️ Координаты для копания тоннеля в Незере (на высоте Y: 120):
                  </div>
                  <div>
                    Старт: X: <strong className="text-rose-400">{Math.floor(ptA.x / 8)}</strong>, Z:{' '}
                    <strong className="text-rose-400">{Math.floor(ptA.z / 8)}</strong>
                  </div>
                  <div>
                    Финиш: X: <strong className="text-rose-400">{Math.floor(ptB.x / 8)}</strong>, Z:{' '}
                    <strong className="text-rose-400">{Math.floor(ptB.z / 8)}</strong>
                  </div>
                  <div className="text-neutral-400 text-[11px] pt-1">
                    ΔX в Незере: {dxNether > 0 ? `+${dxNether}` : dxNether} бл. | ΔZ в Незере:{' '}
                    {dzNether > 0 ? `+${dzNether}` : dzNether} бл.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NEARBY RADAR (WHAT'S NEAR ME) */}
          {activeTab === 'nearby' && (
            <div className="space-y-4">
              {/* User Position Input */}
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    Введите ваши текущие координаты из Minecraft (клавиша F3)
                  </span>

                  {/* Dimension selector */}
                  <div className="flex items-center gap-1 text-xs">
                    <button
                      onClick={() => setMyDim('overworld')}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                        myDim === 'overworld'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'text-neutral-400'
                      }`}
                    >
                      Верхний мир
                    </button>
                    <button
                      onClick={() => setMyDim('nether')}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                        myDim === 'nether'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'text-neutral-400'
                      }`}
                    >
                      Незер
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">Ваш X (F3)</label>
                    <input
                      type="number"
                      value={myF3X}
                      onChange={(e) => setMyF3X(e.target.value)}
                      placeholder="0"
                      className="w-full bg-[#181818] border border-white/15 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">Ваш Z (F3)</label>
                    <input
                      type="number"
                      value={myF3Z}
                      onChange={(e) => setMyF3Z(e.target.value)}
                      placeholder="0"
                      className="w-full bg-[#181818] border border-white/15 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sorted Nearby Locations */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                  <span>Ближайшие исторические места ({nearbyLocations.length})</span>
                  <span>Сортировка по расстоянию</span>
                </div>

                {nearbyLocations.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-500">
                    В этом измерении нет сохранённых мест с координатами.
                  </div>
                ) : (
                  nearbyLocations.map(({ event, distance, direction, angle, dx, dz }) => (
                    <div
                      key={event.id}
                      className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                            {event.title}
                          </h4>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-neutral-300 font-mono">
                            {event.season ? `С${event.season}` : 'Событие'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-400 mt-1">
                          <span className="text-emerald-400">
                            X: {event.coordinates?.x}, Z: {event.coordinates?.z}
                          </span>
                          <span>•</span>
                          <span className="text-neutral-300">
                            Смещение: ΔX: {dx > 0 ? `+${dx}` : dx}, ΔZ: {dz > 0 ? `+${dz}` : dz}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-xs font-bold text-cyan-400 font-mono">
                            {distance} блоков
                          </div>
                          <div className="text-[11px] text-neutral-400 font-medium">
                            {direction} ({angle}°)
                          </div>
                        </div>

                        <a
                          href={`http://map.latzland.eu:29476/#${
                            myDim === 'nether' ? 'world_nether' : 'world'
                          }:${event.coordinates?.x}:${event.coordinates?.y ?? 70}:${event.coordinates?.z}:50:1.61:0.78:0:0:perspective`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white border border-white/10 transition-colors"
                          title="Открыть на BlueMap"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
