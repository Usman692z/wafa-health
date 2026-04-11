import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function Card({ children, className, onClick, hover }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm',
        hover && 'hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 cursor-pointer transition-all',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-4 border-b border-slate-100 dark:border-slate-700', className)}>
      {children}
    </div>
  );
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-6 py-4', className)}>{children}</div>;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  change,
  color = 'blue',
  subtext,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  change?: number;
  color?: 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'cyan';
  subtext?: string;
}) {
  const colorMap = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-950', icon: 'text-blue-500', text: 'text-blue-600' },
    green: { bg: 'bg-green-50 dark:bg-green-950', icon: 'text-green-500', text: 'text-green-600' },
    red: { bg: 'bg-red-50 dark:bg-red-950', icon: 'text-red-500', text: 'text-red-600' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-950', icon: 'text-purple-500', text: 'text-purple-600' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-950', icon: 'text-orange-500', text: 'text-orange-600' },
    cyan: { bg: 'bg-cyan-50 dark:bg-cyan-950', icon: 'text-cyan-500', text: 'text-cyan-600' },
  };
  const c = colorMap[color];

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
          {subtext && <p className="text-xs text-slate-400 mt-0.5">{subtext}</p>}
        </div>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', c.bg)}>
          <Icon className={cn('w-6 h-6', c.icon)} />
        </div>
      </div>
      {change !== undefined && (
        <div className={cn('mt-3 text-xs font-medium', change >= 0 ? 'text-green-600' : 'text-red-500')}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% from last month
        </div>
      )}
    </Card>
  );
}
