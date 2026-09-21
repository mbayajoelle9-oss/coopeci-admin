'use client';
import { useEffect, useState, useCallback } from 'react';
import { UsersAPI, EmployeeAPI, errorMessage } from '@/lib/api';
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
                    <td><div className="row gap" style={{ gap: 10 }}>
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>{initials(u.name)}</div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        {u.role === 'agent' && (u.commune || u.ville) ? <div className="faint" style={{ fontSize: 11 }}>{[u.commune, u.ville].filter(Boolean).join(', ')}</div> : null}
                      </div>
                    </div></td>
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

const MARITAL_OPTIONS = [
  { value: '', label: '—' },
  { value: 'celibataire', label: 'Célibataire' },
  { value: 'marie', label: 'Marié(e)' },
  { value: 'divorce', label: 'Divorcé(e)' },
  { value: 'veuf', label: 'Veuf/Veuve' },
];

function UserModal({ editing, onClose, onDone }) {
  const isNew = !editing._id;
  const [f, setF] = useState({
    name: editing.name || '', email: editing.email || '', password: '', role: editing.role || 'agent',
    status: editing.status || 'active', commune: editing.commune || '', ville: editing.ville || '',
    lastName: editing.lastName || '', postName: editing.postName || '', firstName: editing.firstName || '',
    phone: editing.phone || '', origin: editing.origin || '', maritalStatus: editing.maritalStatus || '',
    address: editing.address || '', education: editing.education || '',
    photo: editing.photo || '', idDocumentUrl: editing.idDocumentUrl || '',
  });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const uploadTo = (key) => async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { const { data } = await EmployeeAPI.upload(file); setF((s) => ({ ...s, [key]: data.url })); }
    catch (er) { setErr(errorMessage(er)); }
  };

  const submit = async () => {
    setErr('');
    const hasName = f.name.trim() || (f.lastName.trim() && f.firstName.trim());
    if (!hasName || !f.email.trim()) { setErr('Nom (ou Nom+Prénom) et e-mail requis.'); return; }
    if (isNew && f.password.length < 8) { setErr('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    setBusy(true);
    try {
      const common = {
        email: f.email, role: f.role, commune: f.commune, ville: f.ville,
        lastName: f.lastName, postName: f.postName, firstName: f.firstName,
        phone: f.phone, origin: f.origin, maritalStatus: f.maritalStatus,
        address: f.address, education: f.education, photo: f.photo, idDocumentUrl: f.idDocumentUrl,
      };
      if (f.name.trim()) common.name = f.name;
      if (isNew) await UsersAPI.create({ ...common, password: f.password });
      else {
        const payload = { ...common, status: f.status };
        if (f.password) payload.password = f.password;
        await UsersAPI.update(editing._id, payload);
      }
      onDone();
    } catch (e) { setErr(errorMessage(e)); }
    finally { setBusy(false); }
  };

  return (
    <Modal title={isNew ? 'Nouvel utilisateur (employé)' : 'Modifier l\'utilisateur'} onClose={onClose}
      footer={<><button className="btn btn-outline" onClick={onClose}>Annuler</button><button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? '…' : 'Enregistrer'}</button></>}>

      <div className="row" style={{ gap: 16, marginBottom: 16, alignItems: 'center' }}>
        {f.photo ? <img src={f.photo} alt="Photo" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} /> : <div className="avatar" style={{ width: 64, height: 64 }}>?</div>}
        <div className="field" style={{ marginBottom: 0 }}><label className="label">Photo de profil</label><input className="input" type="file" accept="image/*" onChange={uploadTo('photo')} /></div>
      </div>

      <div className="grid grid-3" style={{ columnGap: 12 }}>
        <div className="field"><label className="label">Nom</label><input className="input" value={f.lastName} onChange={set('lastName')} /></div>
        <div className="field"><label className="label">Postnom</label><input className="input" value={f.postName} onChange={set('postName')} /></div>
        <div className="field"><label className="label">Prénom</label><input className="input" value={f.firstName} onChange={set('firstName')} /></div>
      </div>
      <div className="hint" style={{ marginTop: -6, marginBottom: 10 }}>Ou, à défaut, un nom d'affichage libre :</div>
      <div className="field"><label className="label">Nom complet (si Nom/Postnom/Prénom non renseignés)</label><input className="input" value={f.name} onChange={set('name')} /></div>

      <div className="grid grid-2" style={{ columnGap: 12 }}>
        <div className="field"><label className="label">E-mail</label><input className="input" type="email" value={f.email} onChange={set('email')} /></div>
        <div className="field"><label className="label">Téléphone</label><input className="input" value={f.phone} onChange={set('phone')} /></div>
      </div>
      <div className="field"><label className="label">{isNew ? 'Mot de passe' : 'Nouveau mot de passe (optionnel)'}</label><input className="input" type="password" value={f.password} onChange={set('password')} placeholder={isNew ? 'Min. 8 caractères' : 'Laisser vide pour ne pas changer'} /></div>
      <div className="field"><label className="label">Rôle</label>
        <select className="select" value={f.role} onChange={set('role')}>
          {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
      {f.role === 'agent' ? (
        <div className="row gap" style={{ gap: 12 }}>
          <div className="field" style={{ flex: 1 }}><label className="label">Commune</label><input className="input" value={f.commune} onChange={set('commune')} placeholder="Ex : Ngaliema" /></div>
          <div className="field" style={{ flex: 1 }}><label className="label">Ville</label><input className="input" value={f.ville} onChange={set('ville')} placeholder="Ex : Kinshasa" /></div>
        </div>
      ) : null}

      <div className="sub" style={{ fontWeight: 800, color: 'var(--ink)', fontSize: 12.5, margin: '16px 0 8px' }}>Informations complémentaires</div>
      <div className="grid grid-2" style={{ columnGap: 12 }}>
        <div className="field"><label className="label">Origine</label><input className="input" value={f.origin} onChange={set('origin')} placeholder="Province / territoire" /></div>
        <div className="field"><label className="label">État civil</label>
          <select className="select" value={f.maritalStatus} onChange={set('maritalStatus')}>
            {MARITAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
      <div className="field"><label className="label">Adresse</label><input className="input" value={f.address} onChange={set('address')} /></div>
      <div className="field"><label className="label">Études faites</label><input className="input" value={f.education} onChange={set('education')} /></div>
      <div className="field">
        <label className="label">Pièce d'identité</label>
        <input className="input" type="file" accept="image/*,.pdf" onChange={uploadTo('idDocumentUrl')} />
        {f.idDocumentUrl ? <a href={f.idDocumentUrl} target="_blank" rel="noreferrer" className="hint" style={{ display: 'inline-block', marginTop: 6 }}>Voir le fichier importé</a> : null}
      </div>

      {!isNew ? (
        <div className="field"><label className="label">Statut</label>
          <select className="select" value={f.status} onChange={set('status')}><option value="active">Actif</option><option value="inactive">Inactif</option></select>
        </div>
      ) : null}
      {!isNew ? <div className="hint">Le dépôt des documents du dossier (CV, diplôme...) et l'impression de la fiche se font depuis la fiche de l'employé, après enregistrement.</div> : null}
      {err ? <div className="err-text">{err}</div> : null}
    </Modal>
  );
}
