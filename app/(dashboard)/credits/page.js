'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CreditAPI, errorMessage } from '@/lib/api';
import { formatMoney, formatDate, statusLabel, statusTone } from '@/lib/format';
import Badge from '@/components/Badge';
import EmptyState from '@/components/EmptyState';

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
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

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
              <thead><tr><th>Dossier</th><th>Membre</th><th>Montant</th><th>Durée</th><th>Statut</th><th>Créée le</th></tr></thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a._id} className="click" onClick={() => router.push(`/credits/${a._id}`)}>
                    <td className="mono" style={{ fontWeight: 600 }}>{a.applicationNumber}</td>
                    <td>{a.member ? `${a.member.firstName} ${a.member.lastName}` : '—'}<div className="muted mono" style={{ fontSize: 11.5 }}>{a.member?.memberNumber}</div></td>
                    <td className="mono">{formatMoney(a.amountRequested)}</td>
                    <td>{a.duration} mois</td>
                    <td><Badge tone={statusTone(a.status)}>{statusLabel(a.status)}</Badge></td>
                    <td className="muted">{formatDate(a.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
