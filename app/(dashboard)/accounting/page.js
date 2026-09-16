'use client';
import { useEffect, useState, useCallback } from 'react';
import { Banknote, Landmark, CheckCircle2 } from 'lucide-react';
import { AccountingAPI, errorMessage } from '@/lib/api';
import { formatMoney, formatDate } from '@/lib/format';
import Loading from '@/components/Loading';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';

export default function AccountingPage() {
  const [pending, setPending] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, t] = await Promise.all([AccountingAPI.pending(), AccountingAPI.transfers()]);
      setPending(p.data);
      setTransfers(t.data.data || []);
      setSelected({});
    } catch (e) { setErr(errorMessage(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loading />;

  const items = pending?.data || [];
  const selectedIds = Object.keys(selected).filter((id) => selected[id]);
  const selectedTotal = items.filter((t) => selected[t._id]).reduce((s, t) => s + t.amount, 0);
  const allSelected = items.length > 0 && selectedIds.length === items.length;

  const toggleAll = () => {
    if (allSelected) setSelected({});
    else setSelected(Object.fromEntries(items.map((t) => [t._id, true])));
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">Comptabilité</div>
          <div className="page-sub">Suivi des dépôts Mobile Money en attente de virement vers la banque</div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={load}>↻ Actualiser</button>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 22 }}>
        <div className="stat navy">
          <div className="stat-label">En attente de virement vers la banque</div>
          <div className="stat-value tnum">{formatMoney(pending?.total || 0)}</div>
          <div className="stat-foot">{pending?.count || 0} dépôt(s) Mobile Money non reversé(s)</div>
        </div>
        <div className="stat">
          <div className="stat-label">Total déjà viré (historique)</div>
          <div className="stat-value tnum">{formatMoney(transfers.reduce((s, t) => s + t.amount, 0))}</div>
          <div className="stat-foot">{transfers.length} virement(s) enregistré(s)</div>
        </div>
      </div>

      {err ? <div className="err-text section-gap">{err}</div> : null}

      <div className="card section-gap">
        <div className="card-head between">
          <div className="card-title">Dépôts en attente de virement</div>
          {items.length > 0 ? (
            <button className="btn btn-gold btn-sm" disabled={selectedIds.length === 0} onClick={() => setShowModal(true)}>
              Enregistrer un virement ({selectedIds.length})
            </button>
          ) : null}
        </div>
        {items.length === 0 ? (
          <EmptyState icon="₵" title="Rien en attente" message="Tous les dépôts Mobile Money ont déjà été reversés à la banque." />
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr>
                <th><input type="checkbox" checked={allSelected} onChange={toggleAll} /></th>
                <th>Membre</th><th>Montant</th><th>Référence</th><th>Reçu le</th>
              </tr></thead>
              <tbody>
                {items.map((t) => {
                  const name = t.member ? `${t.member.firstName || ''} ${t.member.lastName || ''}`.trim() : '—';
                  return (
                    <tr key={t._id}>
                      <td><input type="checkbox" checked={!!selected[t._id]} onChange={(e) => setSelected((s) => ({ ...s, [t._id]: e.target.checked }))} /></td>
                      <td>{name}<div className="muted mono" style={{ fontSize: 11.5 }}>{t.member?.memberNumber || ''}</div></td>
                      <td className="mono" style={{ fontWeight: 600 }}>{formatMoney(t.amount, t.currency)}</td>
                      <td className="mono muted" style={{ fontSize: 12.5 }}>{t.reference}</td>
                      <td className="muted">{formatDate(t.createdAt, true)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card section-gap">
        <div className="card-head"><div className="card-title">Historique des virements</div></div>
        {transfers.length === 0 ? (
          <EmptyState icon="▤" title="Aucun virement enregistré" message="L'historique apparaîtra ici après le premier virement." />
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>Date</th><th>Montant</th><th>Référence</th><th>Banque</th><th>Transactions</th><th>Enregistré par</th></tr></thead>
              <tbody>
                {transfers.map((tr) => (
                  <tr key={tr._id}>
                    <td className="muted">{formatDate(tr.createdAt, true)}</td>
                    <td className="mono" style={{ fontWeight: 600 }}>{formatMoney(tr.amount, tr.currency)}</td>
                    <td className="mono muted" style={{ fontSize: 12.5 }}>{tr.reference}</td>
                    <td className="muted">{tr.bankName || '—'}</td>
                    <td className="muted">{tr.transactionCount}</td>
                    <td className="muted">{tr.createdBy?.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal ? (
        <RecordTransferModal
          selectedIds={selectedIds}
          suggestedAmount={selectedTotal}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }}
        />
      ) : null}
    </div>
  );
}

function RecordTransferModal({ selectedIds, suggestedAmount, onClose, onSaved }) {
  const [amount, setAmount] = useState(suggestedAmount);
  const [reference, setReference] = useState('');
  const [bankName, setBankName] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    if (!(amount > 0)) return setErr('Montant invalide.');
    if (!reference.trim()) return setErr('La référence du virement bancaire est requise.');
    setBusy(true); setErr('');
    try {
      await AccountingAPI.recordTransfer({ amount: Number(amount), reference: reference.trim(), bankName: bankName.trim(), note: note.trim(), transactionIds: selectedIds });
      onSaved();
    } catch (e) { setErr(errorMessage(e)); }
    finally { setBusy(false); }
  };

  return (
    <Modal title="Enregistrer un virement bancaire" onClose={onClose}
      footer={<><button className="btn btn-outline" onClick={onClose}>Annuler</button><button className="btn btn-gold" onClick={submit} disabled={busy}>{busy ? 'Enregistrement…' : 'Confirmer le virement'}</button></>}>
      <div className="hint" style={{ marginBottom: 14 }}>
        {selectedIds.length} dépôt(s) sélectionné(s) — montant suggéré rempli automatiquement, ajustable si le virement bancaire réel diffère légèrement.
      </div>
      <div className="field"><label className="label">Montant viré (CDF)</label><input className="input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
      <div className="field"><label className="label">Référence du virement bancaire</label><input className="input" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Ex : virement RAWBANK n°..." /></div>
      <div className="field"><label className="label">Banque (optionnel)</label><input className="input" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Ex : RAWBANK" /></div>
      <div className="field"><label className="label">Note (optionnel)</label><textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} /></div>
      {err ? <div className="err-text">{err}</div> : null}
    </Modal>
  );
}
