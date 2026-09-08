'use client';
import { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';
import { ReportAPI, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatMoney, statusLabel, can } from '@/lib/format';
import StatCard from '@/components/StatCard';
import Loading from '@/components/Loading';

const COLORS = { active: '#137A4B', in_arrears: '#B23B32', completed: '#22406A', pending_disbursement: '#B8860B', disbursed: '#22406A' };

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [par, setPar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const reqs = [ReportAPI.dashboard()];
        if (can.par(user?.role)) reqs.push(ReportAPI.par());
        const [d, p] = await Promise.all(reqs);
        setData(d.data.data);
        if (p) setPar(p.data.data);
      } catch (e) { setErr(errorMessage(e)); }
      finally { setLoading(false); }
    })();
  }, [user]);

  if (loading) return <Loading />;
  if (err) return <div className="err-text">{err}</div>;

  const creditsByStatus = (data?.creditsByStatus || []).map((c) => ({
    key: c._id, name: statusLabel(c._id), count: c.count, amount: c.amount,
  }));
  const totalCredits = creditsByStatus.reduce((s, c) => s + c.count, 0);
  const outstanding = creditsByStatus.filter((c) => ['active', 'in_arrears'].includes(c.key)).reduce((s, c) => s + (c.amount || 0), 0);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">Vue d'ensemble</div>
          <div className="page-sub">Situation de la coopérative en temps réel</div>
        </div>
      </div>

      <div className="grid grid-4">
        <StatCard navy label="Membres" value={data?.members?.total ?? 0} foot={`${data?.members?.active ?? 0} actifs`} />
        <StatCard label="Épargne collectée" value={formatMoney(data?.savings?.totalBalance)} foot={`${data?.savings?.count ?? 0} comptes`} />
        <StatCard label="Encours de crédit" value={formatMoney(outstanding)} foot={`${totalCredits} crédits`} />
        <StatCard label="Portefeuille à risque" value={par ? `${par.parRatio}%` : '—'} foot={par ? formatMoney(par.atRisk) + ' en retard' : 'accès restreint'} />
      </div>

      <div className="grid grid-2 section-gap">
        <div className="card">
          <div className="card-head"><div className="card-title">Crédits par statut</div></div>
          <div className="card-pad">
            {creditsByStatus.length === 0 ? (
              <div className="muted" style={{ padding: 20, textAlign: 'center' }}>Aucun crédit enregistré.</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={creditsByStatus} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                  <Tooltip formatter={(v, n) => n === 'count' ? [v, 'Nombre'] : [formatMoney(v), 'Montant']} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {creditsByStatus.map((c) => <Cell key={c.key} fill={COLORS[c.key] || '#22406A'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Répartition de l'encours</div></div>
          <div className="card-pad">
            {outstanding === 0 && (!par || par.atRisk === 0) ? (
              <div className="muted" style={{ padding: 20, textAlign: 'center' }}>Pas d'encours à afficher.</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Sain', value: Math.max(outstanding - (par?.atRisk || 0), 0), fill: '#137A4B' },
                      { name: 'En retard', value: par?.atRisk || 0, fill: '#B23B32' },
                    ]}
                    dataKey="value" nameKey="name" innerRadius={64} outerRadius={100} paddingAngle={2}
                  />
                  <Tooltip formatter={(v) => formatMoney(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="row gap" style={{ justifyContent: 'center', marginTop: 8, gap: 20 }}>
              <span className="row gap" style={{ gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 2, background: '#137A4B', display: 'inline-block' }} /> <span className="muted" style={{ fontSize: 12.5 }}>Sain</span></span>
              <span className="row gap" style={{ gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 2, background: '#B23B32', display: 'inline-block' }} /> <span className="muted" style={{ fontSize: 12.5 }}>En retard</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
