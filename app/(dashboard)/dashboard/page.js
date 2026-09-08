'use client';
import { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';
import { Eye, EyeOff, Users, PiggyBank, Landmark, ShieldAlert, Wallet, TrendingUp } from 'lucide-react';
import { ReportAPI, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatMoney, statusLabel, can } from '@/lib/format';
import QuickStat from '@/components/QuickStat';
import Gauge from '@/components/Gauge';
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

  const membersTotal = data?.members?.total ?? 0;
  const membersActive = data?.members?.active ?? 0;
  const membersOther = Math.max(membersTotal - membersActive, 0);
  const savingsCount = data?.savings?.count ?? 0;
  const avgSavings = savingsCount > 0 ? (data?.savings?.totalBalance || 0) / savingsCount : 0;
  const parValue = par ? Number(par.parRatio) : 0;
  const parColor = parValue >= 10 ? '#F1503D' : parValue >= 5 ? '#F2A93B' : '#14B87F';

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
            <div className="hero-foot">{savingsCount} comptes actifs · {membersTotal} membres</div>
          </div>
          <button className="eye-btn" onClick={() => setHide((h) => !h)} aria-label="Masquer les montants">
            {hide ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </div>

      <div className="qstats" style={{ marginBottom: 18, gridTemplateColumns: 'repeat(6, 1fr)' }}>
        <QuickStat icon={Users} tone="azure" label="Membres actifs" value={membersActive} />
        <QuickStat icon={PiggyBank} tone="mint" label="Épargne" value={mask(formatMoney(data?.savings?.totalBalance))} />
        <QuickStat icon={Landmark} tone="amber" label="Encours de crédit" value={mask(formatMoney(outstanding))} />
        <QuickStat icon={ShieldAlert} tone="coral" label="Portefeuille à risque" value={par ? `${par.parRatio}%` : '—'} />
        <QuickStat icon={Wallet} tone="azure" label="Comptes d'épargne" value={savingsCount} />
        <QuickStat icon={TrendingUp} tone="mint" label="Solde moyen / compte" value={mask(formatMoney(avgSavings))} />
      </div>
      <style>{`@media (max-width: 1300px){ .qstats{ grid-template-columns: repeat(3,1fr) !important; } } @media (max-width: 700px){ .qstats{ grid-template-columns: repeat(2,1fr) !important; } }`}</style>

      <div className="grid grid-3 section-gap">
        <div className="card">
          <div className="card-head"><div className="card-title">Crédits par statut</div></div>
          <div className="card-pad">
            {creditsByStatus.length === 0 ? (
              <div className="muted" style={{ padding: 20, textAlign: 'center' }}>Aucun crédit enregistré.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={creditsByStatus} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10.5, fill: '#626C93' }} axisLine={{ stroke: '#EBEFF8' }} tickLine={false} />
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
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Sain', value: Math.max(outstanding - (par?.atRisk || 0), 0), fill: '#14B87F' },
                      { name: 'En retard', value: par?.atRisk || 0, fill: '#F1503D' },
                    ]}
                    dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3} cornerRadius={6}
                  />
                  <Tooltip formatter={(v) => formatMoney(v)} contentStyle={{ borderRadius: 12, border: '1px solid #EBEFF8', boxShadow: '0 8px 24px rgba(23,31,107,.12)' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="row gap" style={{ justifyContent: 'center', marginTop: 4, gap: 20 }}>
              <span className="row gap" style={{ gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: '#14B87F', display: 'inline-block' }} /> <span className="muted" style={{ fontSize: 12.5 }}>Sain</span></span>
              <span className="row gap" style={{ gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: '#F1503D', display: 'inline-block' }} /> <span className="muted" style={{ fontSize: 12.5 }}>En retard</span></span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Portefeuille à risque (PAR)</div></div>
          <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {par ? (
              <>
                <Gauge value={parValue} color={parColor} label="Ratio en retard sur encours total" />
                <div className="row gap" style={{ marginTop: 14, gap: 24 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div className="muted" style={{ fontSize: 11.5 }}>En retard</div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{mask(formatMoney(par.atRisk))}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div className="muted" style={{ fontSize: 11.5 }}>Encours total</div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{mask(formatMoney(par.outstanding))}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="muted" style={{ padding: 20, textAlign: 'center' }}>Accès restreint à ce rôle.</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-2 section-gap">
        <div className="card">
          <div className="card-head"><div className="card-title">Composition des membres</div></div>
          <div className="card-pad">
            {membersTotal === 0 ? (
              <div className="muted" style={{ padding: 20, textAlign: 'center' }}>Aucun membre enregistré.</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Actifs', value: membersActive, fill: '#2450E8' },
                      { name: 'Autres statuts', value: membersOther, fill: '#EBEFF8' },
                    ]}
                    dataKey="value" nameKey="name" innerRadius={54} outerRadius={82} paddingAngle={2} cornerRadius={6}
                  />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #EBEFF8', boxShadow: '0 8px 24px rgba(23,31,107,.12)' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="row gap" style={{ justifyContent: 'center', marginTop: 4, gap: 20 }}>
              <span className="row gap" style={{ gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: '#2450E8', display: 'inline-block' }} /> <span className="muted" style={{ fontSize: 12.5 }}>Actifs ({membersActive})</span></span>
              <span className="row gap" style={{ gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: '#EBEFF8', display: 'inline-block', border: '1px solid var(--border-strong)' }} /> <span className="muted" style={{ fontSize: 12.5 }}>Autres ({membersOther})</span></span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Résumé de l'activité crédit</div></div>
          <div className="card-pad">
            <dl className="def-list">
              <dt>Dossiers de crédit</dt><dd className="tnum">{totalCredits}</dd>
              <dt>Encours actif + en retard</dt><dd className="tnum">{mask(formatMoney(outstanding))}</dd>
              <dt>Montant en retard</dt><dd className="tnum">{par ? mask(formatMoney(par.atRisk)) : '—'}</dd>
              <dt>Ratio PAR</dt><dd className="tnum">{par ? `${par.parRatio}%` : '—'}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
