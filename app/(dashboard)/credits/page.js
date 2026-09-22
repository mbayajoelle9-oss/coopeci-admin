'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CreditAPI, MembersAPI, CreditProductAPI, errorMessage } from '@/lib/api';
import { formatMoney, formatDate, statusLabel, statusTone, can } from '@/lib/format';
import { useAuth } from '@/lib/auth';
import Badge from '@/components/Badge';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';

const FILTERS = [
  { value: '', label: 'Toutes' },
  { value: 'submitted', label: 'Soumises' },
  { value: 'under_review', label: 'En examen' },
  { value: 'pending_committee', label: 'Au comité' },
  { value: 'approved', label: 'Approuvées' },
  { value: 'rejected', label: 'Refusées' },
  { value: 'disbursed', label: 'Décaissées' },
];

export default function CreditsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [printingId, setPrintingId] = useState(null);

  const printContract = async (e, applicationId) => {
    e.stopPropagation();
    setPrintingId(applicationId);
    try {
      const { data: byApp } = await CreditAPI.byApplication(applicationId);
      const { data } = await CreditAPI.printContract(byApp.credit._id);
      const url = URL.createObjectURL(data);
      window.open(url, '_blank');
    } catch (er) { alert(errorMessage(er)); }
    finally { setPrintingId(null); }
  };

  const load = useCallback(async (st) => {
    setLoading(true); setErr('');
    try { const { data } = await CreditAPI.applications(st, 1); setItems(data.data || []); }
    catch (e) { setErr(errorMessage(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(status); }, [status, load]);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">Demandes de crédit</div>
          <div className="page-sub">Suivi et instruction des dossiers</div>
        </div>
        {can.creditEncode(user?.role) ? (
          <button className="btn btn-gold btn-sm" onClick={() => setShowNew(true)}>+ Nouvelle demande (présentiel)</button>
        ) : null}
      </div>

      <div className="card">
        <div className="card-pad" style={{ paddingBottom: 12 }}>
          <div className="chips">
            {FILTERS.map((f) => <div key={f.value} className={`chip ${status === f.value ? 'active' : ''}`} onClick={() => setStatus(f.value)}>{f.label}</div>)}
          </div>
        </div>
        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : items.length === 0 ? (
            err ? <div className="err-text" style={{ padding: 20 }}>{err}</div> : <EmptyState icon="₵" title="Aucune demande" message="Aucun dossier pour ce filtre." />
          ) : (
            <table className="tbl">
              <thead><tr><th>Dossier</th><th>Membre</th><th>Montant</th><th>Durée</th><th>Statut</th><th>Créée le</th><th style={{ textAlign: 'right' }}>Action</th></tr></thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a._id} className="click" onClick={() => router.push(`/credits/${a._id}`)}>
                    <td className="mono" style={{ fontWeight: 600 }}>{a.applicationNumber}</td>
                    <td>{a.member ? `${a.member.firstName} ${a.member.lastName}` : '—'}<div className="muted mono" style={{ fontSize: 11.5 }}>{a.member?.memberNumber}</div></td>
                    <td className="mono">{formatMoney(a.amountRequested)}</td>
                    <td>{a.duration} mois</td>
                    <td><Badge tone={statusTone(a.status)}>{statusLabel(a.status)}</Badge></td>
                    <td className="muted">{formatDate(a.createdAt)}</td>
                    <td style={{ textAlign: 'right' }}>
                      {a.status === 'disbursed' ? (
                        <button className="btn btn-outline btn-sm" onClick={(e) => printContract(e, a._id)} disabled={printingId === a._id}>{printingId === a._id ? '…' : 'Imprimer'}</button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showNew ? <NewApplicationModal onClose={() => setShowNew(false)} onSaved={(id) => { setShowNew(false); router.push(`/credits/${id}`); }} /> : null}
    </div>
  );
}

function NewApplicationModal({ onClose, onSaved }) {
  const [q, setQ] = useState('');
  const [options, setOptions] = useState([]);
  const [memberId, setMemberId] = useState('');
  const [products, setProducts] = useState([]);
  const [f, setF] = useState({
    amountRequested: '', duration: '', productId: '', purpose: '',
    monthlyIncome: '', monthlyExpenses: '', proposedGuarantees: '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { CreditProductAPI.list().then(({ data }) => setProducts(data.data || [])).catch(() => {}); }, []);

  useEffect(() => {
    if (q.trim().length < 2) { setOptions([]); return; }
    const t = setTimeout(() => {
      MembersAPI.list(q).then(({ data }) => setOptions(data.data || [])).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async () => {
    if (!memberId) return setErr('Sélectionnez le membre présent au bureau.');
    if (!(Number(f.amountRequested) > 0) || !(Number(f.duration) > 0)) return setErr('Montant et durée requis.');
    setBusy(true); setErr('');
    try {
      const payload = {
        memberId, amountRequested: Number(f.amountRequested), duration: Number(f.duration),
        purpose: f.purpose, proposedGuarantees: f.proposedGuarantees,
        monthlyIncome: f.monthlyIncome ? Number(f.monthlyIncome) : undefined,
        monthlyExpenses: f.monthlyExpenses ? Number(f.monthlyExpenses) : undefined,
        productId: f.productId || undefined,
      };
      const { data } = await CreditAPI.create(payload);
      onSaved(data.application._id);
    } catch (e) { setErr(errorMessage(e)); }
    finally { setBusy(false); }
  };

  return (
    <Modal title="Nouvelle demande de crédit — présentiel" onClose={onClose}
      footer={<><button className="btn btn-outline" onClick={onClose}>Annuler</button><button className="btn btn-gold" onClick={submit} disabled={busy}>{busy ? '…' : 'Soumettre'}</button></>}>
      <div className="hint" style={{ marginBottom: 12 }}>À utiliser quand le membre se présente en personne au bureau (obligatoire au-delà de 500 $). La demande passera ensuite normalement par le vote du Conseil d'Administration.</div>

      <div className="field">
        <label className="label">Membre présent au bureau</label>
        <input className="input" value={q} onChange={(e) => { setQ(e.target.value); setMemberId(''); }} placeholder="Rechercher par nom ou numéro..." />
        {options.length > 0 && !memberId ? (
          <div className="card" style={{ marginTop: 6, padding: 6, maxHeight: 160, overflowY: 'auto' }}>
            {options.map((m) => (
              <div key={m._id} onClick={() => { setMemberId(m._id); setQ(`${m.firstName} ${m.lastName} (${m.memberNumber})`); setOptions([]); }}
                style={{ padding: '7px 8px', cursor: 'pointer', borderRadius: 8, fontSize: 12.5 }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-alt)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                {m.firstName} {m.lastName} — {m.memberNumber}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {products.length > 0 ? (
        <div className="field"><label className="label">Produit de crédit (optionnel)</label>
          <select className="select" value={f.productId} onChange={set('productId')}>
            <option value="">— Générique —</option>
            {products.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.interestRate}%, {p.minDuration}-{p.maxDuration} mois)</option>)}
          </select>
        </div>
      ) : null}

      <div className="grid grid-2" style={{ columnGap: 14 }}>
        <div className="field"><label className="label">Montant demandé</label><input className="input" type="number" value={f.amountRequested} onChange={set('amountRequested')} /></div>
        <div className="field"><label className="label">Durée (mois)</label><input className="input" type="number" value={f.duration} onChange={set('duration')} /></div>
      </div>
      <div className="field"><label className="label">Objet du crédit</label><input className="input" value={f.purpose} onChange={set('purpose')} /></div>
      <div className="grid grid-2" style={{ columnGap: 14 }}>
        <div className="field"><label className="label">Revenu mensuel</label><input className="input" type="number" value={f.monthlyIncome} onChange={set('monthlyIncome')} /></div>
        <div className="field"><label className="label">Charges mensuelles</label><input className="input" type="number" value={f.monthlyExpenses} onChange={set('monthlyExpenses')} /></div>
      </div>
      <div className="field"><label className="label">Garanties proposées</label><textarea className="textarea" value={f.proposedGuarantees} onChange={set('proposedGuarantees')} /></div>
      {err ? <div className="err-text">{err}</div> : null}
    </Modal>
  );
}
