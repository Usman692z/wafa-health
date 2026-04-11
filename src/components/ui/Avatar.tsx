import Image from 'next/image';
import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  online?: boolean;
}

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const avatarColors = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-red-500',
];

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function Avatar({ src, name, size = 'md', className, online }: AvatarProps) {
  const sizeClass = sizes[size];
  const initials = getInitials(name);
  const color = getColor(name);

  return (
    <div className={cn('relative shrink-0', className)}>
      <div className={cn('rounded-full overflow-hidden flex items-center justify-center', sizeClass)}>
        {src ? (
          <Image src={src} alt={name} fill className="object-cover" />
        ) : (
          <div className={cn('w-full h-full flex items-center justify-center text-white font-semibold', color)}>
            {initials}
          </div>
        )}
      </div>
      {online !== undefined && (
        <span className={cn('absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-800', online ? 'bg-green-400' : 'bg-slate-400')} />
      )}
    </div>
  );
}
