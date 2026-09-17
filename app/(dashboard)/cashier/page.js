'use client';
import { useEffect, useState, useCallback } from 'react';
import { TxAPI, errorMessage } from '@/lib/api';
import { formatMoney, formatDate, trxLabel } from '@/lib/format';
import Badge from '@/components/Badge';
import EmptyState from '@/components/EmptyState';
import Loading from '@/components/Loading';

export default function CashierPage() {
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
    } catch (e) {
      alert("Le reçu n'a pas pu être ouvert : " + errorMessage(e));
    }
  };

  const act = async (t, approve) => {
    setBusyId(t._id);
    try {
      if (t.type === 'deposit') {
        await TxAPI.confirmDeposit(t.reference);
        // Encaissement espèces validé : le reçu s'ouvre aussitôt, au même moment.
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
      <div className="page-head">
        <div>
          <div className="page-title">Caisse</div>
          <div className="page-sub">Opérations en attente de validation</div>
        </div>
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
