'use client';
import { useEffect, useState, useCallback } from 'react';
import { ShareCapitalAPI, MembersAPI, errorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import Loading from '@/components/Loading';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';

export default function ShareCapitalPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [showModal, setShowModal] = useState(null); // 'subscribe' | 'reimburse' | null

  const load = useCallback(async () => {
    try { const { data } = await ShareCapitalAPI.overview(); setData(data); }
    catch (e) { setErr(errorMessage(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loading />;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">Parts sociales</div>
          <div className="page-sub">Capital variable des sociétaires — distinct de l'épargne</div>
        </div>
        <div className="inline-actions">
          <button className="btn btn-outline btn-sm" onClick={() => setShowModal('reimburse')}>Remboursement</button>
          <button className="btn btn-gold btn-sm" onClick={() => setShowModal('subscribe')}>Nouvelle souscription</button>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 22 }}>
        <div className="stat navy">
          <div className="stat-label">Capital total (parts sociales)</div>
          <div className="stat-value tnum">{formatMoney(data?.grandTotal || 0)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Valeur nominale d'une part</div>
          <div className="stat-value tnum">{formatMoney(data?.unitValue || 0)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Sociétaires détenant des parts</div>
          <div className="stat-value tnum">{data?.data?.length || 0}</div>
        </div>
      </div>

      {err ? <div className="err-text section-gap">{err}</div> : null}

      <div className="card">
        <div className="card-head"><div className="card-title">Détention par sociétaire</div></div>
        {(data?.data || []).length === 0 ? (
          <EmptyState icon="₵" title="Aucune part souscrite" message="Les souscriptions apparaîtront ici." />
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>Membre</th><th>Nombre de parts</th><th>Valeur</th></tr></thead>
              <tbody>
                {data.data.map((r) => (
                  <tr key={r.memberId}>
                    <td>{r.firstName} {r.lastName}<div className="muted mono" style={{ fontSize: 11.5 }}>{r.memberNumber}</div></td>
                    <td className="mono" style={{ fontWeight: 600 }}>{r.totalParts}</td>
                    <td className="mono" style={{ fontWeight: 600 }}>{formatMoney(r.totalValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal ? (
        <ShareMovementModal mode={showModal} onClose={() => setShowModal(null)} onSaved={() => { setShowModal(null); load(); }} />
      ) : null}
    </div>
  );
}

function ShareMovementModal({ mode, onClose, onSaved }) {
  const [q, setQ] = useState('');
  const [options, setOptions] = useState([]);
  const [memberId, setMemberId] = useState('');
  const [numberOfParts, setNumberOfParts] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const isSubscribe = mode === 'subscribe';

  useEffect(() => {
    if (q.trim().length < 2) { setOptions([]); return; }
    const t = setTimeout(() => {
      MembersAPI.list(q).then(({ data }) => setOptions(data.data || [])).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const submit = async () => {
    if (!memberId) return setErr('Sélectionnez un membre.');
    if (!(Number(numberOfParts) > 0)) return setErr('Nombre de parts invalide.');
    setBusy(true); setErr('');
    try {
      const payload = { memberId, numberOfParts: Number(numberOfParts), note };
      if (isSubscribe) payload.paymentMethod = paymentMethod;
      if (isSubscribe) await ShareCapitalAPI.subscribe(payload);
      else await ShareCapitalAPI.reimburse(payload);
      onSaved();
    } catch (e) { setErr(errorMessage(e)); }
    finally { setBusy(false); }
  };

  return (
    <Modal title={isSubscribe ? 'Nouvelle souscription de parts' : 'Remboursement de parts'} onClose={onClose}
      footer={<><button className="btn btn-outline" onClick={onClose}>Annuler</button><button className="btn btn-gold" onClick={submit} disabled={busy}>{busy ? 'Enregistrement…' : 'Confirmer'}</button></>}>
      <div className="field">
        <label className="label">Membre</label>
        <input className="input" value={q} onChange={(e) => { setQ(e.target.value); setMemberId(''); }} placeholder="Rechercher un membre par nom ou numéro..." />
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
      <div className="field"><label className="label">Nombre de parts</label><input className="input" type="number" min="1" value={numberOfParts} onChange={(e) => setNumberOfParts(e.target.value)} /></div>
      {isSubscribe ? (
        <div className="field"><label className="label">Mode de paiement</label>
          <select className="select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="cash">Espèces</option>
            <option value="mobile_money">Mobile Money</option>
          </select>
        </div>
      ) : null}
      <div className="field"><label className="label">Note (optionnel)</label><textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} /></div>
      {err ? <div className="err-text">{err}</div> : null}
    </Modal>
  );
}
