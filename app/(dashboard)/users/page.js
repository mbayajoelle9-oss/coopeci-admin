'use client';
import { useEffect, useState, useCallback } from 'react';
import { UsersAPI, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate, roleLabel, ROLE_OPTIONS, initials } from '@/lib/format';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import Loading from '@/components/Loading';

export default function UsersPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(null); // {} for new, user for edit

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try { const { data } = await UsersAPI.list(); setItems(data.data || data.users || []); }
    catch (e) { setErr(errorMessage(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async (u) => {
    if (!confirm(`Désactiver l'accès de ${u.name} ?`)) return;
    try { await UsersAPI.remove(u._id); load(); } catch (e) { alert(errorMessage(e)); }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">Utilisateurs</div>
          <div className="page-sub">Comptes du personnel et rôles</div>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({})}>+ Nouvel utilisateur</button>
      </div>

      {items.length === 0 ? (
        <div className="card"><EmptyState icon="⚙" title="Aucun utilisateur" message={err} /></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>Nom</th><th>E-mail</th><th>Rôle</th><th>Statut</th><th>Créé le</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u._id}>
                    <td><div className="row gap" style={{ gap: 10 }}><div className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>{initials(u.name)}</div><span style={{ fontWeight: 600 }}>{u.name}</span></div></td>
                    <td className="muted">{u.email}</td>
                    <td><Badge tone="info">{roleLabel(u.role)}</Badge></td>
                    <td><Badge tone={u.status === 'active' || !u.status ? 'success' : 'danger'}>{u.status === 'inactive' ? 'Inactif' : 'Actif'}</Badge></td>
                    <td className="muted">{formatDate(u.createdAt)}</td>
                    <td>
                      <div className="inline-actions" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => setEditing(u)}>Modifier</button>
                        {u._id !== user?.id ? <button className="btn btn-danger btn-sm" onClick={() => remove(u)}>Désactiver</button> : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing !== null ? <UserModal editing={editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); load(); }} /> : null}
    </div>
  );
}

function UserModal({ editing, onClose, onDone }) {
  const isNew = !editing._id;
  const [f, setF] = useState({ name: editing.name || '', email: editing.email || '', password: '', role: editing.role || 'agent', status: editing.status || 'active' });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async () => {
    setErr('');
    if (!f.name.trim() || !f.email.trim()) { setErr('Nom et e-mail requis.'); return; }
    if (isNew && f.password.length < 8) { setErr('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    setBusy(true);
    try {
      if (isNew) await UsersAPI.create({ name: f.name, email: f.email, password: f.password, role: f.role });
      else {
        const payload = { name: f.name, email: f.email, role: f.role, status: f.status };
        if (f.password) payload.password = f.password;
        await UsersAPI.update(editing._id, payload);
      }
      onDone();
    } catch (e) { setErr(errorMessage(e)); }
    finally { setBusy(false); }
  };

  return (
    <Modal title={isNew ? 'Nouvel utilisateur' : 'Modifier l\'utilisateur'} onClose={onClose}
      footer={<><button className="btn btn-outline" onClick={onClose}>Annuler</button><button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? '…' : 'Enregistrer'}</button></>}>
      <div className="field"><label className="label">Nom complet</label><input className="input" value={f.name} onChange={set('name')} /></div>
      <div className="field"><label className="label">E-mail</label><input className="input" type="email" value={f.email} onChange={set('email')} /></div>
      <div className="field"><label className="label">{isNew ? 'Mot de passe' : 'Nouveau mot de passe (optionnel)'}</label><input className="input" type="password" value={f.password} onChange={set('password')} placeholder={isNew ? 'Min. 8 caractères' : 'Laisser vide pour ne pas changer'} /></div>
      <div className="field"><label className="label">Rôle</label>
        <select className="select" value={f.role} onChange={set('role')}>
          {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
      {!isNew ? (
        <div className="field"><label className="label">Statut</label>
          <select className="select" value={f.status} onChange={set('status')}><option value="active">Actif</option><option value="inactive">Inactif</option></select>
        </div>
      ) : null}
      {err ? <div className="err-text">{err}</div> : null}
    </Modal>
  );
}
