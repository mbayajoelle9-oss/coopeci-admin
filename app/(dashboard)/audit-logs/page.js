'use client';
import { useEffect, useState, useCallback } from 'react';
import { GovernanceAPI, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/format';
import Loading from '@/components/Loading';
import EmptyState from '@/components/EmptyState';
import Badge from '@/components/Badge';

const MODULES = ['', 'auth', 'member', 'account', 'transaction', 'credit', 'committee', 'report', 'admin', 'notification', 'system', 'accounting'];

export default function AuditLogsPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [moduleFilter, setModuleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await GovernanceAPI.auditLogs({ module: moduleFilter || undefined, page, limit: 30 });
      setItems(data.data || []);
      setPagination(data.pagination);
    } catch (e) { setErr(errorMessage(e)); }
    finally { setLoading(false); }
  }, [moduleFilter, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">Pistes d'audit</div>
          <div className="page-sub">Historique complet des opérations — qui, quoi, quand</div>
        </div>
        <select className="select" style={{ width: 200 }} value={moduleFilter} onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}>
          {MODULES.map((m) => <option key={m} value={m}>{m || 'Tous les modules'}</option>)}
        </select>
      </div>

      {err ? <div className="err-text section-gap">{err}</div> : null}
      {loading ? <Loading /> : (
        <div className="card">
          {items.length === 0 ? (
            <EmptyState icon="▤" title="Aucune entrée" message="Aucune opération journalisée pour ce filtre." />
          ) : (
            <div className="table-wrap">
              <table className="tbl">
                <thead><tr><th>Date</th><th>Auteur</th><th>Module</th><th>Action</th><th>Statut</th></tr></thead>
                <tbody>
                  {items.map((log) => (
                    <tr key={log._id}>
                      <td className="muted">{formatDate(log.timestamp, true)}</td>
                      <td>{log.user?.name || (log.member ? `${log.member.firstName} ${log.member.lastName}` : 'Système')}
                        {log.user?.role ? <div className="faint" style={{ fontSize: 11 }}>{log.user.role}</div> : null}</td>
                      <td><Badge tone="info">{log.module}</Badge></td>
                      <td className="mono muted" style={{ fontSize: 12 }}>{log.action}</td>
                      <td><Badge tone={log.status === 'success' ? 'success' : log.status === 'failure' ? 'danger' : 'warning'}>{log.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {pagination && pagination.pages > 1 ? (
            <div className="row" style={{ justifyContent: 'center', gap: 10, padding: 14 }}>
              <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Précédent</button>
              <span className="muted" style={{ fontSize: 12 }}>Page {pagination.page} / {pagination.pages}</span>
              <button className="btn btn-outline btn-sm" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>Suivant</button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
