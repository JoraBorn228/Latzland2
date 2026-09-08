import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Upload,
  RotateCcw,
  LogOut,
  Sparkles,
  Database,
  Pencil,
  Trash2,
  Users,
  X,
  Activity,
} from 'lucide-react';
import { LatzEvent } from '../types';
import { getLocalStorageUsage } from '../utils/imageUtils';

interface AdminBarProps {
  events: LatzEvent[];
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  onOpenPlayersModal: () => void;
  onOpenVisitorAnalytics: () => void;
  onResetToDefault: () => void;
  onExitAdmin: () => void;
}

export const AdminBar: React.FC<AdminBarProps> = ({
  events,
  onOpenAddModal,
  onOpenImportModal,
  onOpenPlayersModal,
  onOpenVisitorAnalytics,
  onResetToDefault,
  onExitAdmin,
}) => {
  const [storageInfo, setStorageInfo] = useState(() => getLocalStorageUsage());
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setStorageInfo(getLocalStorageUsage());
  }, [events]);

  const handleReset = () => {
    onResetToDefault();
    setShowResetConfirm(false);
  };

  return (
    <div className="mb-6 p-3 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs shadow-lg animate-fadeIn">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Left: Info badge & stats */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shrink-0">
            <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white tracking-tight">
                Панель администратора
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-400 text-black">
                ADMIN
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-300">
                <Database className="w-2.5 h-2.5 text-amber-400" />
                <span>{storageInfo.formattedUsed} / 5 МБ</span>
              </span>
            </div>
            <p className="text-[11px] text-amber-200/70">
              Режим управления: редактирование хроник, аналитика сайта и база игроков
            </p>
          </div>
        </div>

        {/* Right: Quick actions */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#00e676] hover:bg-[#00c853] text-black font-semibold text-xs transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Добавить</span>
          </button>

          <button
            onClick={onOpenVisitorAnalytics}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 font-medium text-xs border border-purple-500/30 transition-colors shadow-sm"
            title="Аналитика посещений сайта (только для администратора)"
          >
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            <span>Аналитика сайта</span>
          </button>

          <button
            onClick={onOpenPlayersModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 font-medium text-xs border border-cyan-500/30 transition-colors"
            title="База игроков сервера: управление никами, ролями и описаниями"
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>База игроков</span>
          </button>

          <button
            onClick={onOpenImportModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-xs border border-white/10 transition-colors"
            title="Загрузить JSON с событиями"
          >
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            <span>Импорт</span>
          </button>

          {showResetConfirm ? (
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-red-950/80 border border-red-500/40 animate-fadeIn">
              <span className="text-[11px] text-red-200 font-medium px-1">
                Сбросить всё?
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold transition-colors"
              >
                Да
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="p-1 rounded text-neutral-400 hover:text-white transition-colors"
                title="Отмена"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-neutral-400 hover:text-red-300 hover:bg-red-500/15 border border-transparent hover:border-red-500/30 transition-colors"
              title="Сбросить все события к стандартным"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Сброс</span>
            </button>
          )}

          <button
            onClick={onExitAdmin}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium text-xs border border-amber-500/40 ml-auto md:ml-0 transition-colors"
            title="Выйти из режима администратора"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Выйти</span>
          </button>
        </div>
      </div>
    </div>
  );
};
