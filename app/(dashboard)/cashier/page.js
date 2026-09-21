'use client';
import { useEffect, useState, useCallback } from 'react';
import { TxAPI, CashOpsAPI, errorMessage } from '@/lib/api';
import { formatMoney, formatDate, trxLabel } from '@/lib/format';
import { useAuth } from '@/lib/auth';
import Badge from '@/components/Badge';
import EmptyState from '@/components/EmptyState';
import Loading from '@/components/Loading';
import Modal from '@/components/Modal';

export default function CashierPage() {
  const [tab, setTab] = useState('queue');
  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">Caisse</div>
          <div className="page-sub">Opérations, approvisionnements, corrections et état journalier</div>
        </div>
      </div>
      <div className="chips section-gap" style={{ marginBottom: 18 }}>
        <button className={`chip ${tab === 'queue' ? 'active' : ''}`} onClick={() => setTab('queue')}>File d'attente</button>
        <button className={`chip ${tab === 'sensitive' ? 'active' : ''}`} onClick={() => setTab('sensitive')}>Opérations sensibles</button>
        <button className={`chip ${tab === 'report' ? 'active' : ''}`} onClick={() => setTab('report')}>État journalier</button>
      </div>
      {tab === 'queue' ? <QueueTab /> : null}
      {tab === 'sensitive' ? <SensitiveTab /> : null}
      {tab === 'report' ? <ReportTab /> : null}
    </div>
  );
}

function QueueTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try { const { data } = await TxAPI.pending(); setItems(data.data || []); }
    catch (e) { setErr(errorMessage(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openReceipt = async (reference) => {
    try {
      const { data } = await TxAPI.receipt(reference);
      const url = URL.createObjectURL(data);
      window.open(url, '_blank');
    } catch (e) { alert("Le reçu n'a pas pu être ouvert : " + errorMessage(e)); }
  };

  const act = async (t, approve) => {
    setBusyId(t._id);
    try {
      if (t.type === 'deposit') {
        await TxAPI.confirmDeposit(t.reference);
        await openReceipt(t.reference);
      } else {
        await TxAPI.validateWithdrawal(t._id, approve);
      }
      await load();
    } catch (e) { alert(errorMessage(e)); }
    finally { setBusyId(null); }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="row" style={{ justifyContent: 'flex-end', marginBottom: 10 }}>
        <button className="btn btn-outline btn-sm" onClick={load}>↻ Actualiser</button>
      </div>
      {items.length === 0 ? (
        <div className="card"><EmptyState icon="▦" title="File vide" message={err || 'Aucune opération en attente.'} /></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>Type</th><th>Membre</th><th>Montant</th><th>Référence</th><th>Reçue le</th><th style={{ textAlign: 'right' }}>Action</th></tr></thead>
              <tbody>
                {items.map((t) => {
                  const isDep = t.type === 'deposit';
                  const name = t.member ? `${t.member.firstName || ''} ${t.member.lastName || ''}`.trim() : '—';
                  return (
                    <tr key={t._id}>
                      <td><Badge tone={isDep ? 'success' : 'warning'}>{trxLabel(t.type)}</Badge></td>
                      <td>{name}<div className="muted mono" style={{ fontSize: 11.5 }}>{t.member?.memberNumber || ''}</div></td>
                      <td className="mono" style={{ fontWeight: 600 }}>{formatMoney(t.amount, t.currency)}</td>
                      <td className="mono muted" style={{ fontSize: 12.5 }}>{t.reference}</td>
                      <td className="muted">{formatDate(t.createdAt, true)}</td>
                      <td>
                        <div className="inline-actions" style={{ justifyContent: 'flex-end' }}>
                          <button className="btn btn-outline btn-sm" onClick={() => openReceipt(t.reference)}>Reçu</button>
                          {isDep ? (
                            <button className="btn btn-gold btn-sm" disabled={busyId === t._id} onClick={() => act(t, true)}>Confirmer</button>
                          ) : (
                            <>
                              <button className="btn btn-danger btn-sm" disabled={busyId === t._id} onClick={() => act(t, false)}>Refuser</button>
                              <button className="btn btn-gold btn-sm" disabled={busyId === t._id} onClick={() => act(t, true)}>Valider</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const TYPE_LABELS = { cash_supply: 'Approvisionnement de caisse', transaction_correction: 'Correction', transaction_cancellation: 'Annulation' };

function SensitiveTab() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try { const { data } = await CashOpsAPI.list(); setItems(data.data || []); }
    catch (e) { setErr(errorMessage(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const approve = async (id) => {
    setBusyId(id);
    try { await CashOpsAPI.approve(id); await load(); }
    catch (e) { alert(errorMessage(e)); }
    finally { setBusyId(null); }
  };
  const reject = async (id) => {
    const reason = prompt('Motif du refus ?') || '';
    setBusyId(id);
    try { await CashOpsAPI.reject(id, reason); await load(); }
    catch (e) { alert(errorMessage(e)); }
    finally { setBusyId(null); }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
        <div className="hint">Approvisionnement, correction et annulation exigent la validation d'une <b>autre</b> personne que celle qui propose.</div>
        <button className="btn btn-gold btn-sm" onClick={() => setShowNew(true)}>+ Proposer une opération</button>
      </div>
      {err ? <div className="err-text section-gap">{err}</div> : null}
      {items.length === 0 ? (
        <div className="card"><EmptyState icon="▦" title="Aucune opération" message="Les demandes proposées apparaîtront ici." /></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>Type</th><th>Détail</th><th>Proposé par</th><th>Statut</th><th style={{ textAlign: 'right' }}>Action</th></tr></thead>
              <tbody>
                {items.map((op) => {
                  const isSelf = op.initiatedBy?._id === user?.id;
                  return (
                    <tr key={op._id}>
                      <td>{TYPE_LABELS[op.type]}<div className="muted mono" style={{ fontSize: 11 }}>{op.reference}</div></td>
                      <td>{op.amount ? formatMoney(op.amount, op.currency) : (op.reason || '-')}</td>
                      <td>{op.initiatedBy?.name}<div className="faint" style={{ fontSize: 11 }}>{op.initiatedBy?.role}</div></td>
                      <td><Badge tone={op.status === 'approved' ? 'success' : op.status === 'rejected' ? 'danger' : 'warning'}>{op.status}</Badge></td>
                      <td style={{ textAlign: 'right' }}>
                        {op.status === 'pending' ? (
                          isSelf ? <span className="faint" style={{ fontSize: 11.5 }}>En attente d'un autre validateur</span> : (
                            <div className="inline-actions" style={{ justifyContent: 'flex-end' }}>
                              <button className="btn btn-danger btn-sm" disabled={busyId === op._id} onClick={() => reject(op._id)}>Rejeter</button>
                              <button className="btn btn-gold btn-sm" disabled={busyId === op._id} onClick={() => approve(op._id)}>Valider</button>
                            </div>
                          )
                        ) : <span className="faint" style={{ fontSize: 11.5 }}>{op.validatedBy?.name}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {showNew ? <NewOpModal onClose={() => setShowNew(false)} onSaved={() => { setShowNew(false); load(); }} /> : null}
    </div>
  );
}

function NewOpModal({ onClose, onSaved }) {
  const [type, setType] = useState('cash_supply');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    if (!reason.trim()) return setErr('Le motif est requis.');
    if (type === 'cash_supply' && !(Number(amount) > 0)) return setErr('Montant invalide.');
    setBusy(true); setErr('');
    try {
      await CashOpsAPI.create({ type, amount: type === 'cash_supply' ? Number(amount) : undefined, reason });
      onSaved();
    } catch (e) { setErr(errorMessage(e)); }
    finally { setBusy(false); }
  };

  return (
    <Modal title="Proposer une opération sensible" onClose={onClose}
      footer={<><button className="btn btn-outline" onClick={onClose}>Annuler</button><button className="btn btn-gold" onClick={submit} disabled={busy}>{busy ? '…' : 'Soumettre pour validation'}</button></>}>
      <div className="field"><label className="label">Type</label>
        <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="cash_supply">Approvisionnement de caisse</option>
        </select>
        <div className="hint">La correction/annulation d'une transaction précise se fait depuis sa fiche.</div>
      </div>
      {type === 'cash_supply' ? <div className="field"><label className="label">Montant (CDF)</label><input className="input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div> : null}
      <div className="field"><label className="label">Motif</label><textarea className="textarea" value={reason} onChange={(e) => setReason(e.target.value)} /></div>
      {err ? <div className="err-text">{err}</div> : null}
    </Modal>
  );
}

function ReportTab() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);

  const open = async () => {
    setBusy(true);
    try {
      const { data } = await CashOpsAPI.dailyReport(date);
      const url = URL.createObjectURL(data);
      window.open(url, '_blank');
    } catch (e) { alert(errorMessage(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="card">
      <div className="card-head"><div className="card-title">État journalier de caisse</div></div>
      <div className="card-pad">
        <div className="field" style={{ maxWidth: 240 }}><label className="label">Date</label><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <button className="btn btn-gold btn-sm" onClick={open} disabled={busy}>{busy ? 'Préparation…' : 'Générer le PDF'}</button>
      </div>
    </div>
  );
}
