'use client';
import { useEffect, useState, useCallback } from 'react';
import { AccountingAPI, ReportAPI, ShareCapitalAPI, ReconciliationAPI, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatMoney, formatDate } from '@/lib/format';
import Loading from '@/components/Loading';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';

export default function AccountingPage() {
  const [tab, setTab] = useState('treasury');
  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">Comptabilité</div>
          <div className="page-sub">Trésorerie opérationnelle et comptabilité générale (PCCI)</div>
        </div>
      </div>
      <div className="chips section-gap" style={{ marginBottom: 22 }}>
        <button className={`chip ${tab === 'treasury' ? 'active' : ''}`} onClick={() => setTab('treasury')}>Trésorerie</button>
        <button className={`chip ${tab === 'ledger' ? 'active' : ''}`} onClick={() => setTab('ledger')}>Comptabilité générale</button>
      </div>
      {tab === 'treasury' ? <TreasuryPanel /> : <GeneralLedgerPanel />}
    </div>
  );
}

function TreasuryPanel() {
  const { user } = useAuth();
  const [pending, setPending] = useState(null);
  const [agentCash, setAgentCash] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, a, t] = await Promise.all([AccountingAPI.pending(), AccountingAPI.agentCashPending(), AccountingAPI.transfers()]);
      setPending(p.data);
      setAgentCash(a.data);
      setTransfers(t.data.data || []);
      setSelected({});
    } catch (e) { setErr(errorMessage(e)); }
    finally { setLoading(false); }
  }, []);

  const confirmTransfer = async (id) => {
    try { await AccountingAPI.confirmTransfer(id); await load(); }
    catch (e) { alert(errorMessage(e)); }
  };

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
      <div className="page-head" style={{ marginBottom: 18 }}>
        <div className="muted" style={{ fontSize: 13 }}>Suivi de l'argent collecté (espèces et Mobile Money) jusqu'à son dépôt réel en banque</div>
        <button className="btn btn-outline btn-sm" onClick={load}>↻ Actualiser</button>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 22 }}>
        <div className="stat navy">
          <div className="stat-label">En attente de dépôt/virement bancaire</div>
          <div className="stat-value tnum">{formatMoney(pending?.total || 0)}</div>
          <div className="stat-foot">{pending?.count || 0} dépôt(s) confirmé(s), pas encore en banque</div>
        </div>
        <div className="stat">
          <div className="stat-label">Dont espèces / Mobile Money</div>
          <div className="stat-value tnum" style={{ fontSize: 20 }}>
            {formatMoney(pending?.byMethod?.cash?.total || 0)} <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>esp.</span>
          </div>
          <div className="stat-foot">{formatMoney(pending?.byMethod?.mobile_money?.total || 0)} en Mobile Money</div>
        </div>
        <div className="stat">
          <div className="stat-label">Total déjà viré (historique)</div>
          <div className="stat-value tnum">{formatMoney(transfers.reduce((s, t) => s + t.amount, 0))}</div>
          <div className="stat-foot">{transfers.length} virement(s)/dépôt(s) enregistré(s)</div>
        </div>
      </div>

      {err ? <div className="err-text section-gap">{err}</div> : null}

      {agentCash?.data?.length > 0 ? (
        <div className="card section-gap">
          <div className="card-head"><div className="card-title">Espèces actuellement en main des agents (pas encore remises à la caisse)</div></div>
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>Agent</th><th>Montant en main</th><th>Nb opérations</th></tr></thead>
              <tbody>
                {agentCash.data.map((a) => (
                  <tr key={a.agentId}>
                    <td style={{ fontWeight: 600 }}>{a.name}</td>
                    <td className="mono" style={{ fontWeight: 700, color: 'var(--warning)' }}>{formatMoney(a.total)}</td>
                    <td className="muted">{a.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="hint" style={{ padding: '10px 16px 16px' }}>Ces dépôts espèces ont été enregistrés par l'agent sur le terrain mais attendent encore d'être remis et confirmés en caisse — ils ne sont donc pas encore crédités aux membres.</div>
        </div>
      ) : null}

      <div className="card section-gap">
        <div className="card-head between">
          <div className="card-title">Dépôts confirmés en attente de dépôt bancaire</div>
          {items.length > 0 ? (
            <button className="btn btn-gold btn-sm" disabled={selectedIds.length === 0} onClick={() => setShowModal(true)}>
              Enregistrer un virement/dépôt ({selectedIds.length})
            </button>
          ) : null}
        </div>
        {items.length === 0 ? (
          <EmptyState icon="₵" title="Rien en attente" message="Tout l'argent collecté a déjà été déposé à la banque." />
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr>
                <th><input type="checkbox" checked={allSelected} onChange={toggleAll} /></th>
                <th>Membre</th><th>Mode</th><th>Montant</th><th>Référence</th><th>Reçu le</th>
              </tr></thead>
              <tbody>
                {items.map((t) => {
                  const name = t.member ? `${t.member.firstName || ''} ${t.member.lastName || ''}`.trim() : '—';
                  return (
                    <tr key={t._id}>
                      <td><input type="checkbox" checked={!!selected[t._id]} onChange={(e) => setSelected((s) => ({ ...s, [t._id]: e.target.checked }))} /></td>
                      <td>{name}<div className="muted mono" style={{ fontSize: 11.5 }}>{t.member?.memberNumber || ''}</div></td>
                      <td><Badge tone={t.paymentMethod === 'cash' ? 'warning' : 'info'}>{t.paymentMethod === 'cash' ? 'Espèces' : 'Mobile Money'}</Badge></td>
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

      <ReconciliationImport onDone={load} />

      <div className="card section-gap">
        <div className="card-head"><div className="card-title">Historique des virements / dépôts bancaires</div></div>
        {transfers.length === 0 ? (
          <EmptyState icon="▤" title="Aucun virement enregistré" message="L'historique apparaîtra ici après le premier enregistrement." />
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>Date</th><th>Montant</th><th>Référence</th><th>Banque</th><th>Transactions</th><th>Proposé par</th><th>Statut</th><th style={{ textAlign: 'right' }}>Action</th></tr></thead>
              <tbody>
                {transfers.map((tr) => {
                  const isSelf = tr.createdBy?._id === user?.id;
                  return (
                    <tr key={tr._id}>
                      <td className="muted">{formatDate(tr.createdAt, true)}</td>
                      <td className="mono" style={{ fontWeight: 600 }}>{formatMoney(tr.amount, tr.currency)}</td>
                      <td className="mono muted" style={{ fontSize: 12.5 }}>{tr.reference}</td>
                      <td className="muted">{tr.bankName || '—'}</td>
                      <td className="muted">{tr.transactionCount}</td>
                      <td className="muted">{tr.createdBy?.name || '—'}</td>
                      <td><Badge tone={tr.status === 'confirmed' ? 'success' : 'warning'}>{tr.status === 'confirmed' ? 'Confirmé' : 'En attente'}</Badge></td>
                      <td style={{ textAlign: 'right' }}>
                        {tr.status === 'pending' ? (
                          isSelf ? <span className="faint" style={{ fontSize: 11 }}>Attend une autre personne</span>
                            : <button className="btn btn-gold btn-sm" onClick={() => confirmTransfer(tr._id)}>Confirmer</button>
                        ) : <span className="faint" style={{ fontSize: 11 }}>{tr.confirmedBy?.name}</span>}
                      </td>
                    </tr>
                  );
                })}
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

function GeneralLedgerPanel() {
  const [subTab, setSubTab] = useState('bilan');
  return (
    <div>
      <div className="chips" style={{ marginBottom: 18 }}>
        <button className={`chip ${subTab === 'stats' ? 'active' : ''}`} onClick={() => setSubTab('stats')}>Statistiques</button>
        <button className={`chip ${subTab === 'bilan' ? 'active' : ''}`} onClick={() => setSubTab('bilan')}>Bilan</button>
        <button className={`chip ${subTab === 'balance' ? 'active' : ''}`} onClick={() => setSubTab('balance')}>Balance générale</button>
        <button className={`chip ${subTab === 'journal' ? 'active' : ''}`} onClick={() => setSubTab('journal')}>Livre-journal</button>
        <button className={`chip ${subTab === 'ledger' ? 'active' : ''}`} onClick={() => setSubTab('ledger')}>Grand livre</button>
        <button className={`chip ${subTab === 'result' ? 'active' : ''}`} onClick={() => setSubTab('result')}>Compte de résultat</button>
      </div>
      <div className="callout" style={{ marginBottom: 18 }}>
        <p style={{ color: 'rgba(255,255,255,.92)', fontSize: 12.5 }}>
          Comptabilité générée automatiquement selon le PCCI (Instruction BCC n°006). Les codes de comptes retenus sont
          une base de travail à faire valider par un expert-comptable ONEC-RDC avant toute transmission officielle via FinA.
        </p>
      </div>
      {subTab === 'stats' ? <StatsView /> : null}
      {subTab === 'bilan' ? <BilanView /> : null}
      {subTab === 'balance' ? <TrialBalanceView /> : null}
      {subTab === 'journal' ? <JournalView /> : null}
      {subTab === 'ledger' ? <LedgerView /> : null}
      {subTab === 'result' ? <IncomeStatementView /> : null}
    </div>
  );
}

function PrintStatementButton({ type }) {
  const [printing, setPrinting] = useState(false);
  const print = async () => {
    setPrinting(true);
    try {
      const { data } = await AccountingAPI.printStatement(type);
      const url = URL.createObjectURL(data);
      window.open(url, '_blank');
    } catch (e) { alert(errorMessage(e)); }
    finally { setPrinting(false); }
  };
  return <button className="btn btn-outline btn-sm" onClick={print} disabled={printing} style={{ marginBottom: 12 }}>{printing ? '…' : 'Imprimer (PDF)'}</button>;
}

function BilanView() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { AccountingAPI.balanceSheet().then((r) => setData(r.data)).catch((e) => setErr(errorMessage(e))); }, []);
  if (err) return <div className="err-text">{err}</div>;
  if (!data) return <Loading />;
  return (
    <div>
      <PrintStatementButton type="balanceSheet" />
      <div className="grid grid-2">
      <div className="card">
        <div className="card-head"><div className="card-title">Actif</div></div>
        <div className="table-wrap"><table className="tbl"><tbody>
          {data.actif.map((a) => <tr key={a.code}><td>{a.code} — {a.label}</td><td className="mono" style={{ textAlign: 'right', fontWeight: 600 }}>{formatMoney(a.balance)}</td></tr>)}
          <tr><td style={{ fontWeight: 800 }}>Total actif</td><td className="mono" style={{ textAlign: 'right', fontWeight: 800 }}>{formatMoney(data.totalActif)}</td></tr>
        </tbody></table></div>
      </div>
      <div className="card">
        <div className="card-head"><div className="card-title">Passif</div></div>
        <div className="table-wrap"><table className="tbl"><tbody>
          {data.passif.map((a) => <tr key={a.code}><td>{a.code} — {a.label}</td><td className="mono" style={{ textAlign: 'right', fontWeight: 600 }}>{formatMoney(a.balance)}</td></tr>)}
          <tr><td>Résultat de l'exercice</td><td className="mono" style={{ textAlign: 'right', fontWeight: 600 }}>{formatMoney(data.resultatExercice)}</td></tr>
          <tr><td style={{ fontWeight: 800 }}>Total passif</td><td className="mono" style={{ textAlign: 'right', fontWeight: 800 }}>{formatMoney(data.totalPassif)}</td></tr>
        </tbody></table></div>
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <Badge tone={data.equilibre ? 'success' : 'danger'}>{data.equilibre ? '✓ Bilan équilibré (Actif = Passif)' : '⚠ Déséquilibre détecté'}</Badge>
      </div>
      </div>
    </div>
  );
}

function TrialBalanceView() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { AccountingAPI.trialBalance().then((r) => setData(r.data)).catch((e) => setErr(errorMessage(e))); }, []);
  if (err) return <div className="err-text">{err}</div>;
  if (!data) return <Loading />;
  return (
    <div>
    <PrintStatementButton type="trialBalance" />
    <div className="card">
      <div className="card-head between"><div className="card-title">Balance générale</div>
        <Badge tone={data.totals.balanced ? 'success' : 'danger'}>{data.totals.balanced ? 'Équilibrée' : 'Déséquilibrée'}</Badge>
      </div>
      <div className="table-wrap"><table className="tbl">
        <thead><tr><th>Compte</th><th>Débit</th><th>Crédit</th><th>Solde</th></tr></thead>
        <tbody>
          {data.data.filter((r) => r.debit || r.credit).map((r) => (
            <tr key={r.code}><td>{r.code} — {r.label}</td>
              <td className="mono">{formatMoney(r.debit)}</td>
              <td className="mono">{formatMoney(r.credit)}</td>
              <td className="mono" style={{ fontWeight: 700 }}>{formatMoney(r.balance)}</td>
            </tr>
          ))}
          <tr><td style={{ fontWeight: 800 }}>Total</td><td className="mono" style={{ fontWeight: 800 }}>{formatMoney(data.totals.debit)}</td><td className="mono" style={{ fontWeight: 800 }}>{formatMoney(data.totals.credit)}</td><td /></tr>
        </tbody>
      </table></div>
    </div>
    </div>
  );
}

function JournalView() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { AccountingAPI.journal({ limit: 50 }).then((r) => setData(r.data.data)).catch((e) => setErr(errorMessage(e))); }, []);
  if (err) return <div className="err-text">{err}</div>;
  if (!data) return <Loading />;
  return (
    <div className="card">
      <div className="card-head"><div className="card-title">Livre-journal (50 dernières écritures)</div></div>
      {data.length === 0 ? <EmptyState icon="▤" title="Aucune écriture" message="Les écritures apparaîtront au fil des opérations (dépôts, retraits, crédits)." /> : (
        <div className="table-wrap"><table className="tbl">
          <thead><tr><th>Date</th><th>Référence</th><th>Libellé</th><th>Lignes</th></tr></thead>
          <tbody>
            {data.map((e) => (
              <tr key={e._id}>
                <td className="muted">{formatDate(e.date, true)}</td>
                <td className="mono muted" style={{ fontSize: 12 }}>{e.reference}</td>
                <td>{e.narrative}</td>
                <td style={{ fontSize: 12 }}>
                  {e.lines.map((l, i) => (
                    <div key={i} className="muted">{l.account} — {l.debit ? `D ${formatMoney(l.debit)}` : `C ${formatMoney(l.credit)}`}</div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </div>
  );
}

function LedgerView() {
  const [accounts, setAccounts] = useState([]);
  const [code, setCode] = useState('');
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => { AccountingAPI.chartOfAccounts().then((r) => setAccounts(r.data.data)); }, []);
  useEffect(() => {
    if (!code) return;
    setData(null); setErr('');
    AccountingAPI.ledger(code).then((r) => setData(r.data)).catch((e) => setErr(errorMessage(e)));
  }, [code]);

  return (
    <div className="card">
      <div className="card-head"><div className="card-title">Grand livre</div></div>
      <div className="card-pad">
        <div className="field" style={{ maxWidth: 380 }}>
          <label className="label">Choisir un compte</label>
          <select className="select" value={code} onChange={(e) => setCode(e.target.value)}>
            <option value="">— Sélectionner —</option>
            {accounts.map((a) => <option key={a.code} value={a.code}>{a.code} — {a.label}</option>)}
          </select>
        </div>
        {err ? <div className="err-text">{err}</div> : null}
        {code && !data && !err ? <Loading /> : null}
        {data ? (
          <div className="table-wrap section-gap">
            <table className="tbl">
              <thead><tr><th>Date</th><th>Référence</th><th>Libellé</th><th>Débit</th><th>Crédit</th><th>Solde</th></tr></thead>
              <tbody>
                {data.data.length === 0 ? <tr><td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 20 }}>Aucun mouvement sur ce compte.</td></tr> : data.data.map((r, i) => (
                  <tr key={i}>
                    <td className="muted">{formatDate(r.date, true)}</td>
                    <td className="mono muted" style={{ fontSize: 12 }}>{r.reference}</td>
                    <td>{r.narrative}{r.label ? <div className="faint" style={{ fontSize: 11 }}>{r.label}</div> : null}</td>
                    <td className="mono">{r.debit ? formatMoney(r.debit) : ''}</td>
                    <td className="mono">{r.credit ? formatMoney(r.credit) : ''}</td>
                    <td className="mono" style={{ fontWeight: 700 }}>{formatMoney(r.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function IncomeStatementView() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { AccountingAPI.incomeStatement().then((r) => setData(r.data)).catch((e) => setErr(errorMessage(e))); }, []);
  if (err) return <div className="err-text">{err}</div>;
  if (!data) return <Loading />;
  return (
    <div>
    <PrintStatementButton type="incomeStatement" />
    <div className="grid grid-2">
      <div className="card">
        <div className="card-head"><div className="card-title">Charges</div></div>
        <div className="table-wrap"><table className="tbl"><tbody>
          {data.data.filter((r) => r.nature === 'charge').map((r) => <tr key={r.code}><td>{r.code} — {r.label}</td><td className="mono" style={{ textAlign: 'right' }}>{formatMoney(r.amount)}</td></tr>)}
          <tr><td style={{ fontWeight: 800 }}>Total charges</td><td className="mono" style={{ textAlign: 'right', fontWeight: 800 }}>{formatMoney(data.totalCharges)}</td></tr>
        </tbody></table></div>
      </div>
      <div className="card">
        <div className="card-head"><div className="card-title">Produits</div></div>
        <div className="table-wrap"><table className="tbl"><tbody>
          {data.data.filter((r) => r.nature === 'produit').map((r) => <tr key={r.code}><td>{r.code} — {r.label}</td><td className="mono" style={{ textAlign: 'right' }}>{formatMoney(r.amount)}</td></tr>)}
          <tr><td style={{ fontWeight: 800 }}>Total produits</td><td className="mono" style={{ textAlign: 'right', fontWeight: 800 }}>{formatMoney(data.totalProduits)}</td></tr>
        </tbody></table></div>
      </div>
      <div style={{ gridColumn: '1 / -1' }} className="stat navy">
        <div className="stat-label">Résultat (excédent) de la période</div>
        <div className="stat-value tnum">{formatMoney(data.resultat)}</div>
      </div>
    </div>
    </div>
  );
}

function StatsView() {
  const [dash, setDash] = useState(null);
  const [shares, setShares] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    Promise.all([ReportAPI.dashboard(), ShareCapitalAPI.overview()])
      .then(([d, s]) => { setDash(d.data.data); setShares(s.data); })
      .catch((e) => setErr(errorMessage(e)));
  }, []);

  if (err) return <div className="err-text">{err}</div>;
  if (!dash) return <Loading />;

  const outstandingCredit = (dash.creditsByStatus || []).reduce((s, c) => s + (c.amount || 0), 0);

  return (
    <div>
      <div className="qstats" style={{ marginBottom: 18, gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat navy"><div className="stat-label">Épargne totale</div><div className="stat-value tnum">{formatMoney(dash.savings?.totalBalance || 0)}</div></div>
        <div className="stat"><div className="stat-label">Encours de crédit</div><div className="stat-value tnum">{formatMoney(outstandingCredit)}</div></div>
        <div className="stat"><div className="stat-label">Capital (parts sociales)</div><div className="stat-value tnum">{formatMoney(shares?.grandTotal || 0)}</div></div>
      </div>
      <div className="qstats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat"><div className="stat-label">Membres actifs</div><div className="stat-value tnum">{dash.members?.active ?? '—'}</div></div>
        <div className="stat"><div className="stat-label">Comptes d'épargne</div><div className="stat-value tnum">{dash.savings?.count ?? '—'}</div></div>
        <div className="stat"><div className="stat-label">Sociétaires détenant des parts</div><div className="stat-value tnum">{shares?.data?.length || 0}</div></div>
      </div>
      <div className="hint section-gap">Statistiques calculées quotidiennement à partir des opérations réelles — reprend les indicateurs du tableau de bord et du module Parts sociales, comme prévu dans le cycle comptable (carnet → journaux → grand livre → balance → statistiques).</div>
    </div>
  );
}

function ReconciliationImport({ onDone }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState({});
  const [err, setErr] = useState('');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setErr(''); setResult(null); setSelected({});
    try { const { data } = await ReconciliationAPI.import(file); setResult(data); }
    catch (er) { setErr(errorMessage(er)); }
    finally { setBusy(false); e.target.value = ''; }
  };

  const toggle = (id) => setSelected((s) => ({ ...s, [id]: !s[id] }));
  const selectedIds = Object.keys(selected).filter((id) => selected[id]);
  const selectedAmount = (result?.results || [])
    .filter((r) => r.matchedTransaction && selected[r.matchedTransaction.id])
    .reduce((s, r) => s + r.matchedTransaction.amount, 0);

  const proposeTransfer = async () => {
    if (!reference.trim()) return setErr('Indiquez la référence du virement bancaire réel.');
    setSaving(true); setErr('');
    try {
      await AccountingAPI.recordTransfer({ amount: selectedAmount, reference, transactionIds: selectedIds });
      setResult(null); setSelected({}); setReference('');
      onDone();
    } catch (e) { setErr(errorMessage(e)); }
    finally { setSaving(false); }
  };

  return (
    <div className="card section-gap">
      <div className="card-head"><div className="card-title">Rapprochement — import d'un relevé bancaire (CSV)</div></div>
      <div className="card-pad">
        <div className="hint" style={{ marginBottom: 10 }}>Dépose le relevé exporté par la banque (colonnes date + montant). Le système propose des correspondances avec les opérations internes non encore reversées — rien n'est modifié tant que tu ne confirmes pas une remise.</div>
        <input className="input" type="file" accept=".csv" onChange={onFile} disabled={busy} style={{ maxWidth: 320 }} />
        {err ? <div className="err-text" style={{ marginTop: 10 }}>{err}</div> : null}

        {result ? (
          <div style={{ marginTop: 16 }}>
            <div className="hint" style={{ marginBottom: 8 }}>{result.total} ligne(s) — {result.matchedCount} correspondance(s) trouvée(s), {result.unmatchedCount} sans correspondance.</div>
            <div className="table-wrap">
              <table className="tbl">
                <thead><tr><th></th><th>Ligne relevé</th><th>Montant relevé</th><th>Transaction correspondante</th><th>Membre</th></tr></thead>
                <tbody>
                  {result.results.map((r) => (
                    <tr key={r.row}>
                      <td>{r.matchedTransaction ? <input type="checkbox" checked={!!selected[r.matchedTransaction.id]} onChange={() => toggle(r.matchedTransaction.id)} /> : null}</td>
                      <td className="muted">{r.statementLabel || `Ligne ${r.row}`}</td>
                      <td className="mono">{formatMoney(r.statementAmount)}</td>
                      <td className="mono">{r.matchedTransaction ? `${r.matchedTransaction.reference} (${formatMoney(r.matchedTransaction.amount)})` : <span className="faint">Aucune</span>}</td>
                      <td className="muted">{r.matchedTransaction?.memberName || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedIds.length > 0 ? (
              <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <div className="field" style={{ marginBottom: 0, flex: 1 }}>
                  <label className="label">Référence du virement bancaire réel</label>
                  <input className="input" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Référence figurant sur le relevé" />
                </div>
                <button className="btn btn-gold btn-sm" onClick={proposeTransfer} disabled={saving}>
                  {saving ? '…' : `Proposer la remise (${selectedIds.length} — ${formatMoney(selectedAmount)})`}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
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
    if (!reference.trim()) return setErr('La référence est requise.');
    setBusy(true); setErr('');
    try {
      await AccountingAPI.recordTransfer({ amount: Number(amount), reference: reference.trim(), bankName: bankName.trim(), note: note.trim(), transactionIds: selectedIds });
      onSaved();
    } catch (e) { setErr(errorMessage(e)); }
    finally { setBusy(false); }
  };

  return (
    <Modal title="Enregistrer un virement / dépôt bancaire" onClose={onClose}
      footer={<><button className="btn btn-outline" onClick={onClose}>Annuler</button><button className="btn btn-gold" onClick={submit} disabled={busy}>{busy ? 'Enregistrement…' : 'Confirmer'}</button></>}>
      <div className="hint" style={{ marginBottom: 14 }}>
        {selectedIds.length} opération(s) sélectionnée(s) — montant suggéré rempli automatiquement, ajustable si le virement/dépôt réel diffère légèrement (espèces comptées à la banque, par exemple).
      </div>
      <div className="field"><label className="label">Montant réellement déposé/viré (CDF)</label><input className="input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
      <div className="field"><label className="label">Référence (bordereau bancaire, n° de virement...)</label><input className="input" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Ex : bordereau RAWBANK n°..." /></div>
      <div className="field"><label className="label">Banque (optionnel)</label><input className="input" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Ex : RAWBANK" /></div>
      <div className="field"><label className="label">Note (optionnel)</label><textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} /></div>
      {err ? <div className="err-text">{err}</div> : null}
    </Modal>
  );
}
