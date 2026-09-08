import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  Check,
  Sparkles,
  AlertCircle,
  FileImage,
  RefreshCw,
} from 'lucide-react';
import { compressImage, formatBytes } from '../utils/imageUtils';

interface ImageUploaderProps {
  value?: string;
  imageUrl?: string;
  onChange?: (value: string) => void;
  onImageChange?: (value: string) => void;
  onShowToast: (msg: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  imageUrl,
  onChange,
  onImageChange,
  onShowToast,
}) => {
  const currentValue = value ?? imageUrl ?? '';
  const triggerChange = (val: string) => {
    if (onChange) onChange(val);
    if (onImageChange) onImageChange(val);
  };

  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(
    currentValue && typeof currentValue === 'string' && !currentValue.startsWith('data:')
      ? currentValue
      : ''
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<{
    original: number;
    compressed: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Sync urlInput when currentValue changes from outside
  useEffect(() => {
    if (currentValue && typeof currentValue === 'string' && !currentValue.startsWith('data:')) {
      setUrlInput(currentValue);
    }
  }, [currentValue]);

  const processFile = async (file: File) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      onShowToast('Пожалуйста, выберите файл изображения (PNG, JPG, WebP и т.д.)');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      onShowToast('Размер файла слишком большой (максимум 20 МБ)');
      return;
    }

    setIsProcessing(true);
    try {
      const processed = await compressImage(file, 1400, 1400, 0.82);
      triggerChange(processed.dataUrl);
      setCompressionStats({
        original: processed.originalSize,
        compressed: processed.compressedSize,
      });

      const savedPercent = Math.round(
        ((processed.originalSize - processed.compressedSize) / processed.originalSize) * 100
      );
      if (savedPercent > 10) {
        onShowToast(
          `Скриншот сжат: ${formatBytes(processed.compressedSize)} (экономия ${savedPercent}%)`
        );
      } else {
        onShowToast(`Скриншот загружен: ${formatBytes(processed.compressedSize)}`);
      }
    } catch (err) {
      console.error('Error compressing image:', err);
      onShowToast('Ошибка при обработке изображения');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset file input so re-selecting same file fires onChange
    if (e.target) e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      triggerChange('');
      onShowToast('Ссылка на скриншот удалена');
      return;
    }
    triggerChange(trimmed);
    setCompressionStats(null);
    onShowToast('Ссылка на изображение применена');
  };

  const handleClearImage = () => {
    triggerChange('');
    setUrlInput('');
    setCompressionStats(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Listen for paste event on container
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type && items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          processFile(file);
          e.preventDefault();
          return;
        }
      }
    }
  };

  const isDataUrl = Boolean(
    currentValue && typeof currentValue === 'string' && currentValue.startsWith('data:')
  );

  return (
    <div
      className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-3"
      onPaste={handlePaste}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-neutral-200 text-xs">
            Скриншот или иллюстрация события
          </span>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-[#181818] p-0.5 rounded-lg border border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
              activeTab === 'upload'
                ? 'bg-[#00e676]/20 text-[#00e676]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Upload className="w-3 h-3" />
            <span>Файл / Вставка</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
              activeTab === 'url'
                ? 'bg-[#00e676]/20 text-[#00e676]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            <span>Ссылка URL</span>
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* If an image is currently loaded, display preview */}
      {currentValue ? (
        <div className="relative rounded-xl overflow-hidden border border-white/15 bg-black/60 group">
          <div className="max-h-48 overflow-hidden flex items-center justify-center bg-black/40">
            <img
              src={currentValue}
              alt="Скриншот события"
              className="max-h-48 w-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><text y="25" fill="%23999" font-size="8">Ошибка загрузки картинки</text></svg>';
              }}
            />
          </div>

          {/* Bottom badge showing info */}
          <div className="p-2 bg-[#181818] border-t border-white/10 flex items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-neutral-300 truncate">
              {isDataUrl ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                  <FileImage className="w-3 h-3" />
                  <span>
                    Локальный скриншот{' '}
                    {compressionStats && `(${formatBytes(compressionStats.compressed)})`}
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-blue-400 font-medium truncate">
                  <LinkIcon className="w-3 h-3 shrink-0" />
                  <span className="truncate max-w-[200px]">{currentValue}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-neutral-200 transition-colors flex items-center gap-1"
                title="Заменить изображение"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Заменить</span>
              </button>
              <button
                type="button"
                onClick={handleClearImage}
                className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-colors flex items-center gap-1"
                title="Удалить скриншот"
              >
                <X className="w-3 h-3" />
                <span>Удалить</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* No image selected yet */
        <>
          {activeTab === 'upload' ? (
            <div
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-[#00e676] bg-[#00e676]/10 scale-[1.01]'
                  : 'border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]'
              }`}
            >
              {isProcessing ? (
                <div className="py-3 flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 text-[#00e676] animate-spin" />
                  <span className="text-xs font-medium text-neutral-300">
                    Оптимизация и сжатие скриншота...
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 group-hover:text-white">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-white hover:underline">
                      Выберите файл
                    </span>{' '}
                    <span className="text-neutral-400">или перетащите скриншот сюда</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Поддерживает вставку из буфера обмена (<kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-neutral-300">Ctrl+V</kbd>) • PNG, JPG, WebP (автосжатие)
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyUrl();
                  }
                }}
                placeholder="https://i.imgur.com/... или ссылка на Discord CDN"
                className="flex-1 bg-[#1e1e1e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00e676]"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-200 font-medium text-xs transition-colors shrink-0 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Применить</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
