import React, { useState } from 'react';
import { User } from 'lucide-react';
import { getMinecraftHeadUrl, getPlayerColor } from '../utils/playerUtils';

interface PlayerAvatarProps {
  username: string;
  size?: number; // pixel size: 16, 20, 24, 32
  className?: string;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  username,
  size = 20,
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  const headUrl = getMinecraftHeadUrl(username, size * 2);
  const color = getPlayerColor(username);

  if (hasError) {
    return (
      <div
        className={`rounded flex items-center justify-center shrink-0 font-mono font-bold text-[10px] text-black ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: color,
        }}
        title={username}
      >
        {username.charAt(0).toUpperCase() || <User className="w-2.5 h-2.5" />}
      </div>
    );
  }

  return (
    <img
      src={headUrl}
      alt={username}
      width={size}
      height={size}
      onError={() => setHasError(true)}
      className={`rounded shrink-0 object-cover ${className}`}
      style={{
        imageRendering: 'pixelated',
        width: size,
        height: size,
      }}
      loading="lazy"
    />
  );
};
