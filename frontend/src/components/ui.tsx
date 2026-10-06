import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

/* ── Score Ring ──────────────────────────────────────────────────── */
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
  const pct = Math.min(100, Math.max(0, score));
  const offset = c - (pct / 100) * c;
  const color = score >= 80 ? 'var(--color-forest)' : score >= 60 ? 'var(--color-gold)' : 'var(--color-clay)';
  const fontSize = size >= 80 ? Math.round(size * 0.24) : Math.round(size * 0.22);

  return (
    <div className="score-ring" style={{ width: size, height: size }} aria-label={`${score} percent match`}>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
        <circle
          className="score-ring-progress"
          cx="50" cy="50" r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="score-ring-label">
        <span className="score-ring-value" style={{ color, fontSize }}>{score}</span>
        <span className="score-ring-unit" style={{ fontSize: Math.round(fontSize * 0.55), color }}>%</span>
      </div>
    </div>
  );
}

/* ── Chip ────────────────────────────────────────────────────────── */
export function Chip({
  children,
  tone = 'forest',
}: {
  children: React.ReactNode;
  tone?: 'forest' | 'gold' | 'clay' | 'muted' | 'ink';
}) {
  return <span className={`ds-chip ds-chip-${tone}`}>{children}</span>;
}

/* ── Empty State ─────────────────────────────────────────────────── */
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
      <h3 className="ds-h3" style={{ color: 'var(--color-ink)' }}>{title}</h3>
      <p className="ds-body" style={{ color: 'var(--color-stone)', maxWidth: '360px', textAlign: 'center' }}>{body}</p>
      {action}
    </div>
  );
}

/* ── Alert Banner ────────────────────────────────────────────────── */
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
    <div className={`ds-alert ds-alert-${tone}`} style={{ flexWrap: 'wrap', gap: '16px' }}>
      <Icon className="ds-alert-icon" />
      <div className="ds-alert-copy" style={{ flex: 1 }}>
        <strong>{title}</strong>
        <div>{children}</div>
      </div>
      {action}
    </div>
  );
}

/* ── Page Kicker ─────────────────────────────────────────────────── */
export function PageKicker({ children }: { children: React.ReactNode }) {
  return <div className="ds-kicker">{children}</div>;
}

/* ── Loading Card ────────────────────────────────────────────────── */
export function LoadingCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="ds-card" style={{ padding: '80px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <div className="ds-spinner" />
      <h3 className="ds-h3" style={{ color: 'var(--color-ink)' }}>{title}</h3>
      <p className="ds-body" style={{ color: 'var(--color-stone)', maxWidth: '360px' }}>{body}</p>
    </div>
  );
}
