'use client';
import { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';
import { Eye, EyeOff, Users, PiggyBank, Landmark, ShieldAlert } from 'lucide-react';
import { ReportAPI, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatMoney, statusLabel, can } from '@/lib/format';
import QuickStat from '@/components/QuickStat';
import Loading from '@/components/Loading';

const COLORS = { active: '#14B87F', in_arrears: '#F1503D', completed: '#2450E8', pending_disbursement: '#F2A93B', disbursed: '#2450E8' };

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [par, setPar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [hide, setHide] = useState(false);

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
  const mask = (v) => (hide ? '••••••' : v);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">Vue d'ensemble</div>
          <div className="page-sub">Situation de la coopérative en temps réel</div>
        </div>
      </div>

      <div className="hero" style={{ marginBottom: 18 }}>
        <div className="hero-glow" />
        <div className="hero-top">
          <div>
            <div className="hero-label">Épargne collectée</div>
            <div className="hero-value tnum">{mask(formatMoney(data?.savings?.totalBalance))}</div>
            <div className="hero-foot">{data?.savings?.count ?? 0} comptes actifs · {data?.members?.total ?? 0} membres</div>
          </div>
          <button className="eye-btn" onClick={() => setHide((h) => !h)} aria-label="Masquer les montants">
            {hide ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </div>

      <div className="qstats" style={{ marginBottom: 18 }}>
        <QuickStat icon={Users} tone="azure" label="Membres actifs" value={data?.members?.active ?? 0} />
        <QuickStat icon={PiggyBank} tone="mint" label="Épargne" value={mask(formatMoney(data?.savings?.totalBalance))} />
        <QuickStat icon={Landmark} tone="amber" label="Encours de crédit" value={mask(formatMoney(outstanding))} />
        <QuickStat icon={ShieldAlert} tone="coral" label="Portefeuille à risque" value={par ? `${par.parRatio}%` : '—'} />
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
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#626C93' }} axisLine={{ stroke: '#EBEFF8' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#626C93' }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v, n) => n === 'count' ? [v, 'Nombre'] : [formatMoney(v), 'Montant']} contentStyle={{ borderRadius: 12, border: '1px solid #EBEFF8', boxShadow: '0 8px 24px rgba(23,31,107,.12)' }} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {creditsByStatus.map((c) => <Cell key={c.key} fill={COLORS[c.key] || '#2450E8'} />)}
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
                      { name: 'Sain', value: Math.max(outstanding - (par?.atRisk || 0), 0), fill: '#14B87F' },
                      { name: 'En retard', value: par?.atRisk || 0, fill: '#F1503D' },
                    ]}
                    dataKey="value" nameKey="name" innerRadius={68} outerRadius={100} paddingAngle={3} cornerRadius={6}
                  />
                  <Tooltip formatter={(v) => formatMoney(v)} contentStyle={{ borderRadius: 12, border: '1px solid #EBEFF8', boxShadow: '0 8px 24px rgba(23,31,107,.12)' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="row gap" style={{ justifyContent: 'center', marginTop: 8, gap: 20 }}>
              <span className="row gap" style={{ gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: '#14B87F', display: 'inline-block' }} /> <span className="muted" style={{ fontSize: 12.5 }}>Sain</span></span>
              <span className="row gap" style={{ gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: '#F1503D', display: 'inline-block' }} /> <span className="muted" style={{ fontSize: 12.5 }}>En retard</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
