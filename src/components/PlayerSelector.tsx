import React, { useState } from 'react';
import { User, Plus, X, Search, Check, Users } from 'lucide-react';
import { PlayerProfile } from '../types';
import { PlayerAvatar } from './PlayerAvatar';

interface PlayerSelectorProps {
  selectedPlayers: string[];
  onChange: (players: string[]) => void;
  availablePlayers: PlayerProfile[];
  onAddNewPlayerToDb?: (newPlayer: PlayerProfile) => void;
  onOpenPlayerManager?: () => void;
}

export const PlayerSelector: React.FC<PlayerSelectorProps> = ({
  selectedPlayers,
  onChange,
  availablePlayers,
  onAddNewPlayerToDb,
  onOpenPlayerManager,
}) => {
  const [filterText, setFilterText] = useState('');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [newNick, setNewNick] = useState('');
  const [newRole, setNewRole] = useState('');

  const togglePlayer = (username: string) => {
    if (selectedPlayers.includes(username)) {
      onChange(selectedPlayers.filter((p) => p !== username));
    } else {
      onChange([...selectedPlayers, username]);
    }
  };

  const removePlayer = (username: string) => {
    onChange(selectedPlayers.filter((p) => p !== username));
  };

  const filteredPlayers = availablePlayers.filter((p) =>
    p.username.toLowerCase().includes(filterText.toLowerCase()) ||
    (p.role && p.role.toLowerCase().includes(filterText.toLowerCase()))
  );

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNick = newNick.trim();
    if (!cleanNick) return;

    // Check if already in db
    const existing = availablePlayers.find(
      (p) => p.username.toLowerCase() === cleanNick.toLowerCase()
    );

    if (!existing && onAddNewPlayerToDb) {
      const newPlayer: PlayerProfile = {
        id: cleanNick.toLowerCase(),
        username: cleanNick,
        role: newRole.trim() || undefined,
      };
      onAddNewPlayerToDb(newPlayer);
    }

    if (!selectedPlayers.includes(cleanNick)) {
      onChange([...selectedPlayers, cleanNick]);
    }

    setNewNick('');
    setNewRole('');
    setIsQuickAddOpen(false);
  };

  return (
    <div className="space-y-2 p-3 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 font-medium text-xs text-neutral-300">
          <Users className="w-3.5 h-3.5 text-blue-400" />
          <span>Участники события</span>
          {selectedPlayers.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-400">
              {selectedPlayers.length}
            </span>
          )}
        </label>

        <div className="flex items-center gap-2">
          {onOpenPlayerManager && (
            <button
              type="button"
              onClick={onOpenPlayerManager}
              className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 hover:underline"
            >
              <span>База игроков ({availablePlayers.length})</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
          >
            <Plus className="w-3 h-3" />
            <span>{isQuickAddOpen ? 'Отмена' : 'Новый игрок'}</span>
          </button>
        </div>
      </div>

      {/* Selected players chips */}
      {selectedPlayers.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedPlayers.map((nick) => {
            const playerInfo = availablePlayers.find(
              (p) => p.username.toLowerCase() === nick.toLowerCase()
            );

            return (
              <span
                key={nick}
                className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-lg bg-[#222] border border-white/15 text-xs text-neutral-200 group"
              >
                <PlayerAvatar username={nick} size={18} />
                <span className="font-medium text-white">{nick}</span>
                {playerInfo?.role && (
                  <span className="text-[10px] text-neutral-400 font-normal">
                    • {playerInfo.role}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removePlayer(nick)}
                  className="p-0.5 rounded text-neutral-400 hover:text-red-400 hover:bg-white/10 transition-colors ml-0.5"
                  title="Убрать игрока из события"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-[11px] text-neutral-500 italic py-1">
          Ни один игрок пока не выбран (выберите из списка ниже)
        </p>
      )}

      {/* Quick Add Form */}
      {isQuickAddOpen && (
        <div className="p-2.5 rounded-lg bg-[#1a1a1a] border border-emerald-500/30 space-y-2 mt-2">
          <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
            <Plus className="w-3 h-3" />
            <span>Добавить нового игрока в базу сервера</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={newNick}
              onChange={(e) => setNewNick(e.target.value)}
              placeholder="Никнейм в игре (Steve)"
              className="bg-[#242424] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              placeholder="Роль/титул (Строитель, Воин)"
              className="bg-[#242424] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={!newNick.trim()}
            className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-black font-semibold text-xs transition-colors flex items-center justify-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Сохранить в базу и добавить к событию</span>
          </button>
        </div>
      )}

      {/* Quick picker from DB */}
      <div className="pt-2 border-t border-white/5 space-y-1.5">
        <div className="relative">
          <Search className="w-3 h-3 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Быстрый поиск по базе игроков..."
            className="w-full bg-[#181818] border border-white/10 rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-400"
          />
        </div>

        {/* Players list */}
        <div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {filteredPlayers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {filteredPlayers.map((player) => {
                const isSelected = selectedPlayers.includes(player.username);
                return (
                  <button
                    key={player.id || player.username}
                    type="button"
                    onClick={() => togglePlayer(player.username)}
                    className={`flex items-center justify-between p-1.5 rounded-lg text-left transition-colors border text-xs ${
                      isSelected
                        ? 'bg-blue-500/15 border-blue-500/40 text-blue-200'
                        : 'bg-white/[0.02] border-white/5 text-neutral-300 hover:bg-white/10 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <PlayerAvatar username={player.username} size={18} />
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate text-[11px]">
                          {player.username}
                        </div>
                        {player.role && (
                          <div className="text-[10px] text-neutral-400 truncate">
                            {player.role}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 ml-1">
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-blue-400" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-2 text-xs text-neutral-500">
              Игроки не найдены.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
