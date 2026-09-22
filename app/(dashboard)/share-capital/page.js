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
  const [historyMember, setHistoryMember] = useState(null);

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
                  <tr key={r.memberId} style={{ cursor: 'pointer' }} onClick={() => setHistoryMember(r)}>
                    <td>{r.firstName} {r.lastName}<div className="muted mono" style={{ fontSize: 11.5 }}>{r.memberNumber}</div></td>
                    <td className="mono" style={{ fontWeight: 600 }}>{r.totalParts}</td>
                    <td className="mono" style={{ fontWeight: 600 }}>{formatMoney(r.totalValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="hint" style={{ padding: '10px 16px 14px' }}>Cliquer sur un membre pour voir son historique et imprimer une attestation.</div>
      </div>

      {showModal ? (
        <ShareMovementModal mode={showModal} onClose={() => setShowModal(null)} onSaved={() => { setShowModal(null); load(); }} />
      ) : null}
      {historyMember ? (
        <HistoryModal member={historyMember} onClose={() => setHistoryMember(null)} />
      ) : null}
    </div>
  );
}

function HistoryModal({ member, onClose }) {
  const [history, setHistory] = useState(null);
  const [err, setErr] = useState('');
  const [printingId, setPrintingId] = useState(null);

  useEffect(() => {
    ShareCapitalAPI.memberSummary(member.memberId).then((r) => setHistory(r.data.history || [])).catch((e) => setErr(errorMessage(e)));
  }, [member.memberId]);

  const print = async (shareId) => {
    setPrintingId(shareId);
    try {
      const { data } = await ShareCapitalAPI.printCertificate(shareId);
      const url = URL.createObjectURL(data);
      window.open(url, '_blank');
    } catch (e) { alert(errorMessage(e)); }
    finally { setPrintingId(null); }
  };

  return (
    <Modal title={`Historique — ${member.firstName} ${member.lastName}`} onClose={onClose} footer={<button className="btn btn-outline" onClick={onClose}>Fermer</button>}>
      {err ? <div className="err-text">{err}</div> : null}
      {!history ? <Loading /> : history.length === 0 ? (
        <EmptyState icon="₵" title="Aucun mouvement" message="Aucune souscription ni remboursement pour ce membre." />
      ) : (
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>Type</th><th>Parts</th><th>Montant</th><th>Date</th><th style={{ textAlign: 'right' }}>Action</th></tr></thead>
            <tbody>
              {history.map((h) => (
                <tr key={h._id}>
                  <td>{h.type === 'subscription' ? 'Souscription' : 'Remboursement'}<div className="muted mono" style={{ fontSize: 11 }}>{h.reference}</div></td>
                  <td className="mono">{h.numberOfParts}</td>
                  <td className="mono">{formatMoney(h.amount)}</td>
                  <td className="muted">{new Date(h.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => print(h._id)} disabled={printingId === h._id}>{printingId === h._id ? '…' : 'Imprimer'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
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
  const [created, setCreated] = useState(null);
  const [printing, setPrinting] = useState(false);
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
      const { data } = isSubscribe ? await ShareCapitalAPI.subscribe(payload) : await ShareCapitalAPI.reimburse(payload);
      setCreated(data.share);
    } catch (e) { setErr(errorMessage(e)); }
    finally { setBusy(false); }
  };

  const printCertificate = async () => {
    setPrinting(true);
    try {
      const { data } = await ShareCapitalAPI.printCertificate(created._id);
      const url = URL.createObjectURL(data);
      window.open(url, '_blank');
    } catch (e) { alert(errorMessage(e)); }
    finally { setPrinting(false); }
  };

  if (created) {
    return (
      <Modal title="Mouvement enregistré" onClose={() => onSaved()}
        footer={<><button className="btn btn-outline" onClick={() => onSaved()}>Fermer</button><button className="btn btn-gold" onClick={printCertificate} disabled={printing}>{printing ? '…' : "Imprimer l'attestation"}</button></>}>
        <div className="hint">Le mouvement (réf. {created.reference}) a bien été enregistré. Vous pouvez imprimer l'attestation à remettre au sociétaire.</div>
      </Modal>
    );
  }

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
