'use client';
import { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { ReportAPI, errorMessage } from '@/lib/api';
import { formatMoney, trxLabel } from '@/lib/format';
import StatCard from '@/components/StatCard';
import Loading from '@/components/Loading';
import EmptyState from '@/components/EmptyState';

const BAR_COLORS = ['#137A4B', '#B23B32', '#22406A', '#B8860B', '#2563A6', '#8A7320'];

export default function ReportsPage() {
  const [par, setPar] = useState(null);
  const [tx, setTx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [p, t] = await Promise.allSettled([ReportAPI.par(), ReportAPI.transactions({})]);
        if (p.status === 'fulfilled') setPar(p.value.data.data);
        if (t.status === 'fulfilled') {
          const raw = t.value.data.data || t.value.data.report || [];
          setTx(Array.isArray(raw) ? raw : []);
        }
        if (p.status === 'rejected' && t.status === 'rejected') setErr(errorMessage(p.reason));
      } catch (e) { setErr(errorMessage(e)); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <Loading />;

  const txData = tx.map((r) => ({ name: trxLabel(r._id), total: r.total || 0, count: r.count || 0 }));

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">Rapports</div>
          <div className="page-sub">Portefeuille à risque et flux de transactions</div>
        </div>
      </div>

      <div className="grid grid-3">
        <StatCard navy label="Portefeuille à risque (PAR)" value={par ? `${par.parRatio}%` : '—'} foot="ratio en retard / encours" />
        <StatCard label="Encours total" value={par ? formatMoney(par.outstanding) : '—'} foot="crédits actifs + en retard" />
        <StatCard label="Montant en retard" value={par ? formatMoney(par.atRisk) : '—'} foot="crédits en souffrance" />
      </div>

      <div className="card section-gap">
        <div className="card-head"><div className="card-title">Transactions par type</div></div>
        <div className="card-pad">
          {txData.length === 0 ? (
            <EmptyState icon="▤" title="Aucune donnée" message={err || 'Aucune transaction à rapporter.'} />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={txData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip formatter={(v, n) => n === 'total' ? [formatMoney(v), 'Montant'] : [v, 'Nombre']} />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                    {txData.map((d, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="table-wrap section-gap">
                <table className="tbl">
                  <thead><tr><th>Type</th><th>Nombre</th><th>Montant total</th></tr></thead>
                  <tbody>
                    {txData.map((d, i) => (
                      <tr key={i}><td style={{ fontWeight: 600 }}>{d.name}</td><td className="mono">{d.count}</td><td className="mono">{formatMoney(d.total)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
