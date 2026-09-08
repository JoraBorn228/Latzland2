import React, { useState } from 'react';
import { Upload, X, AlertCircle, Check, FileText } from 'lucide-react';
import { LatzEvent } from '../types';
import { sanitizeText, sanitizeUrl, validateCoordinates } from '../utils/sanitizer';

interface ImportJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportEvents: (newEvents: LatzEvent[], mode: 'replace' | 'merge') => void;
  onShowToast: (msg: string) => void;
}

export const ImportJsonModal: React.FC<ImportJsonModalProps> = ({
  isOpen,
  onClose,
  onImportEvents,
  onShowToast,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState('');
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      setJsonText(content);
      setError('');
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    try {
      if (!jsonText.trim()) {
        setError('Поле с JSON не может быть пустым');
        return;
      }
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        setError('JSON должен быть массивом событий ([{ id, title, date, type... }])');
        return;
      }
      if (parsed.length === 0) {
        setError('Массив событий пуст');
        return;
      }

      // Strict validation & sanitization
      const validEvents: LatzEvent[] = parsed.map((item, idx) => {
        const coords = item.coordinates
          ? validateCoordinates(item.coordinates.x, item.coordinates.y, item.coordinates.z)
          : null;

        return {
          id: String(item.id || `ev-imp-${Date.now()}-${idx}`),
          title: sanitizeText(item.title) || 'Без названия',
          date: String(item.date || '2024-01-01').slice(0, 20),
          type: item.type || 'event',
          season: Math.max(1, Math.min(20, Number(item.season) || 1)),
          important: Boolean(item.important),
          description: sanitizeText(item.description) || undefined,
          link: sanitizeUrl(item.link) || undefined,
          imageUrl: sanitizeUrl(item.imageUrl) || undefined,
          players: Array.isArray(item.players)
            ? item.players.map((p: any) => sanitizeText(p)).filter(Boolean)
            : undefined,
          coordinates:
            coords && coords.valid
              ? {
                  x: coords.x,
                  y: coords.y,
                  z: coords.z,
                  dimension: item.coordinates?.dimension || 'overworld',
                }
              : undefined,
        };
      });

      onImportEvents(validEvents, importMode);
      onShowToast(`Успешно загружено ${validEvents.length} событий!`);
      setJsonText('');
      setError('');
      onClose();
    } catch (err: any) {
      setError(`Ошибка синтаксиса JSON: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#141414] border border-white/15 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#181818]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Upload className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Импорт событий из JSON
              </h3>
              <p className="text-xs text-neutral-400">
                Загрузите файл или вставьте готовый JSON-массив событий
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* File input */}
          <div className="space-y-1.5">
            <label className="block font-medium text-neutral-300">
              Загрузить .json файл с диска:
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-xs text-neutral-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-neutral-200 hover:file:bg-white/20 cursor-pointer"
            />
          </div>

          {/* Text Area */}
          <div className="space-y-1.5">
            <label className="block font-medium text-neutral-300">
              Либо вставьте JSON вручную:
            </label>
            <textarea
              rows={8}
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setError('');
              }}
              placeholder='[ { "id": "ev-1", "title": "Основание города", "date": "2024-03-12", "type": "build" } ]'
              className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl p-3 text-xs text-neutral-200 font-mono focus:outline-none focus:border-[#00e676] resize-y"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode choice */}
          <div className="space-y-1.5 pt-1">
            <label className="block font-medium text-neutral-300">
              Режим импорта:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setImportMode('replace')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  importMode === 'replace'
                    ? 'bg-[#00e676]/15 border-[#00e676] text-white'
                    : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="font-semibold text-xs mb-0.5">Полная замена</div>
                <div className="text-[10px] text-neutral-400">
                  Заменить все текущие события новыми
                </div>
              </button>

              <button
                type="button"
                onClick={() => setImportMode('merge')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  importMode === 'merge'
                    ? 'bg-[#00e676]/15 border-[#00e676] text-white'
                    : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="font-semibold text-xs mb-0.5">Объединить</div>
                <div className="text-[10px] text-neutral-400">
                  Добавить к уже существующим событиям
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-white/10 bg-[#181818]">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleImport}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#00e676] hover:bg-[#00c853] text-black shadow-[0_0_12px_rgba(0,230,118,0.25)] transition-all"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Применить импорт</span>
          </button>
        </div>
      </div>
    </div>
  );
};
