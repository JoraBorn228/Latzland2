/**
 * Image processing utilities for client-side storage and optimization.
 * Compresses large screenshots so they fit safely within localStorage (typically 5-10MB total).
 */

export interface ProcessedImage {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

/**
 * Compresses an image File or base64 string to a lightweight WebP/JPEG data URL.
 * Max dimensions: 1400x1400, quality: 0.82
 */
export async function compressImage(
  fileOrUrl: File | string,
  maxWidth = 1400,
  maxHeight = 1400,
  quality = 0.82
): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    let src = '';
    let originalSize = 0;

    if (fileOrUrl instanceof File) {
      originalSize = fileOrUrl.size;
      src = URL.createObjectURL(fileOrUrl);
    } else {
      src = fileOrUrl;
      originalSize = Math.round((fileOrUrl.length * 3) / 4);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (fileOrUrl instanceof File) {
        URL.revokeObjectURL(src);
      }

      let { width, height } = img;

      // Calculate aspect-ratio preserved dimensions
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Не удалось инициализировать canvas контекст'));
        return;
      }

      // Smooth scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Prefer image/webp if supported, fallback to image/jpeg
      let mimeType = 'image/webp';
      let dataUrl = canvas.toDataURL(mimeType, quality);

      if (!dataUrl.startsWith('data:image/webp')) {
        mimeType = 'image/jpeg';
        dataUrl = canvas.toDataURL(mimeType, quality);
      }

      const compressedSize = Math.round((dataUrl.length * 3) / 4);

      resolve({
        dataUrl,
        originalSize,
        compressedSize,
        width,
        height,
      });
    };

    img.onerror = () => {
      if (fileOrUrl instanceof File) {
        URL.revokeObjectURL(src);
      }
      reject(new Error('Не удалось загрузить изображение для сжатия'));
    };

    img.src = src;
  });
}

/**
 * Formats bytes to human-readable string (e.g. "145 KB", "1.2 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Calculates current localStorage usage in bytes and percentage of typical 5MB quota
 */
export function getLocalStorageUsage(): { usedBytes: number; formattedUsed: string; percentage: number } {
  try {
    let totalLength = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key) || '';
        totalLength += key.length + val.length;
      }
    }
    const usedBytes = totalLength * 2; // UTF-16 characters are 2 bytes each
    const estimatedLimit = 5 * 1024 * 1024; // 5 MB
    const percentage = Math.min(100, Math.round((usedBytes / estimatedLimit) * 100));
    return {
      usedBytes,
      formattedUsed: formatBytes(usedBytes),
      percentage,
    };
  } catch {
    return { usedBytes: 0, formattedUsed: '0 B', percentage: 0 };
  }
}
