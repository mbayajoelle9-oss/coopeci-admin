'use client';
import { useState, useEffect, useCallback } from 'react';
import { Bell, ChevronDown, LogOut, Search, HelpCircle, CheckCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { initials, roleLabel, formatDate } from '@/lib/format';
import { NotificationAPI } from '@/lib/api';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

export default function Topbar({ title }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const firstName = (user?.name || '').trim().split(/\s+/)[0] || '';

  const load = useCallback(async () => {
    try {
      const { data } = await NotificationAPI.list();
      setNotifs(data.data || []);
      setUnread(data.unreadCount || 0);
    } catch {
      // silencieux : la cloche reste utilisable même si la requête échoue une fois
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000); // rafraîchi chaque minute
    return () => clearInterval(t);
  }, [load]);

  const openNotifs = () => {
    setNotifOpen((o) => !o);
    setOpen(false);
  };

  const readOne = async (n) => {
    if (!n.isRead) {
      setNotifs((list) => list.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
      setUnread((u) => Math.max(u - 1, 0));
      try { await NotificationAPI.markRead(n._id); } catch {}
    }
  };

  const readAll = async () => {
    setNotifs((list) => list.map((x) => ({ ...x, isRead: true })));
    setUnread(0);
    try { await NotificationAPI.markAllRead(); } catch {}
  };

  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">{title}</div>
      </div>
      <div className="search topbar-search">
        <span className="search-ico"><Search size={16} strokeWidth={2.2} /></span>
        <input className="input" placeholder="Rechercher un membre, un dossier..." />
      </div>
      <div className="topbar-user" style={{ position: 'relative' }}>
        <button className="icon-btn" aria-label="Aide">
          <HelpCircle size={18} strokeWidth={2.2} />
        </button>
        <div style={{ position: 'relative' }}>
          <button className="icon-btn" aria-label="Notifications" onClick={openNotifs}>
            <Bell size={18} strokeWidth={2.2} />
            {unread > 0 ? <span className="icon-dot" /> : null}
          </button>
          {notifOpen ? (
            <div className="card" style={{ position: 'absolute', top: 48, right: 0, width: 320, padding: 0, zIndex: 30, maxHeight: 420, overflowY: 'auto' }}>
              <div className="row between" style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 800, fontSize: 13.5 }}>Notifications</div>
                {unread > 0 ? (
                  <button onClick={readAll} className="row gap" style={{ background: 'none', border: 'none', color: 'var(--azure)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', gap: 4 }}>
                    <CheckCheck size={13} /> Tout marquer lu
                  </button>
                ) : null}
              </div>
              {notifs.length === 0 ? (
                <div className="muted" style={{ padding: 24, textAlign: 'center', fontSize: 12.5 }}>Aucune notification pour le moment.</div>
              ) : (
                notifs.map((n) => (
                  <div key={n._id} onClick={() => readOne(n)}
                    style={{ padding: '11px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: n.isRead ? 'transparent' : 'var(--azure-bg)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      {!n.isRead ? <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--azure)', marginTop: 5, flexShrink: 0 }} /> : <span style={{ width: 7 }} />}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--ink)' }}>{n.title || 'Notification'}</div>
                        <div className="muted" style={{ fontSize: 11.5, marginTop: 2, lineHeight: 1.4 }}>{n.message}</div>
                        <div className="faint" style={{ fontSize: 10.5, marginTop: 4 }}>{formatDate(n.createdAt, true)}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </div>
        <div className="row gap" style={{ cursor: 'pointer' }} onClick={() => { setOpen((o) => !o); setNotifOpen(false); }}>
          <div style={{ textAlign: 'right' }}>
            <div className="muted" style={{ fontSize: 11.5, fontWeight: 600 }}>{greeting()}</div>
            <div style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--ink)' }}>{firstName || user?.name}</div>
          </div>
          <span className="avatar-wrap">
            <div className="avatar">{initials(user?.name)}</div>
            <span className="avatar-status" title="Session active" />
          </span>
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
