'use client';
import { useEffect, useState, useCallback } from 'react';
import { UsersAPI, EmployeeAPI, errorMessage } from '@/lib/api';
import { roleLabel, formatDate } from '@/lib/format';
import Loading from '@/components/Loading';
import EmptyState from '@/components/EmptyState';
import Badge from '@/components/Badge';

const MARITAL_OPTIONS = [
  { value: '', label: '—' },
  { value: 'celibataire', label: 'Célibataire' },
  { value: 'marie', label: 'Marié(e)' },
  { value: 'divorce', label: 'Divorcé(e)' },
  { value: 'veuf', label: 'Veuf/Veuve' },
];

export default function UserDetailPage({ params }) {
  const { id } = params;
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('info');
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try { const { data } = await UsersAPI.detail(id); setUser(data.user); }
    catch (e) { setErr(errorMessage(e)); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (err) return <div className="err-text">{err}</div>;
  if (!user) return <Loading />;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">{user.name}</div>
          <div className="page-sub">{roleLabel(user.role)} — {user.email}</div>
        </div>
        <Badge tone={user.status === 'inactive' ? 'danger' : 'success'}>{user.status === 'inactive' ? 'Inactif' : 'Actif'}</Badge>
      </div>

      <div className="chips section-gap" style={{ marginBottom: 18 }}>
        <button className={`chip ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>Informations</button>
        <button className={`chip ${tab === 'hr' ? 'active' : ''}`} onClick={() => setTab('hr')}>Dossier de l'employé</button>
      </div>

      {tab === 'info' ? <InfoTab user={user} onSaved={load} /> : <HrTab user={user} />}
    </div>
  );
}

function InfoTab({ user, onSaved }) {
  const [f, setF] = useState({
    lastName: user.lastName || '', postName: user.postName || '', firstName: user.firstName || '',
    phone: user.phone || '', origin: user.origin || '', maritalStatus: user.maritalStatus || '',
    address: user.address || '', education: user.education || '',
    photo: user.photo || '', idDocumentUrl: user.idDocumentUrl || '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const uploadTo = (key) => async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { const { data } = await EmployeeAPI.upload(file); setF((s) => ({ ...s, [key]: data.url })); }
    catch (er) { alert(errorMessage(er)); }
  };

  const submit = async () => {
    setBusy(true); setErr(''); setOk(false);
    try { await UsersAPI.update(user._id, f); setOk(true); onSaved(); }
    catch (e) { setErr(errorMessage(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="card">
      <div className="card-head between"><div className="card-title">Identité complète</div>
        <button className="btn btn-gold btn-sm" onClick={submit} disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
      </div>
      <div className="card-pad">
        {ok ? <div className="hint" style={{ color: 'var(--mint)', marginBottom: 12 }}>Enregistré.</div> : null}
        {err ? <div className="err-text" style={{ marginBottom: 12 }}>{err}</div> : null}

        <div className="row" style={{ gap: 16, marginBottom: 16, alignItems: 'center' }}>
          {f.photo ? <img src={f.photo} alt="Photo" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} /> : <div className="avatar" style={{ width: 72, height: 72, fontSize: 22 }}>{(user.name || '?')[0]}</div>}
          <div className="field" style={{ marginBottom: 0 }}><label className="label">Photo de profil</label><input className="input" type="file" accept="image/*" onChange={uploadTo('photo')} /></div>
        </div>

        <div className="grid grid-3" style={{ columnGap: 14 }}>
          <div className="field"><label className="label">Nom</label><input className="input" value={f.lastName} onChange={set('lastName')} /></div>
          <div className="field"><label className="label">Postnom</label><input className="input" value={f.postName} onChange={set('postName')} /></div>
          <div className="field"><label className="label">Prénom</label><input className="input" value={f.firstName} onChange={set('firstName')} /></div>
        </div>
        <div className="grid grid-2" style={{ columnGap: 14 }}>
          <div className="field"><label className="label">Téléphone</label><input className="input" value={f.phone} onChange={set('phone')} /></div>
          <div className="field"><label className="label">Origine</label><input className="input" value={f.origin} onChange={set('origin')} placeholder="Province / territoire" /></div>
        </div>
        <div className="grid grid-2" style={{ columnGap: 14 }}>
          <div className="field"><label className="label">État civil</label>
            <select className="select" value={f.maritalStatus} onChange={set('maritalStatus')}>
              {MARITAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="field"><label className="label">Études faites</label><input className="input" value={f.education} onChange={set('education')} /></div>
        </div>
        <div className="field"><label className="label">Adresse</label><input className="input" value={f.address} onChange={set('address')} /></div>

        <div className="field">
          <label className="label">Pièce d'identité</label>
          <input className="input" type="file" accept="image/*,.pdf" onChange={uploadTo('idDocumentUrl')} />
          {f.idDocumentUrl ? <a href={f.idDocumentUrl} target="_blank" rel="noreferrer" className="hint" style={{ display: 'inline-block', marginTop: 6 }}>Voir le fichier importé</a> : null}
        </div>
      </div>
    </div>
  );
}

function HrTab({ user }) {
  const [docs, setDocs] = useState([]);
  const [types, setTypes] = useState([]);
  const [docType, setDocType] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [printing, setPrinting] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await EmployeeAPI.documents(user._id);
      setDocs(data.data || []);
      setTypes(data.availableTypes || []);
      if (!docType && data.availableTypes?.length) setDocType(data.availableTypes[0]);
    } catch (e) { setErr(errorMessage(e)); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user._id]);

  useEffect(() => { load(); }, [load]);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !docType) return;
    setBusy(true); setErr('');
    try { await EmployeeAPI.addDocument(user._id, docType, file); await load(); }
    catch (er) { setErr(errorMessage(er)); }
    finally { setBusy(false); e.target.value = ''; }
  };

  const remove = async (docId) => {
    if (!confirm('Retirer ce document du dossier ?')) return;
    try { await EmployeeAPI.removeDocument(user._id, docId); load(); }
    catch (e) { alert(errorMessage(e)); }
  };

  const printFiche = async () => {
    setPrinting(true);
    try {
      const { data } = await EmployeeAPI.fiche(user._id);
      const url = URL.createObjectURL(data);
      window.open(url, '_blank');
    } catch (e) { alert(errorMessage(e)); }
    finally { setPrinting(false); }
  };

  return (
    <div className="card">
      <div className="card-head between">
        <div className="card-title">Documents du dossier</div>
        <button className="btn btn-outline btn-sm" onClick={printFiche} disabled={printing}>{printing ? 'Préparation…' : 'Imprimer la fiche'}</button>
      </div>
      <div className="card-pad">
        <div className="row gap" style={{ gap: 10, marginBottom: 16, alignItems: 'flex-end' }}>
          <div className="field" style={{ marginBottom: 0, minWidth: 220 }}>
            <label className="label">Type de document</label>
            <select className="select" value={docType} onChange={(e) => setDocType(e.target.value)}>
              {types.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Déposer un fichier</label>
            <input className="input" type="file" accept="image/*,.pdf,.doc,.docx" onChange={onFile} disabled={busy} />
          </div>
        </div>
        {err ? <div className="err-text" style={{ marginBottom: 12 }}>{err}</div> : null}

        {docs.length === 0 ? (
          <EmptyState icon="▤" title="Aucun document" message="Les documents déposés apparaîtront ici." />
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>Type</th><th>Fichier</th><th>Déposé le</th><th style={{ textAlign: 'right' }}>Action</th></tr></thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d._id}>
                    <td>{d.docType}</td>
                    <td><a href={d.fileUrl} target="_blank" rel="noreferrer">{d.fileName}</a></td>
                    <td className="muted">{formatDate(d.createdAt)}</td>
                    <td style={{ textAlign: 'right' }}><button className="btn btn-danger btn-sm" onClick={() => remove(d._id)}>Retirer</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
