import React from 'react';

interface AvatarCircleProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  rounded?: 'full' | '2xl';
}

const SIZE_CLASSES: Record<NonNullable<AvatarCircleProps['size']>, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-28 h-28 text-3xl'
};

const PALETTE = [
  'bg-indigo-100 text-indigo-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700'
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export const AvatarCircle: React.FC<AvatarCircleProps> = ({
  name,
  avatarUrl,
  size = 'md',
  rounded = 'full'
}) => {
  const sizeClass = SIZE_CLASSES[size];
  const roundedClass = rounded === 'full' ? 'rounded-full' : 'rounded-2xl';

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClass} ${roundedClass} object-cover border-2 border-indigo-100 shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} ${roundedClass} ${getColorForName(name)} border-2 border-indigo-100 shrink-0 flex items-center justify-center font-extrabold shadow-2xs`}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
};