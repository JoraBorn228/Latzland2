import React, { useRef, useEffect, useState } from 'react';
import {
  Search,
  X,
  Star,
  ArrowDownUp,
  ChevronsDown,
  ChevronsUp,
  LayoutGrid,
  Compass,
  GitBranch,
  Layers,
  List,
  Rows,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Calendar,
  Check,
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
  onOpenWorldMap,
  selectedBranch = 'all',
  setSelectedBranch,
  availableBranches = [],
  viewMode = 'detailed',
  setViewMode,
  searchInputRef,
}) => {
  const localSearchInputRef = useRef<HTMLInputElement>(null);
  const inputRef = searchInputRef || localSearchInputRef;
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Compute counts per category
  const categoryCounts = events.reduce((acc, ev) => {
    acc[ev.type] = (acc[ev.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Check how many secondary filters are active
  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    activeType !== 'all' ||
    selectedSeason !== 'all' ||
    selectedBranch !== 'all' ||
    onlyImportant;

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
  const quickSearchTags = ['Спавн', 'Эндер', 'Метро', 'Война', 'Арена'];

  return (
    <div className="space-y-3 mb-6" id="timeline-controls-panel">
      {/* ── Tier 1: Search & Core Action Toolbar ── */}
      <div className="bg-[#141414] border border-white/10 rounded-2xl p-2.5 sm:p-3.5 shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          {/* Search input with result indicator */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по событиям, игрокам, локациям, тегам…"
              className="w-full bg-[#1c1c1c] hover:bg-[#202020] border border-white/15 focus:border-[#00e676] rounded-xl pl-10 pr-24 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-[#00e676]/40 transition-all"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
                  title="Очистить поисковый запрос"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 bg-white/5 border border-white/10 rounded">
                  /
                </kbd>
              )}
              <span className="text-[11px] font-mono text-neutral-400 border-l border-white/10 pl-2">
                {totalResultsCount}
              </span>
            </div>
          </div>

          {/* Quick Tools & Toggles Group */}
          <div className="flex items-center justify-start sm:justify-end gap-1.5 flex-wrap">
            {/* Important Events Toggle */}
            <button
              type="button"
              onClick={() => setOnlyImportant(!onlyImportant)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border text-xs font-medium transition-all select-none ${
                onlyImportant
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                  : 'bg-[#1c1c1c] hover:bg-white/10 border-white/10 text-neutral-400 hover:text-white'
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
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-[#1c1c1c] hover:bg-white/10 border border-white/10 text-xs text-neutral-300 hover:text-white transition-all whitespace-nowrap"
              title={sortOrder === 'desc' ? 'Сортировка: сначала новые' : 'Сортировка: сначала старые'}
            >
              <ArrowDownUp className="w-3.5 h-3.5 text-[#00e676]" />
              <span>
                {sortOrder === 'desc' ? 'Новые' : 'Старые'}
              </span>
            </button>

            {/* View Mode Switcher (Detailed vs Compact List) */}
            {setViewMode && (
              <div className="flex items-center bg-[#1c1c1c] border border-white/10 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('detailed')}
                  className={`p-1.5 sm:p-2 rounded-lg text-xs transition-all ${
                    viewMode === 'detailed'
                      ? 'bg-[#00e676]/20 text-[#00e676] font-semibold shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Подробный вид карточек"
                >
                  <Rows className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('compact')}
                  className={`p-1.5 sm:p-2 rounded-lg text-xs transition-all ${
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
              <div className="flex items-center bg-[#1c1c1c] border border-white/10 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={onExpandAll}
                  className={`p-1.5 sm:p-2 rounded-lg text-xs transition-colors ${
                    allExpandedState === true
                      ? 'bg-white/20 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Развернуть все карточки"
                >
                  <ChevronsDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onCollapseAll}
                  className={`p-1.5 sm:p-2 rounded-lg text-xs transition-colors ${
                    allExpandedState === false
                      ? 'bg-white/20 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Свернуть все карточки"
                >
                  <ChevronsUp className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Tier 2: Season & Storyline Branch Selectors ── */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            {/* Season Pills Selector */}
            {availableSeasons.length > 0 && (
              <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-0.5 scrollbar-none">
                <span className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1 mr-1 shrink-0">
                  <Calendar className="w-3 h-3 text-[#00e676]" />
                  <span>Сезон:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedSeason('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                    selectedSeason === 'all'
                      ? 'bg-[#00e676] text-black shadow-sm'
                      : 'bg-[#1c1c1c] hover:bg-white/10 text-neutral-400 hover:text-white border border-white/5'
                  }`}
                >
                  Все
                </button>
                {availableSeasons.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSeason(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                      selectedSeason === s
                        ? 'bg-[#00e676] text-black shadow-sm'
                        : 'bg-[#1c1c1c] hover:bg-white/10 text-neutral-400 hover:text-white border border-white/5'
                    }`}
                  >
                    Сезон {s}
                  </button>
                ))}
              </div>
            )}

            {/* Storyline Branch Dropdown */}
            {availableBranches.length > 0 && setSelectedBranch && (
              <div className="flex items-center gap-1.5 bg-[#1c1c1c] border border-white/10 rounded-xl px-2.5 py-1 text-xs w-full sm:w-auto justify-between sm:justify-start">
                <div className="flex items-center gap-1.5 min-w-0">
                  <GitBranch className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="bg-transparent text-xs text-neutral-200 focus:outline-none cursor-pointer max-w-full truncate"
                  >
                    <option value="all" className="bg-[#1c1c1c] text-white">Все ветки сюжета</option>
                    {availableBranches.map((b) => (
                      <option key={b} value={b} className="bg-[#1c1c1c] text-white">
                        Ветка: {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Quick Search Tag Suggestions */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-neutral-400">
            <span className="text-neutral-500">Быстрый поиск:</span>
            {quickSearchTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSearchQuery(tag)}
                className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 hover:text-white text-neutral-400 transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tier 3: Category Rail (Horizontal Scrolling with visual counters) ── */}
      <div className="relative">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none text-xs -mx-1 px-1">
          {/* All category pill */}
          <button
            type="button"
            onClick={() => setActiveType('all')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border transition-all whitespace-nowrap shrink-0 shadow-sm ${
              activeType === 'all'
                ? 'bg-[#00e676]/20 border-[#00e676] text-[#00e676] font-bold shadow-[0_0_12px_rgba(0,230,118,0.25)]'
                : 'bg-[#141414] border-white/10 text-neutral-400 hover:text-white hover:bg-[#1c1c1c]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Все категории</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 font-mono">
              {events.length}
            </span>
          </button>

          {/* Individual Category Pills */}
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
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'font-bold shadow-md'
                    : 'bg-[#141414] border-white/10 text-neutral-400 hover:text-white hover:bg-[#1c1c1c]'
                }`}
                style={{
                  borderColor: isActive ? cfg.color : undefined,
                  backgroundColor: isActive ? cfg.badgeBg : undefined,
                  color: isActive ? cfg.color : undefined,
                  boxShadow: isActive ? `0 0 14px ${cfg.color}33` : undefined,
                }}
              >
                <IconComponent className="w-3.5 h-3.5" />
                <span>{cfg.label}</span>
                {count > 0 && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-mono"
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

      {/* ── Tier 4: Active Filters Chips Bar with 1-click removal ── */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-950/40 border border-[#00e676]/30 text-xs text-neutral-200 animate-in fade-in">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-[#00e676] mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Фильтры:</span>
            </span>

            {/* Search query chip */}
            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-white">
                <Search className="w-3 h-3 text-neutral-400" />
                <span className="font-mono">«{searchQuery}»</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="hover:text-red-400 ml-1"
                  title="Удалить фильтр поиска"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Category chip */}
            {activeType !== 'all' && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-semibold"
                style={{
                  backgroundColor: EVENT_CATEGORIES[activeType]?.badgeBg,
                  borderColor: EVENT_CATEGORIES[activeType]?.color,
                  color: EVENT_CATEGORIES[activeType]?.color,
                }}
              >
                <span>{EVENT_CATEGORIES[activeType]?.label}</span>
                <button
                  type="button"
                  onClick={() => setActiveType('all')}
                  className="hover:opacity-75 ml-1"
                  title="Сбросить категорию"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Season chip */}
            {selectedSeason !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00e676]/15 border border-[#00e676]/40 text-[#00e676] font-semibold">
                <span>Сезон {selectedSeason}</span>
                <button
                  type="button"
                  onClick={() => setSelectedSeason('all')}
                  className="hover:opacity-75 ml-1"
                  title="Сбросить сезон"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Branch chip */}
            {selectedBranch !== 'all' && setSelectedBranch && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/40 text-indigo-300 font-semibold">
                <span>Ветка: {selectedBranch}</span>
                <button
                  type="button"
                  onClick={() => setSelectedBranch('all')}
                  className="hover:opacity-75 ml-1"
                  title="Сбросить ветку"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Important chip */}
            {onlyImportant && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 font-semibold">
                <Star className="w-3 h-3 fill-amber-300" />
                <span>Только важные</span>
                <button
                  type="button"
                  onClick={() => setOnlyImportant(false)}
                  className="hover:opacity-75 ml-1"
                  title="Показать все события"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {/* Reset All Filters Button */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white font-semibold transition-all whitespace-nowrap ml-auto"
            title="Сбросить все активные фильтры"
          >
            <RotateCcw className="w-3 h-3 text-[#00e676]" />
            <span>Сбросить всё ({totalResultsCount})</span>
          </button>
        </div>
      )}
    </div>
  );
};

