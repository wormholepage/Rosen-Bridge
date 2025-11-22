import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: string;
}

export const StatsCard = ({ title, value, icon: Icon, trend, color = 'cyan' }: StatsCardProps) => {
  const colorClasses = {
    cyan: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/50',
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/50',
    purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/50',
    orange: 'from-orange-500/20 to-red-500/20 border-orange-500/50',
    yellow: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/50',
  };

  const iconColorClasses = {
    cyan: 'text-cyan-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    orange: 'text-orange-400',
    yellow: 'text-yellow-400',
  };

  return (
    <div className={`relative overflow-hidden rounded-lg bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses] || colorClasses.cyan} border backdrop-blur-sm p-6 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-${color}-500/20`}>
      <div className="absolute -right-4 -top-4 opacity-20">
        <Icon size={80} className={iconColorClasses[color as keyof typeof iconColorClasses] || iconColorClasses.cyan} />
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400 font-medium tracking-wide">{title}</span>
          <Icon size={20} className={iconColorClasses[color as keyof typeof iconColorClasses] || iconColorClasses.cyan} />
        </div>
        <div className="text-3xl font-bold text-white mb-1">{value}</div>
        {trend && (
          <div className="text-xs text-green-400 font-medium">
            {trend}
          </div>
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
    </div>
  );
};