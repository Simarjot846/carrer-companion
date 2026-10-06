import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Filter, X, Edit2, Trash2, ExternalLink,
  Calendar, AlertCircle, CheckCircle2, Clock, TrendingUp,
  Building2, ChevronDown, Briefcase, Bell, LayoutDashboard,
  RefreshCw,
} from 'lucide-react';
import type { Student, Application, ApplicationCreate, ApplicationUpdate, ApplicationStatus, DashboardSummary, UpcomingItem } from '../types';
import { APPLICATION_STATUSES } from '../types';
import {
  createApplication, listApplications, updateApplication,
  deleteApplication, getApplicationDashboard,
} from '../services/api';

interface ApplicationTrackerProps {
  student: Student;
}

// ── Status colour map ──────────────────────────────────────────────────────
const STATUS_STYLE: Record<ApplicationStatus, { bg: string; color: string; border: string }> = {
  'Saved':               { bg: 'var(--color-cream)',      color: 'var(--color-stone)',    border: 'var(--color-line)' },
  'Planning to Apply':   { bg: 'rgba(201,150,58,.10)',    color: 'var(--color-gold-deep)', border: 'rgba(201,150,58,.25)' },
  'Applied':             { bg: 'rgba(26,66,32,.08)',      color: 'var(--color-forest)',    border: 'rgba(26,66,32,.22)' },
  'Under Review':        { bg: 'rgba(26,66,32,.12)',      color: 'var(--color-forest)',    border: 'rgba(26,66,32,.28)' },
  'Shortlisted':         { bg: 'rgba(201,150,58,.18)',    color: 'var(--color-gold-deep)', border: 'rgba(201,150,58,.35)' },
  'Interview Scheduled': { bg: 'rgba(201,150,58,.22)',    color: '#6B4A0A',               border: 'rgba(201,150,58,.45)' },
  'Interview Completed': { bg: 'rgba(26,66,32,.18)',      color: 'var(--color-forest)',    border: 'rgba(26,66,32,.35)' },
  'Offer Received':      { bg: 'var(--color-forest)',     color: 'white',                  border: 'var(--color-forest)' },
  'Rejected':            { bg: 'var(--color-clay-light)', color: 'var(--color-clay)',      border: 'rgba(192,82,40,.25)' },
  'Withdrawn':           { bg: 'var(--color-cream)',      color: 'var(--color-stone)',    border: 'var(--color-line)' },
};

// ── Dashboard stat card ────────────────────────────────────────────────────
function StatCard({ value, label, icon, accent }: { value: number; label: string; icon: React.ReactNode; accent: string }) {
  return (
    <div className="ds-card" style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', gap: '18px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '13px', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--color-forest)' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: '700', color: 'var(--color-ink)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '14px', color: 'var(--color-stone)', marginTop: '4px' }}>{label}</div>
      </div>
    </div>
  );
}

// ── Upcoming alert card ────────────────────────────────────────────────────
function UpcomingCard({ item }: { item: UpcomingItem }) {
  const urgent = item.days_away <= 2;
  return (
    <div style={{
      padding: '14px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px',
      background: urgent ? 'var(--color-clay-light)' : 'rgba(201,150,58,.08)',
      border: `1px solid ${urgent ? 'rgba(192,82,40,.25)' : 'rgba(201,150,58,.22)'}`,
    }}>
      <div style={{ flexShrink: 0 }}>
        {item.type === 'interview'
          ? <Calendar style={{ width: '18px', height: '18px', color: urgent ? 'var(--color-clay)' : 'var(--color-gold-deep)' }} />
          : <Bell style={{ width: '18px', height: '18px', color: urgent ? 'var(--color-clay)' : 'var(--color-gold-deep)' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.company_name} — {item.job_title}
        </div>
        <div style={{ fontSize: '13px', color: urgent ? 'var(--color-clay)' : 'var(--color-gold-deep)' }}>
          {item.type === 'interview' ? 'Interview' : 'Deadline'} in {item.days_away === 0 ? 'today' : `${item.days_away}d`}
        </div>
      </div>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ApplicationStatus }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE['Saved'];
  return (
    <span style={{ padding: '4px 11px', borderRadius: '999px', fontSize: '13px', fontWeight: '600', background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  );
}

// ── Add / Edit Modal ───────────────────────────────────────────────────────
interface AppFormProps {
  initial?: Application;
  onSave: (data: ApplicationCreate | ApplicationUpdate) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

function AppModal({ initial, onSave, onClose, saving }: AppFormProps) {
  const [form, setForm] = useState<ApplicationCreate>({
    company_name: initial?.company_name ?? '',
    job_title: initial?.job_title ?? '',
    job_description: initial?.job_description ?? '',
    application_date: initial?.application_date ?? '',
    deadline: initial?.deadline ?? '',
    status: (initial?.status ?? 'Saved') as ApplicationStatus,
    interview_date: initial?.interview_date ? initial.interview_date.slice(0, 16) : '',
    interview_status: initial?.interview_status ?? 'Not Scheduled',
    notes: initial?.notes ?? '',
    job_url: initial?.job_url ?? '',
    resume_version_note: initial?.resume_version_note ?? '',
    cover_letter_version_note: initial?.cover_letter_version_note ?? '',
  });

  const set = (field: keyof ApplicationCreate, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Strip empty strings to undefined for optional fields
    const payload: ApplicationCreate = {
      ...form,
      job_description: form.job_description || undefined,
      application_date: form.application_date || undefined,
      deadline: form.deadline || undefined,
      interview_date: form.interview_date || undefined,
      notes: form.notes || undefined,
      job_url: form.job_url || undefined,
      resume_version_note: form.resume_version_note || undefined,
      cover_letter_version_note: form.cover_letter_version_note || undefined,
    };
    await onSave(payload);
  };

  return (
    <div
      className="animate-fade-in"
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(15,20,16,.70)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="ds-card"
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '36px 40px', display: 'flex', flexDirection: 'column', gap: '24px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-line)', paddingBottom: '20px' }}>
          <h2 className="ds-h3" style={{ color: 'var(--color-ink)' }}>{initial ? 'Edit application' : 'Add application'}</h2>
          <button onClick={onClose} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--color-cream)', border: '1px solid var(--color-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-stone)' }}>
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Row 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="ds-label-field">Company *</label>
              <input required className="ds-input" placeholder="e.g. Google" value={form.company_name} onChange={e => set('company_name', e.target.value)} />
            </div>
            <div>
              <label className="ds-label-field">Job Title *</label>
              <input required className="ds-input" placeholder="e.g. SWE Intern" value={form.job_title} onChange={e => set('job_title', e.target.value)} />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="ds-label-field">Status</label>
            <select
              className="ds-input"
              value={form.status}
              onChange={e => set('status', e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              {APPLICATION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Dates row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="ds-label-field">Application Date</label>
              <input type="date" className="ds-input" value={form.application_date ?? ''} onChange={e => set('application_date', e.target.value)} />
            </div>
            <div>
              <label className="ds-label-field">Deadline</label>
              <input type="date" className="ds-input" value={form.deadline ?? ''} onChange={e => set('deadline', e.target.value)} />
            </div>
          </div>

          {/* Interview */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="ds-label-field">Interview Date/Time</label>
              <input type="datetime-local" className="ds-input" value={form.interview_date ?? ''} onChange={e => set('interview_date', e.target.value)} />
            </div>
            <div>
              <label className="ds-label-field">Interview Status</label>
              <select className="ds-input" value={form.interview_status ?? 'Not Scheduled'} onChange={e => set('interview_status', e.target.value)} style={{ cursor: 'pointer' }}>
                {['Not Scheduled', 'Scheduled', 'Completed', 'Cancelled', 'Rescheduled'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Job URL */}
          <div>
            <label className="ds-label-field">Job Posting URL</label>
            <input type="url" className="ds-input" placeholder="https://..." value={form.job_url ?? ''} onChange={e => set('job_url', e.target.value)} />
          </div>

          {/* Notes */}
          <div>
            <label className="ds-label-field">Notes</label>
            <textarea className="ds-input" rows={3} placeholder="Recruiter contact, follow-up actions, impressions…" value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} style={{ resize: 'vertical' }} />
          </div>

          {/* AI artefact notes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="ds-label-field">Resume Version Note</label>
              <input className="ds-input" placeholder="e.g. Tailored for FastAPI role v2" value={form.resume_version_note ?? ''} onChange={e => set('resume_version_note', e.target.value)} />
            </div>
            <div>
              <label className="ds-label-field">Cover Letter Version Note</label>
              <input className="ds-input" placeholder="e.g. Used cloud-focused letter" value={form.cover_letter_version_note ?? ''} onChange={e => set('cover_letter_version_note', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px', borderTop: '1px solid var(--color-line)' }}>
            <button type="button" onClick={onClose} style={{ padding: '12px 22px', borderRadius: '11px', background: 'white', border: '1.5px solid var(--color-line)', fontSize: '15px', fontWeight: '600', color: 'var(--color-stone)', cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '11px', background: 'var(--color-forest)', color: 'white', fontSize: '15px', fontWeight: '700', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .6 : 1 }}
            >
              {saving ? <div className="ds-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderColor: 'rgba(255,255,255,.3)', borderTopColor: 'white' }} /> : null}
              {initial ? 'Save changes' : 'Add application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({ student }) => {
  const [apps, setApps] = useState<Application[]>([]);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  // Inline status dropdown
  const [statusDropdown, setStatusDropdown] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [appList, dash] = await Promise.all([
        listApplications(student.id),
        getApplicationDashboard(student.id),
      ]);
      setApps(appList);
      setDashboard(dash);
    } catch (err: any) {
      setError(err.message || 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  }, [student.id]);

  useEffect(() => { load(); }, [load]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = () => setStatusDropdown(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  const handleSave = async (data: ApplicationCreate | ApplicationUpdate) => {
    setSaving(true);
    try {
      if (editingApp) {
        await updateApplication(student.id, editingApp.id, data as ApplicationUpdate);
      } else {
        await createApplication(student.id, data as ApplicationCreate);
      }
      setShowModal(false);
      setEditingApp(undefined);
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to save application.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (appId: number) => {
    if (!window.confirm('Delete this application entry?')) return;
    try {
      await deleteApplication(student.id, appId);
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to delete application.');
    }
  };

  const handleQuickStatus = async (app: Application, newStatus: ApplicationStatus) => {
    setStatusDropdown(null);
    try {
      await updateApplication(student.id, app.id, { status: newStatus });
      await load();
    } catch { /* silent */ }
  };

  const filtered = apps.filter(a => {
    const q = search.toLowerCase();
    const matchQ = !q || a.company_name.toLowerCase().includes(q) || a.job_title.toLowerCase().includes(q);
    const matchS = !statusFilter || a.status === statusFilter;
    return matchQ && matchS;
  });

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>

      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
        <div>
          <div className="ds-kicker" style={{ marginBottom: '16px' }}>
            <LayoutDashboard style={{ width: '16px', height: '16px' }} />
            Application Tracker
          </div>
          <h1 className="ds-h2" style={{ color: 'var(--color-ink)', marginBottom: '8px' }}>
            {student.name}'s Applications
          </h1>
          <p className="ds-body" style={{ color: 'var(--color-stone)' }}>
            Track every application from initial interest through to offer.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={load}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '11px 16px', borderRadius: '11px', background: 'white', border: '1.5px solid var(--color-line)', fontSize: '14px', fontWeight: '600', color: 'var(--color-stone)', cursor: 'pointer', transition: 'all .15s' }}
          >
            <RefreshCw style={{ width: '14px', height: '14px' }} />
          </button>
          <button
            onClick={() => { setEditingApp(undefined); setShowModal(true); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 22px', borderRadius: '11px', background: 'var(--color-forest)', color: 'white', fontSize: '15px', fontWeight: '700', border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-forest)', transition: 'all .15s' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            Add application
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="ds-alert ds-alert-error">
          <AlertCircle className="ds-alert-icon" />
          <div className="ds-alert-copy">{error}</div>
        </div>
      )}

      {/* Dashboard stats */}
      {dashboard && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
            <StatCard value={dashboard.total_applications}  label="Total"            icon={<Briefcase style={{ width: '20px', height: '20px' }} />}    accent="var(--color-leaf-bg)" />
            <StatCard value={dashboard.active_applications} label="Active"           icon={<TrendingUp style={{ width: '20px', height: '20px' }} />}   accent="var(--color-leaf-bg)" />
            <StatCard value={dashboard.applied_count}       label="Applied"          icon={<CheckCircle2 style={{ width: '20px', height: '20px' }} />} accent="var(--color-leaf-bg)" />
            <StatCard value={dashboard.interview_scheduled} label="Interviews"       icon={<Calendar style={{ width: '20px', height: '20px' }} />}     accent="rgba(201,150,58,.12)" />
            <StatCard value={dashboard.offers_received}     label="Offers"           icon={<CheckCircle2 style={{ width: '20px', height: '20px' }} />} accent="rgba(26,66,32,.10)" />
            <StatCard value={dashboard.rejected_count}      label="Rejected"         icon={<X style={{ width: '20px', height: '20px' }} />}            accent="var(--color-clay-light)" />
          </div>

          {/* Upcoming alerts */}
          {dashboard.upcoming.length > 0 && (
            <div className="ds-card" style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Bell style={{ width: '18px', height: '18px', color: 'var(--color-gold-deep)' }} />
                <h3 className="ds-h4" style={{ color: 'var(--color-ink)' }}>Upcoming in the next 7 days</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                {dashboard.upcoming.map((item, i) => <UpcomingCard key={i} item={item} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search & filter */}
      <div className="ds-card" style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: 'var(--color-stone)' }} />
          <input
            type="text"
            placeholder="Search company or role…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: '38px', paddingRight: '14px', paddingTop: '11px', paddingBottom: '11px', background: 'var(--color-paper)', border: '1.5px solid var(--color-line)', borderRadius: '10px', fontSize: '15px', color: 'var(--color-ink)', outline: 'none', fontFamily: 'var(--font-sans)', transition: 'border-color .15s' }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-forest-mid)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-line)')}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter style={{ width: '14px', height: '14px', color: 'var(--color-stone)' }} />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '10px 14px', background: 'var(--color-paper)', border: '1.5px solid var(--color-line)', borderRadius: '10px', fontSize: '15px', color: 'var(--color-ink)', cursor: 'pointer', outline: 'none', fontFamily: 'var(--font-sans)' }}
          >
            <option value="">All statuses</option>
            {APPLICATION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <span style={{ fontSize: '14px', color: 'var(--color-stone)', marginLeft: 'auto' }}>
          {filtered.length} {filtered.length === 1 ? 'application' : 'applications'}
        </span>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[0, 1, 2].map(i => (
            <div key={i} className="ds-card" style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div className="skeleton" style={{ height: '20px', width: '180px', borderRadius: '6px' }} />
              <div className="skeleton" style={{ height: '20px', width: '140px', borderRadius: '6px' }} />
              <div className="skeleton" style={{ height: '26px', width: '100px', borderRadius: '999px', marginLeft: 'auto' }} />
            </div>
          ))}
        </div>
      )}

      {/* Applications table */}
      {!loading && filtered.length === 0 && (
        <div className="ds-card" style={{ padding: '80px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="ds-empty-icon"><Briefcase /></div>
          <h3 className="ds-h3" style={{ color: 'var(--color-ink)' }}>
            {apps.length === 0 ? 'No applications yet' : 'No matches for current filters'}
          </h3>
          <p className="ds-body" style={{ color: 'var(--color-stone)', maxWidth: '360px' }}>
            {apps.length === 0
              ? 'Add your first application manually, or go to Job Matches to save a role from there.'
              : 'Try clearing your search or changing the status filter.'}
          </p>
          {apps.length === 0 && (
            <button
              onClick={() => { setEditingApp(undefined); setShowModal(true); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 22px', borderRadius: '11px', background: 'var(--color-forest)', color: 'white', fontSize: '15px', fontWeight: '700', border: 'none', cursor: 'pointer', marginTop: '8px' }}
            >
              <Plus style={{ width: '16px', height: '16px' }} />
              Add your first application
            </button>
          )}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="ds-card" style={{ overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 160px 120px 120px 80px', gap: '0', padding: '14px 24px', background: 'var(--color-paper)', borderBottom: '1px solid var(--color-line)' }}>
            {['Company', 'Role', 'Status', 'Applied', 'Deadline', ''].map(h => (
              <span key={h} style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--color-stone)' }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          {filtered.map((app, idx) => (
            <div
              key={app.id}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 160px 120px 120px 80px',
                gap: '0', padding: '16px 24px', alignItems: 'center',
                borderBottom: idx < filtered.length - 1 ? '1px solid var(--color-line)' : 'none',
                background: 'white', transition: 'background .12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-paper)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'white')}
            >
              {/* Company */}
              <div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 style={{ width: '14px', height: '14px', color: 'var(--color-stone)', flexShrink: 0 }} />
                  {app.company_name}
                </div>
                {app.job_url && (
                  <a href={app.job_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--color-sage)', textDecoration: 'none', marginTop: '2px' }}>
                    <ExternalLink style={{ width: '11px', height: '11px' }} /> View posting
                  </a>
                )}
              </div>

              {/* Role */}
              <div style={{ fontSize: '15px', color: 'var(--color-charcoal)', paddingRight: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {app.job_title}
              </div>

              {/* Status — clickable dropdown */}
              <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setStatusDropdown(statusDropdown === app.id ? null : app.id)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0',
                  }}
                >
                  <StatusBadge status={app.status} />
                  <ChevronDown style={{ width: '12px', height: '12px', color: 'var(--color-stone)' }} />
                </button>
                {statusDropdown === app.id && (
                  <div className="ds-card" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 50, width: '200px', padding: '6px', marginTop: '4px', maxHeight: '260px', overflowY: 'auto' }}>
                    {APPLICATION_STATUSES.map(s => (
                      <button
                        key={s}
                        onClick={() => handleQuickStatus(app, s as ApplicationStatus)}
                        style={{
                          width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: '8px',
                          background: app.status === s ? 'var(--color-leaf-bg)' : 'transparent',
                          border: 'none', cursor: 'pointer', fontSize: '14px',
                          color: app.status === s ? 'var(--color-forest)' : 'var(--color-ink)',
                          fontWeight: app.status === s ? '700' : '500',
                          transition: 'background .12s',
                        }}
                        onMouseEnter={e => { if (app.status !== s) e.currentTarget.style.background = 'var(--color-paper)'; }}
                        onMouseLeave={e => { if (app.status !== s) e.currentTarget.style.background = 'transparent'; }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Applied date */}
              <div style={{ fontSize: '14px', color: 'var(--color-stone)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {app.application_date ? (
                  <><Calendar style={{ width: '12px', height: '12px' }} />{app.application_date}</>
                ) : '—'}
              </div>

              {/* Deadline */}
              <div style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {app.deadline ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: isDeadlineSoon(app.deadline) ? 'var(--color-clay)' : 'var(--color-stone)', fontWeight: isDeadlineSoon(app.deadline) ? '600' : '400' }}>
                    <Clock style={{ width: '12px', height: '12px' }} />{app.deadline}
                  </span>
                ) : '—'}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setEditingApp(app); setShowModal(true); }}
                  style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--color-paper)', border: '1px solid var(--color-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-stone)', transition: 'all .12s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-sage)'; e.currentTarget.style.color = 'var(--color-ink)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-line)'; e.currentTarget.style.color = 'var(--color-stone)'; }}
                >
                  <Edit2 style={{ width: '13px', height: '13px' }} />
                </button>
                <button
                  onClick={() => handleDelete(app.id)}
                  style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--color-paper)', border: '1px solid var(--color-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-stone)', transition: 'all .12s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(192,82,40,.30)'; e.currentTarget.style.color = 'var(--color-clay)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-line)'; e.currentTarget.style.color = 'var(--color-stone)'; }}
                >
                  <Trash2 style={{ width: '13px', height: '13px' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notes panel for selected rows (shown inline as expanded detail) */}
      {!loading && filtered.length > 0 && filtered.some(a => a.notes || a.resume_version_note || a.cover_letter_version_note) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 className="ds-h4" style={{ color: 'var(--color-ink)' }}>Application notes & AI artefacts</h3>
          {filtered.filter(a => a.notes || a.resume_version_note || a.cover_letter_version_note).map(app => (
            <div key={app.id} className="ds-card-inset" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-ink)' }}>{app.company_name} — {app.job_title}</div>
              {app.notes && <p style={{ fontSize: '15px', color: 'var(--color-charcoal)', lineHeight: '1.55', margin: 0 }}>{app.notes}</p>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                {app.resume_version_note && <span className="ds-chip ds-chip-forest">📄 {app.resume_version_note}</span>}
                {app.cover_letter_version_note && <span className="ds-chip ds-chip-gold">✉ {app.cover_letter_version_note}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <AppModal
          initial={editingApp}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingApp(undefined); }}
          saving={saving}
        />
      )}
    </div>
  );
};

// ── Util ──────────────────────────────────────────────────────────────────
function isDeadlineSoon(deadline: string): boolean {
  try {
    const d = new Date(deadline);
    const diff = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff <= 3 && diff >= 0;
  } catch { return false; }
}
