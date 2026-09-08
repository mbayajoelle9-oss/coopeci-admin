'use client';
import { useState } from 'react';
import { Bell, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { initials, roleLabel } from '@/lib/format';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

export default function Topbar({ title }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const firstName = (user?.name || '').trim().split(/\s+/)[0] || '';

  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">{title}</div>
      </div>
      <div className="topbar-user" style={{ position: 'relative' }}>
        <button className="icon-btn" aria-label="Notifications">
          <Bell size={18} strokeWidth={2.2} />
          <span className="icon-dot" />
        </button>
        <div className="row gap" style={{ cursor: 'pointer' }} onClick={() => setOpen((o) => !o)}>
          <div style={{ textAlign: 'right' }}>
            <div className="muted" style={{ fontSize: 11.5, fontWeight: 600 }}>{greeting()}</div>
            <div style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--ink)' }}>{firstName || user?.name}</div>
          </div>
          <div className="avatar">{initials(user?.name)}</div>
          <ChevronDown size={16} className="faint" />
        </div>
        {open ? (
          <div className="card" style={{ position: 'absolute', top: 54, right: 0, width: 210, padding: 8, zIndex: 30 }}>
            <div style={{ padding: '10px 10px 8px' }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{user?.name}</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 1 }}>{roleLabel(user?.role)}</div>
              <div className="faint" style={{ fontSize: 11.5, marginTop: 3 }}>{user?.email}</div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', height: 38, gap: 9 }} onClick={logout}>
              <LogOut size={16} /> Se déconnecter
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
