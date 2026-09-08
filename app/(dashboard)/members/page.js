'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus } from 'lucide-react';
import { MembersAPI, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate, statusLabel, statusTone, can } from '@/lib/format';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';

const STATUS_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'active', label: 'Actifs' },
  { value: 'suspended', label: 'Suspendus' },
  { value: 'pending', label: 'En attente' },
];

export default function MembersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [showNew, setShowNew] = useState(false);

  const load = useCallback(async (query, st) => {
    setLoading(true); setErr('');
    try {
      const { data } = await MembersAPI.list(query, st, 1);
      setItems(data.data || []);
    } catch (e) { setErr(errorMessage(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => load(q, status), 300);
    return () => clearTimeout(id);
  }, [q, status, load]);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">Membres</div>
          <div className="page-sub">Rechercher, consulter et enregistrer les membres</div>
        </div>
        {can.memberEdit(user?.role) || ['agent', 'cashier'].includes(user?.role) ? (
          <button className="btn btn-primary" onClick={() => setShowNew(true)}><Plus size={16} /> Nouveau membre</button>
        ) : null}
      </div>

      <div className="card">
        <div className="card-pad" style={{ paddingBottom: 12 }}>
          <div className="row between" style={{ gap: 14, flexWrap: 'wrap' }}>
            <div className="search" style={{ flex: 1, minWidth: 240 }}>
              <span className="search-ico"><Search size={16} strokeWidth={2.2} /></span>
              <input className="input" placeholder="Nom, téléphone ou N° membre" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="chips">
              {STATUS_FILTERS.map((f) => (
                <div key={f.value} className={`chip ${status === f.value ? 'active' : ''}`} onClick={() => setStatus(f.value)}>{f.label}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : items.length === 0 ? (
            err ? <div className="err-text" style={{ padding: 20 }}>{err}</div>
            : <EmptyState icon="◉" title="Aucun membre" message={q ? 'Aucun résultat pour cette recherche.' : 'Enregistrez le premier membre.'} />
          ) : (
            <table className="tbl">
              <thead><tr><th>Membre</th><th>N° membre</th><th>Téléphone</th><th>Statut</th><th>Inscrit le</th></tr></thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m._id} className="click" onClick={() => router.push(`/members/${m._id}`)}>
                    <td style={{ fontWeight: 600 }}>{m.firstName} {m.lastName}</td>
                    <td className="mono">{m.memberNumber}</td>
                    <td>{m.phone}</td>
                    <td><Badge tone={statusTone(m.status)}>{statusLabel(m.status)}</Badge></td>
                    <td className="muted">{formatDate(m.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showNew ? <NewMemberModal onClose={() => setShowNew(false)} onCreated={(id) => { setShowNew(false); router.push(`/members/${id}`); }} /> : null}
    </div>
  );
}

function NewMemberModal({ onClose, onCreated }) {
  const [f, setF] = useState({ firstName: '', lastName: '', phone: '', pin: '', email: '', nationalId: '', profession: '', monthlyIncome: '', address: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async () => {
    setErr('');
    if (!f.firstName.trim() || !f.lastName.trim() || !f.phone.trim()) { setErr('Nom, prénom et téléphone sont requis.'); return; }
    setBusy(true);
    try {
      const payload = { ...f, monthlyIncome: f.monthlyIncome ? Number(f.monthlyIncome) : undefined };
      Object.keys(payload).forEach((k) => { if (payload[k] === '' ) delete payload[k]; });
      const { data } = await MembersAPI.register(payload);
      onCreated(data.member.id);
    } catch (e) { setErr(errorMessage(e)); }
    finally { setBusy(false); }
  };

  return (
    <Modal title="Enregistrer un membre" onClose={onClose}
      footer={<><button className="btn btn-outline" onClick={onClose}>Annuler</button><button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button></>}>
      <div className="grid grid-2" style={{ gap: 0, gridTemplateColumns: '1fr 1fr', columnGap: 14 }}>
        <div className="field"><label className="label">Prénom *</label><input className="input" value={f.firstName} onChange={set('firstName')} /></div>
        <div className="field"><label className="label">Nom *</label><input className="input" value={f.lastName} onChange={set('lastName')} /></div>
      </div>
      <div className="field"><label className="label">Téléphone *</label><input className="input" value={f.phone} onChange={set('phone')} placeholder="08XXXXXXXX" /></div>
      <div className="field"><label className="label">Code PIN initial (optionnel)</label><input className="input" value={f.pin} onChange={(e) => setF((s) => ({ ...s, pin: e.target.value.replace(/[^0-9]/g, '') }))} maxLength={6} placeholder="4 à 6 chiffres" /><div className="hint">Le membre pourra le modifier depuis son app.</div></div>
      <div className="field"><label className="label">E-mail</label><input className="input" value={f.email} onChange={set('email')} /></div>
      <div className="grid grid-2" style={{ gap: 0, gridTemplateColumns: '1fr 1fr', columnGap: 14 }}>
        <div className="field"><label className="label">Pièce d'identité</label><input className="input" value={f.nationalId} onChange={set('nationalId')} /></div>
        <div className="field"><label className="label">Profession</label><input className="input" value={f.profession} onChange={set('profession')} /></div>
      </div>
      <div className="field"><label className="label">Revenu mensuel (CDF)</label><input className="input" value={f.monthlyIncome} onChange={(e) => setF((s) => ({ ...s, monthlyIncome: e.target.value.replace(/[^0-9]/g, '') }))} /></div>
      <div className="field"><label className="label">Adresse</label><input className="input" value={f.address} onChange={set('address')} /></div>
      {err ? <div className="err-text">{err}</div> : null}
    </Modal>
  );
}
