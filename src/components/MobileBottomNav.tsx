import React from 'react';
import {
  Clock,
  Hammer,
  Plus,
  Send,
  Compass,
  User,
  Inbox,
} from 'lucide-react';
import { getMinecraftHeadUrl } from '../utils/playerUtils';

interface MobileBottomNavProps {
  isAdmin: boolean;
  activePlayerNick?: string | null;
  pendingProposalsCount?: number;
  onOpenTimeline: () => void;
  onOpenProjects: () => void;
  onOpenWorldMap: () => void;
  onOpenCabinet: () => void;
  onOpenAddModal: () => void;
  onOpenModeration?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  isAdmin,
  activePlayerNick,
  pendingProposalsCount = 0,
  onOpenTimeline,
  onOpenProjects,
  onOpenWorldMap,
  onOpenCabinet,
  onOpenAddModal,
  onOpenModeration,
}) => {
  return (
    <div
      id="mobile-bottom-navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0c0c]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 pb-safe flex items-center justify-around shadow-[0_-8px_24px_rgba(0,0,0,0.6)]"
      style={{ paddingBottom: 'calc(0.375rem + env(safe-area-inset-bottom, 0px))' }}
    >
      {/* 1. Timeline Tab */}
      <button
        type="button"
        onClick={onOpenTimeline}
        className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-neutral-400 hover:text-[#00e676] active:scale-95 transition-all"
        title="Хроника событий"
      >
        <Clock className="w-5 h-5 mb-0.5 text-neutral-300" />
        <span className="text-[10px] font-semibold tracking-tight">Хроника</span>
      </button>

      {/* 2. Projects Catalog Tab */}
      <button
        type="button"
        onClick={onOpenProjects}
        className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-neutral-400 hover:text-teal-400 active:scale-95 transition-all"
        title="Каталог мега-строек"
      >
        <Hammer className="w-5 h-5 mb-0.5 text-neutral-300" />
        <span className="text-[10px] font-semibold tracking-tight">Стройки</span>
      </button>

      {/* 3. Central Prominent Action Button: Add / Propose */}
      <div className="flex-1 flex items-center justify-center px-1">
        <button
          type="button"
          onClick={onOpenAddModal}
          className={`w-11 h-11 -mt-4 rounded-2xl flex items-center justify-center shadow-lg border active:scale-90 transition-all ${
            isAdmin
              ? 'bg-[#00e676] text-black border-[#00e676]/50 shadow-[0_0_18px_rgba(0,230,118,0.5)]'
              : 'bg-emerald-500 text-black border-emerald-400/50 shadow-[0_0_18px_rgba(16,185,129,0.4)]'
          }`}
          title={isAdmin ? 'Добавить событие' : 'Предложить событие'}
        >
          {isAdmin ? (
            <Plus className="w-6 h-6 stroke-[2.8]" />
          ) : (
            <Send className="w-5 h-5 -ml-0.5" />
          )}
        </button>
      </div>

      {/* 4. 2D World Map Tab */}
      <button
        type="button"
        onClick={onOpenWorldMap}
        className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-neutral-400 hover:text-emerald-400 active:scale-95 transition-all"
        title="2D-карта мира"
      >
        <Compass className="w-5 h-5 mb-0.5 text-neutral-300" />
        <span className="text-[10px] font-semibold tracking-tight">Карта</span>
      </button>

      {/* 5. Player Cabinet / Moderation if Admin */}
      {isAdmin && onOpenModeration && pendingProposalsCount > 0 ? (
        <button
          type="button"
          onClick={onOpenModeration}
          className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-amber-400 relative active:scale-95 transition-all"
          title="Очередь предложки"
        >
          <div className="relative">
            <Inbox className="w-5 h-5 mb-0.5 text-amber-400" />
            <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-amber-400 text-black text-[9px] font-black flex items-center justify-center">
              {pendingProposalsCount}
            </span>
          </div>
          <span className="text-[10px] font-bold text-amber-300">Заявки</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onOpenCabinet}
          className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-neutral-400 hover:text-cyan-300 active:scale-95 transition-all"
          title="Личный кабинет игрока"
        >
          {activePlayerNick ? (
            <img
              src={getMinecraftHeadUrl(activePlayerNick, 20)}
              alt={activePlayerNick}
              className="w-5 h-5 rounded-md mb-0.5 image-render-pixelated border border-cyan-400/40"
            />
          ) : (
            <User className="w-5 h-5 mb-0.5 text-cyan-400" />
          )}
          <span className="text-[10px] font-semibold tracking-tight text-cyan-200/90 truncate max-w-[56px]">
            {activePlayerNick ? activePlayerNick : 'Кабинет'}
          </span>
        </button>
      )}
    </div>
  );
};
