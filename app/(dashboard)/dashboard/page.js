'use client';
import { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';
import { Eye, EyeOff, Users, PiggyBank, Landmark, ShieldAlert, Wallet, TrendingUp, Scale, PieChart as PieIcon, BarChart3, Activity, MapPin, UserCheck } from 'lucide-react';
import { ReportAPI, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatMoney, statusLabel, can } from '@/lib/format';
import QuickStat from '@/components/QuickStat';
import Gauge from '@/components/Gauge';
import CountUp from '@/components/CountUp';
import Loading from '@/components/Loading';

const COLORS = { active: '#14B87F', in_arrears: '#F1503D', completed: '#2450E8', pending_disbursement: '#F2A93B', disbursed: '#2450E8' };

function CardTitle({ icon: Icon, tone, children }) {
  return (
    <div className="card-title-row">
      <span className="card-ico" style={{ background: `var(--${tone}-bg)`, color: `var(--${tone})` }}><Icon size={15} strokeWidth={2.3} /></span>
      <span className="card-title">{children}</span>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [par, setPar] = useState(null);
  const [agents, setAgents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [hide, setHide] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const dashP = ReportAPI.dashboard();
        const parP = can.par(user?.role) ? ReportAPI.par() : null;
        const agentsP = can.agentStats(user?.role) ? ReportAPI.agents() : null;
        const [d, p, a] = await Promise.all([dashP, parP, agentsP]);
        setData(d.data.data);
        if (p) setPar(p.data.data);
        if (a) setAgents(a.data.data);
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

  const membersTotal = data?.members?.total ?? 0;
  const membersActive = data?.members?.active ?? 0;
  const membersOther = Math.max(membersTotal - membersActive, 0);
  const savingsCount = data?.savings?.count ?? 0;
  const savingsTotal = data?.savings?.totalBalance ?? 0;
  const avgSavings = savingsCount > 0 ? savingsTotal / savingsCount : 0;
  const parValue = par ? Number(par.parRatio) : 0;
  const parColor = parValue >= 10 ? '#F1503D' : parValue >= 5 ? '#F2A93B' : '#14B87F';

  const money = (n) => formatMoney(n);

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
            <div className="hero-value tnum">{hide ? '••••••' : <CountUp value={savingsTotal} format={money} />}</div>
            <div className="hero-foot">{savingsCount} comptes actifs · {membersTotal} membres</div>
          </div>
          <button className="eye-btn" onClick={() => setHide((h) => !h)} aria-label="Masquer les montants">
            {hide ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </div>

      <div className="qstats" style={{ marginBottom: 18, gridTemplateColumns: 'repeat(6, 1fr)' }}>
        <QuickStat icon={Users} tone="azure" label="Membres actifs" value={<CountUp value={membersActive} />} />
        <QuickStat icon={PiggyBank} tone="mint" label="Épargne" value={hide ? '••••••' : <CountUp value={savingsTotal} format={money} />} />
        <QuickStat icon={Landmark} tone="amber" label="Encours de crédit" value={hide ? '••••••' : <CountUp value={outstanding} format={money} />} />
        <QuickStat icon={ShieldAlert} tone="coral" label="Portefeuille à risque" value={par ? `${par.parRatio}%` : '—'} />
        <QuickStat icon={Wallet} tone="azure" label="Comptes d'épargne" value={<CountUp value={savingsCount} />} />
        <QuickStat icon={TrendingUp} tone="mint" label="Solde moyen / compte" value={hide ? '••••••' : <CountUp value={avgSavings} format={money} />} />
      </div>
      <style>{`@media (max-width: 1300px){ .qstats{ grid-template-columns: repeat(3,1fr) !important; } } @media (max-width: 700px){ .qstats{ grid-template-columns: repeat(2,1fr) !important; } }`}</style>

      <div className="grid grid-3 section-gap">
        <div className="card">
          <div className="card-head"><CardTitle icon={BarChart3} tone="azure">Crédits par statut</CardTitle></div>
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
          <div className="card-head"><CardTitle icon={PieIcon} tone="mint">Répartition de l'encours</CardTitle></div>
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
          <div className="card-head"><CardTitle icon={Activity} tone="coral">Portefeuille à risque (PAR)</CardTitle></div>
          <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {par ? (
              <>
                <Gauge value={parValue} color={parColor} label="Ratio en retard sur encours total" />
                <div className="row gap" style={{ marginTop: 14, gap: 24 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div className="muted" style={{ fontSize: 11.5 }}>En retard</div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{hide ? '••••••' : formatMoney(par.atRisk)}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div className="muted" style={{ fontSize: 11.5 }}>Encours total</div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{hide ? '••••••' : formatMoney(par.outstanding)}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="muted" style={{ padding: 20, textAlign: 'center' }}>Accès restreint à ce rôle.</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-3 section-gap">
        <div className="card">
          <div className="card-head"><CardTitle icon={Users} tone="azure">Composition des membres</CardTitle></div>
          <div className="card-pad">
            {membersTotal === 0 ? (
              <div className="muted" style={{ padding: 20, textAlign: 'center' }}>Aucun membre enregistré.</div>
            ) : (
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Actifs', value: membersActive, fill: '#2450E8' },
                      { name: 'Autres statuts', value: membersOther, fill: '#EBEFF8' },
                    ]}
                    dataKey="value" nameKey="name" innerRadius={50} outerRadius={78} paddingAngle={2} cornerRadius={6}
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
          <div className="card-head"><CardTitle icon={Scale} tone="amber">Épargne vs Encours de crédit</CardTitle></div>
          <div className="card-pad">
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={[{ name: 'Épargne', v: savingsTotal, fill: '#14B87F' }, { name: 'Encours crédit', v: outstanding, fill: '#2450E8' }]} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={92} tick={{ fontSize: 12, fill: '#12163C', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => formatMoney(v)} contentStyle={{ borderRadius: 12, border: '1px solid #EBEFF8', boxShadow: '0 8px 24px rgba(23,31,107,.12)' }} />
                <Bar dataKey="v" radius={[0, 8, 8, 0]} barSize={30}>
                  <Cell fill="#14B87F" /><Cell fill="#2450E8" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><CardTitle icon={Landmark} tone="mint">Résumé de l'activité crédit</CardTitle></div>
          <div className="card-pad">
            <dl className="def-list">
              <dt>Dossiers de crédit</dt><dd className="tnum">{totalCredits}</dd>
              <dt>Encours actif + en retard</dt><dd className="tnum">{hide ? '••••••' : formatMoney(outstanding)}</dd>
              <dt>Montant en retard</dt><dd className="tnum">{par ? (hide ? '••••••' : formatMoney(par.atRisk)) : '—'}</dd>
              <dt>Ratio PAR</dt><dd className="tnum">{par ? `${par.parRatio}%` : '—'}</dd>
            </dl>
          </div>
        </div>
      </div>

      {agents ? (
        <>
          <div className="page-head section-gap" style={{ marginBottom: 14 }}>
            <div className="page-title" style={{ fontSize: 19 }}>Réseau d'agents terrain</div>
          </div>
          <div className="qstats" style={{ marginBottom: 18, gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <QuickStat icon={UserCheck} tone="azure" label="Agents actifs" value={<CountUp value={agents.totalAgents} />} />
            <QuickStat icon={MapPin} tone="mint" label="Communes couvertes" value={agents.byCommune.filter((c) => c._id !== 'Non renseignée').length} />
            <QuickStat icon={MapPin} tone="amber" label="Villes couvertes" value={agents.byVille.filter((v) => v._id !== 'Non renseignée').length} />
          </div>

          <div className="grid grid-3 section-gap">
            <div className="card">
              <div className="card-head"><CardTitle icon={MapPin} tone="mint">Agents par commune</CardTitle></div>
              <div className="card-pad">
                {agents.byCommune.length === 0 ? <div className="muted" style={{ padding: 12, textAlign: 'center' }}>Aucune donnée.</div> : (
                  <table className="tbl"><tbody>
                    {agents.byCommune.map((c) => (
                      <tr key={c._id}><td>{c._id}</td><td style={{ textAlign: 'right', fontWeight: 700 }}>{c.count}</td></tr>
                    ))}
                  </tbody></table>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-head"><CardTitle icon={MapPin} tone="amber">Agents par ville</CardTitle></div>
              <div className="card-pad">
                {agents.byVille.length === 0 ? <div className="muted" style={{ padding: 12, textAlign: 'center' }}>Aucune donnée.</div> : (
                  <table className="tbl"><tbody>
                    {agents.byVille.map((v) => (
                      <tr key={v._id}><td>{v._id}</td><td style={{ textAlign: 'right', fontWeight: 700 }}>{v.count}</td></tr>
                    ))}
                  </tbody></table>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-head"><CardTitle icon={UserCheck} tone="azure">Membres enregistrés par agent</CardTitle></div>
              <div className="card-pad">
                {agents.byAgent.length === 0 ? <div className="muted" style={{ padding: 12, textAlign: 'center' }}>Aucun membre enregistré par un agent pour l'instant.</div> : (
                  <table className="tbl"><tbody>
                    {agents.byAgent.slice(0, 8).map((a) => (
                      <tr key={a.agentId}>
                        <td>{a.name}<div className="faint" style={{ fontSize: 11 }}>{[a.commune, a.ville].filter(Boolean).join(', ') || '—'}</div></td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{a.count}</td>
                      </tr>
                    ))}
                  </tbody></table>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
