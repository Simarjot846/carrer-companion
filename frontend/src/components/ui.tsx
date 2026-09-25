import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

export function ScoreRing({
  score,
  size = 96,
  stroke = 7,
}: {
  score: number;
  size?: number;
  stroke?: number;
}) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, score)) / 100) * c;
  const color = score >= 80 ? 'var(--color-forest)' : score >= 60 ? 'var(--color-gold)' : 'var(--color-clay)';

  return (
    <div className="score-ring" style={{ width: size, height: size }} aria-label={`${score} percent match`}>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
        <circle
          className="score-ring-progress"
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="score-ring-label">
        <span className="score-ring-value" style={{ color }}>{score}</span>
        <span className="score-ring-unit">%</span>
      </div>
    </div>
  );
}

export function Chip({
  children,
  tone = 'forest',
}: {
  children: React.ReactNode;
  tone?: 'forest' | 'gold' | 'clay' | 'muted';
}) {
  return <span className={`ds-chip ds-chip-${tone}`}>{children}</span>;
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="ds-empty">
      <div className="ds-empty-icon">{icon ?? <Info />}</div>
      <h3 className="ds-h3">{title}</h3>
      <p className="ds-body ds-muted">{body}</p>
      {action}
    </div>
  );
}

export function AlertBanner({
  tone,
  title,
  children,
  action,
}: {
  tone: 'error' | 'success' | 'info';
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const Icon = tone === 'error' ? AlertCircle : tone === 'success' ? CheckCircle2 : Info;
  return (
    <div className={`ds-alert ds-alert-${tone}`}>
      <Icon className="ds-alert-icon" />
      <div className="ds-alert-copy">
        <strong>{title}</strong>
        <div>{children}</div>
      </div>
      {action}
    </div>
  );
}

export function PageKicker({ children }: { children: React.ReactNode }) {
  return <div className="ds-kicker">{children}</div>;
}
