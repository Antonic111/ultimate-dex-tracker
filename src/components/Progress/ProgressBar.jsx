import "../../css/ProgressBar.css";

export default function ProgressBar({ total, caughtCount, label }) {
  const percent = total === 0 ? 0 : Math.round((caughtCount / total) * 100);
  const remaining = total - caughtCount;

  return (
    <div className="progress-bar-wrapper">
      <div className="progress-bar-labels">
        <span className="progress-bar-title">{label}</span>
        <span className="progress-bar-summary">
          {caughtCount} / {total} · {percent}% done! · {remaining} to go!
        </span>
      </div>

      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
