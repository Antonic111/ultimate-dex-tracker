export default function ProgressBar({ total, caughtCount, label }) {
  const percent = total === 0 ? 0 : Math.round((caughtCount / total) * 100);
  const remaining = total - caughtCount;
  
  // Cap the progress bar width to prevent it from extending too far
  // This ensures visual consistency with the top progress bar
  // Allow 100% to show as full width, but cap other percentages at 95%
  const cappedPercent = percent === 100 ? 100 : Math.min(percent, 95);

  return (
    <div className="w-full h-full p-4 rounded-lg shadow-sm" style={{ backgroundColor: 'var(--progressbar-bg)', border: '1px solid var(--border-color)' }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 gap-1">
        <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{label}</span>
        <span className="text-xs" style={{ color: 'var(--progressbar-info)' }}>
          {caughtCount} / {total} · {percent}% done! · {remaining} to go!
        </span>
      </div>

      <div className="w-full rounded-full h-3 overflow-hidden" style={{ backgroundColor: 'var(--progressbar-track)' }}>
        <div 
          className="h-full rounded-full transition-all duration-300 ease-out" 
          style={{ width: `${cappedPercent}%`, backgroundColor: 'var(--accent)' }} 
        />
      </div>
    </div>
  );
}
