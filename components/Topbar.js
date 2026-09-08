'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { initials, roleLabel } from '@/lib/format';

export default function Topbar({ title }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="topbar">
      <div className="topbar-title">{title}</div>
      <div className="topbar-user" style={{ position: 'relative' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{user?.name}</div>
          <div className="faint" style={{ fontSize: 11.5 }}>{roleLabel(user?.role)}</div>
        </div>
        <div className="avatar" style={{ cursor: 'pointer' }} onClick={() => setOpen((o) => !o)}>{initials(user?.name)}</div>
        {open ? (
          <div className="card" style={{ position: 'absolute', top: 48, right: 0, width: 190, padding: 8, zIndex: 30 }}>
            <div style={{ padding: '8px 10px', fontSize: 12.5 }} className="muted">{user?.email}</div>
            <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', height: 36 }} onClick={logout}>Se déconnecter</button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
