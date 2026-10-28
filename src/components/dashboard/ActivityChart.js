/**
 * Small two-series area chart, drawn as inline SVG so the dashboard needs no
 * charting dependency. Series are plotted on a shared scale and the whole
 * figure scales with its container.
 *
 * @param {object} props
 *   - series: [{ key, label, color, points: number[] }] — equal-length arrays
 *   - labels: string[] — x-axis ticks, same length as points
 */
const WIDTH = 560;
const HEIGHT = 180;
const PAD = { top: 12, right: 8, bottom: 26, left: 32 };

function buildPath(points, max, close) {
  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const step = points.length > 1 ? plotW / (points.length - 1) : 0;
  const x = (i) => PAD.left + i * step;
  const y = (v) => PAD.top + plotH - (max === 0 ? 0 : (v / max) * plotH);

  const line = points.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  if (!close) return line;
  return `${line} L ${x(points.length - 1).toFixed(1)} ${PAD.top + plotH} L ${x(0).toFixed(1)} ${PAD.top + plotH} Z`;
}

export default function ActivityChart({ series = [], labels = [] }) {
  const all = series.flatMap((s) => s.points);
  const peak = Math.max(1, ...all);
  // Round the top of the scale up to a clean number so the gridlines read well.
  const max = Math.ceil(peak / 4) * 4 || 4;
  const ticks = [0, max / 4, max / 2, (max * 3) / 4, max];
  const plotH = HEIGHT - PAD.top - PAD.bottom;

  // Show at most 5 x labels, evenly spaced, so they never collide.
  const labelStep = labels.length > 5 ? Math.ceil(labels.length / 5) : 1;

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Activity over time: ${series.map((s) => s.label).join(" and ")}`}
      >
        {ticks.map((t) => {
          const y = PAD.top + plotH - (t / max) * plotH;
          return (
            <g key={t}>
              <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y} y2={y} stroke="#E4E9ED" strokeWidth="1" />
              <text x={PAD.left - 8} y={y + 3.5} textAnchor="end" className="fill-ink-faint" style={{ fontSize: 9, fontWeight: 700 }}>
                {Math.round(t)}
              </text>
            </g>
          );
        })}

        {series.map((s) => (
          <g key={s.key}>
            <defs>
              <linearGradient id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.26" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={buildPath(s.points, max, true)} fill={`url(#grad-${s.key})`} />
            <path d={buildPath(s.points, max, false)} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          </g>
        ))}

        {labels.map((label, i) => {
          if (i % labelStep !== 0 && i !== labels.length - 1) return null;
          const plotW = WIDTH - PAD.left - PAD.right;
          const step = labels.length > 1 ? plotW / (labels.length - 1) : 0;
          return (
            <text
              key={label + i}
              x={PAD.left + i * step}
              y={HEIGHT - 8}
              textAnchor={i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"}
              className="fill-ink-faint"
              style={{ fontSize: 9, fontWeight: 700 }}
            >
              {label}
            </text>
          );
        })}
      </svg>

      <figcaption className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-ink-soft">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
