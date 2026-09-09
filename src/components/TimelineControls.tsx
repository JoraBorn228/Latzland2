import React, { useRef, useEffect, useState } from 'react';
import {
  Search,
  X,
  Star,
  ArrowDownUp,
  ChevronsDown,
  ChevronsUp,
  LayoutGrid,
  GitBranch,
  List,
  Rows,
  RotateCcw,
  SlidersHorizontal,
  Calendar,
  Filter,
} from 'lucide-react';
import { EventType, EVENT_CATEGORIES, LatzEvent, TimelineViewMode } from '../types';

interface TimelineControlsProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeType: EventType | 'all';
  setActiveType: (type: EventType | 'all') => void;
  selectedSeason: number | 'all';
  setSelectedSeason: (season: number | 'all') => void;
  availableSeasons: number[];
  onlyImportant: boolean;
  setOnlyImportant: (val: boolean) => void;
  sortOrder: 'desc' | 'asc';
  setSortOrder: (order: 'desc' | 'asc') => void;
  events: LatzEvent[];
  filteredCount?: number;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  allExpandedState: boolean | null;
  onOpenWorldMap?: () => void;
  selectedBranch?: string | 'all';
  setSelectedBranch?: (branch: string | 'all') => void;
  availableBranches?: string[];
  viewMode?: TimelineViewMode;
  setViewMode?: (mode: TimelineViewMode) => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  searchQuery,
  setSearchQuery,
  activeType,
  setActiveType,
  selectedSeason,
  setSelectedSeason,
  availableSeasons,
  onlyImportant,
  setOnlyImportant,
  sortOrder,
  setSortOrder,
  events,
  filteredCount,
  onExpandAll,
  onCollapseAll,
  allExpandedState,
  selectedBranch = 'all',
  setSelectedBranch,
  availableBranches = [],
  viewMode = 'detailed',
  setViewMode,
  searchInputRef,
}) => {
  const localSearchInputRef = useRef<HTMLInputElement>(null);
  const inputRef = searchInputRef || localSearchInputRef;
  const [showQuickTags, setShowQuickTags] = useState(false);

  // Compute counts per category
  const categoryCounts = events.reduce((acc, ev) => {
    acc[ev.type] = (acc[ev.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Count active secondary filters
  const activeFiltersList: { id: string; label: string; onClear: () => void; color?: string }[] = [];

  if (searchQuery.trim()) {
    activeFiltersList.push({
      id: 'search',
      label: `«${searchQuery.trim()}»`,
      onClear: () => setSearchQuery(''),
    });
  }
  if (activeType !== 'all') {
    activeFiltersList.push({
      id: 'type',
      label: EVENT_CATEGORIES[activeType]?.label || activeType,
      color: EVENT_CATEGORIES[activeType]?.color,
      onClear: () => setActiveType('all'),
    });
  }
  if (selectedSeason !== 'all') {
    activeFiltersList.push({
      id: 'season',
      label: `Сезон ${selectedSeason}`,
      color: '#00e676',
      onClear: () => setSelectedSeason('all'),
    });
  }
  if (selectedBranch !== 'all' && setSelectedBranch) {
    activeFiltersList.push({
      id: 'branch',
      label: `Ветка: ${selectedBranch}`,
      color: '#c084fc',
      onClear: () => setSelectedBranch('all'),
    });
  }
  if (onlyImportant) {
    activeFiltersList.push({
      id: 'important',
      label: 'Только важные',
      color: '#fbbf24',
      onClear: () => setOnlyImportant(false),
    });
  }

  const hasActiveFilters = activeFiltersList.length > 0;
  const totalResultsCount = filteredCount !== undefined ? filteredCount : events.length;

  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveType('all');
    setSelectedSeason('all');
    if (setSelectedBranch) setSelectedBranch('all');
    setOnlyImportant(false);
  };

  // Keyboard shortcut '/' or 'Ctrl+K' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }
      if (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputRef]);

  // Quick popular search tags
  const quickSearchTags = ['Спавн', 'Эндер', 'Метро', 'Война', 'Арена', 'Суд', 'Вайп'];

  return (
    <div
      className="sticky top-[56px] sm:top-[64px] z-20 space-y-2 mb-6 transition-all duration-300"
      id="timeline-controls-panel"
    >
      {/* ── Ergonomic Glass Control Dock ── */}
      <div className="relative bg-[#090d14]/92 backdrop-blur-xl border border-white/12 rounded-2xl p-2.5 sm:p-3.5 shadow-[0_10px_32px_rgba(0,0,0,0.65)] overflow-hidden space-y-2.5 transition-all">
        {/* Top subtle neon sheen line */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(0,230,118,0.5) 20%, rgba(0,210,255,0.6) 50%, rgba(192,132,252,0.5) 80%, transparent 100%)',
          }}
        />

        {/* ── Tier 1: Search & Ergonomic Quick Tools Toolbar ── */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
          {/* Search input with keyboard shortcut and result counter */}
          <div className="relative flex-1 group/search">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within/search:text-[#00e676] transition-colors pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по событиям, игрокам, локациям, тегам…"
              className="w-full bg-[#06080d]/90 hover:bg-[#0b0f17] focus:bg-[#0c111a] border border-white/15 focus:border-[#00e676] rounded-xl pl-10 pr-24 py-2 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#00e676]/25 shadow-inner transition-all"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
                  title="Очистить поиск"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 bg-white/5 border border-white/10 rounded">
                  /
                </kbd>
              )}
              <span className="text-[11px] font-mono text-emerald-400 font-bold border-l border-white/15 pl-2 leading-none" title="Количество найденных событий">
                {totalResultsCount}
              </span>
            </div>
          </div>

          {/* Quick Action Toggles Cluster */}
          <div className="flex items-center justify-between md:justify-end gap-1.5 flex-wrap">
            {/* Important Events Toggle */}
            <button
              type="button"
              onClick={() => setOnlyImportant(!onlyImportant)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all select-none ${
                onlyImportant
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                  : 'bg-[#0d121a]/90 hover:bg-white/10 border-white/10 text-neutral-400 hover:text-white'
              }`}
              title="Показывать только ключевые и важные вехи"
            >
              <Star className={`w-3.5 h-3.5 ${onlyImportant ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>Важные</span>
            </button>

            {/* Sort Order Toggle */}
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0d121a]/90 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 hover:text-white transition-all whitespace-nowrap"
              title={sortOrder === 'desc' ? 'Сортировка: сначала новые' : 'Сортировка: сначала старые'}
            >
              <ArrowDownUp className="w-3.5 h-3.5 text-[#00e676]" />
              <span className="hidden sm:inline">
                {sortOrder === 'desc' ? 'Новые' : 'Старые'}
              </span>
              <span className="sm:hidden">
                {sortOrder === 'desc' ? 'Новые' : 'Старые'}
              </span>
            </button>

            {/* Storyline Branch Selector (if branches exist) */}
            {availableBranches.length > 0 && setSelectedBranch && (
              <div className="relative flex items-center bg-[#0d121a]/90 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs">
                <GitBranch className="w-3.5 h-3.5 text-purple-400 mr-1.5 shrink-0" />
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="bg-transparent text-xs text-neutral-200 focus:outline-none cursor-pointer max-w-[110px] sm:max-w-[140px] truncate"
                  title="Фильтр по сюжетным веткам"
                >
                  <option value="all" className="bg-[#080b10] text-white">Все ветки</option>
                  {availableBranches.map((b) => (
                    <option key={b} value={b} className="bg-[#080b10] text-white">
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* View Mode Switcher (Detailed vs Compact) */}
            {setViewMode && (
              <div className="flex items-center bg-[#06080d] border border-white/10 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('detailed')}
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    viewMode === 'detailed'
                      ? 'bg-[#00e676]/20 text-[#00e676] font-semibold shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Подробный вид"
                >
                  <Rows className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('compact')}
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    viewMode === 'compact'
                      ? 'bg-[#00e676]/20 text-[#00e676] font-semibold shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Компактный список"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Expand / Collapse All (Detailed mode) */}
            {viewMode === 'detailed' && (
              <div className="flex items-center bg-[#06080d] border border-white/10 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={onExpandAll}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    allExpandedState === true
                      ? 'bg-white/20 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Развернуть все"
                >
                  <ChevronsDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onCollapseAll}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    allExpandedState === false
                      ? 'bg-white/20 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Свернуть все"
                >
                  <ChevronsUp className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Tags Toggle */}
            <button
              type="button"
              onClick={() => setShowQuickTags(!showQuickTags)}
              className={`p-1.5 rounded-xl border text-xs transition-colors ${
                showQuickTags
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                  : 'bg-[#0d121a]/90 hover:bg-white/10 border-white/10 text-neutral-400 hover:text-white'
              }`}
              title="Быстрые теги"
            >
              <Filter className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── Tier 2: Category Filters (Full visibility & easy clickability) ── */}
        <div className="pt-2 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-semibold">
              <Filter className="w-3.5 h-3.5 text-[#00e676]" />
              <span>Категории событий:</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Native category select dropdown for mobile convenience */}
              <select
                value={activeType}
                onChange={(e) => setActiveType(e.target.value as EventType | 'all')}
                className="text-xs bg-[#0b0f17] border border-white/15 rounded-lg px-2 py-1 text-neutral-300 focus:outline-none focus:border-[#00e676] cursor-pointer sm:hidden"
                title="Быстрый выбор категории"
              >
                <option value="all">Все категории ({events.length})</option>
                {(Object.keys(EVENT_CATEGORIES) as EventType[]).map((type) => (
                  <option key={type} value={type}>
                    {EVENT_CATEGORIES[type].label} ({categoryCounts[type] || 0})
                  </option>
                ))}
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-[11px] font-semibold transition-all active:scale-95"
                  title="Сбросить все активные фильтры"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden sm:inline">Сбросить всё</span>
                  <span className="font-mono text-[10px] bg-red-500/30 px-1 rounded">
                    {activeFiltersList.length}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Category Pills - Wrapping so all 10 buttons are always visible and clickable */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
            {/* All Categories Pill */}
            <button
              type="button"
              onClick={() => setActiveType('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all shrink-0 cursor-pointer active:scale-95 ${
                activeType === 'all'
                  ? 'bg-[#00e676]/20 border-[#00e676] text-[#00e676] font-bold shadow-[0_0_12px_rgba(0,230,118,0.3)]'
                  : 'bg-[#06080d]/90 border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Все</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/10 font-mono font-bold">
                {events.length}
              </span>
            </button>

            {/* Category Pills */}
            {(Object.keys(EVENT_CATEGORIES) as EventType[]).map((type) => {
              const cfg = EVENT_CATEGORIES[type];
              const IconComponent = cfg.icon;
              const count = categoryCounts[type] || 0;
              const isActive = activeType === type;

              return (
                <button
                  type="button"
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border transition-all shrink-0 cursor-pointer active:scale-95 ${
                    isActive
                      ? 'font-bold shadow-md'
                      : 'bg-[#06080d]/90 border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 hover:border-white/20'
                  }`}
                  style={{
                    borderColor: isActive ? cfg.color : undefined,
                    backgroundColor: isActive ? cfg.badgeBg : undefined,
                    color: isActive ? cfg.color : undefined,
                    boxShadow: isActive ? `0 0 12px ${cfg.color}40` : undefined,
                  }}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                  <span>{cfg.label}</span>
                  {count > 0 && (
                    <span
                      className="text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold"
                      style={{
                        backgroundColor: isActive
                          ? 'rgba(255,255,255,0.25)'
                          : 'rgba(255,255,255,0.08)',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tier 3: Seasons Filter (Distinct dedicated row, 100% visible & clickable) ── */}
        {availableSeasons.length > 0 && (
          <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-1.5 text-xs">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-400 mr-1 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-[#00e676]" />
              <span>Сезон:</span>
            </div>

            <button
              type="button"
              onClick={() => setSelectedSeason('all')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer active:scale-95 ${
                selectedSeason === 'all'
                  ? 'bg-[#00e676] text-black font-bold shadow-[0_0_12px_rgba(0,230,118,0.4)] border border-[#00e676]'
                  : 'bg-[#06080d]/90 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 hover:border-white/20'
              }`}
            >
              Все сезоны
            </button>

            {availableSeasons.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSeason(s)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer active:scale-95 ${
                  selectedSeason === s
                    ? 'bg-[#00e676] text-black font-bold shadow-[0_0_12px_rgba(0,230,118,0.4)] border border-[#00e676]'
                    : 'bg-[#06080d]/90 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 hover:border-white/20'
                }`}
              >
                Сезон {s}
              </button>
            ))}
          </div>
        )}

        {/* ── Optional Collapsible Quick Tags Ribbon ── */}
        {showQuickTags && (
          <div className="pt-2 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto text-[11px] text-neutral-400 animate-in fade-in slide-in-from-top-1">
            <span className="text-neutral-500 shrink-0">Быстрые теги:</span>
            {quickSearchTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSearchQuery(tag)}
                className={`px-2 py-0.5 rounded-md transition-colors shrink-0 ${
                  searchQuery.toLowerCase() === tag.toLowerCase()
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-white/5 hover:bg-white/10 hover:text-emerald-300 text-neutral-400'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Compact Active Filter Chips Strip (only if active) ── */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-2 rounded-xl bg-emerald-950/30 border border-[#00e676]/20 text-xs text-neutral-200 animate-in fade-in">
          <span className="text-[11px] font-semibold text-[#00e676] mr-1 flex items-center gap-1 shrink-0">
            <SlidersHorizontal className="w-3 h-3" />
            <span>Активно:</span>
          </span>

          {activeFiltersList.map((filter) => (
            <span
              key={filter.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/10 border border-white/10 text-white text-[11px] shrink-0"
              style={{
                borderColor: filter.color ? `${filter.color}50` : undefined,
                color: filter.color || '#fff',
              }}
            >
              <span className="max-w-[130px] truncate">{filter.label}</span>
              <button
                type="button"
                onClick={filter.onClear}
                className="hover:text-red-400 ml-0.5"
                title={`Удалить фильтр ${filter.label}`}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}

          <button
            type="button"
            onClick={handleResetFilters}
            className="ml-auto shrink-0 text-[11px] text-neutral-400 hover:text-white underline pl-2"
          >
            Сбросить всё
          </button>
        </div>
      )}
    </div>
  );
};
