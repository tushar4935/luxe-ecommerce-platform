export default function StatsCard({ title, value, icon: Icon, trend, accent = false }) {
  return (
    <div className="rounded-card border border-border bg-card p-6 transition-colors duration-300 hover:border-accent/40">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-textSecondary">{title}</p>
          <p className={`mt-2 font-serif text-3xl font-bold ${accent ? 'text-accent' : 'text-textPrimary'}`}>
            {value}
          </p>
          {trend && <p className="mt-1 text-xs text-textMuted">{trend}</p>}
        </div>
        {Icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}
