'use client';
import { useEffect, useState, useCallback } from 'react';
import { AccountingAPI, ReportAPI, errorMessage } from '@/lib/api';
import { formatMoney, formatDate } from '@/lib/format';
import Loading from '@/components/Loading';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';

export default function BankPage() {
  const [data, setData] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [liquidity, setLiquidity] = useState(null);
  const [err, setErr] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [printing, setPrinting] = useState(false);

  const printStatement = async () => {
    setPrinting(true);
    try {
      const { data } = await AccountingAPI.printBankStatement();
      const url = URL.createObjectURL(data);
      window.open(url, '_blank');
    } catch (e) { alert(errorMessage(e)); }
    finally { setPrinting(false); }
  };

  const load = useCallback(async () => {
    try {
      const [ledger, accts, liq] = await Promise.all([AccountingAPI.ledger('521'), AccountingAPI.bankAccounts(), ReportAPI.liquidity()]);
      setData(ledger.data);
      setAccounts(accts.data.data || []);
      setLiquidity(liq.data.data);
    } catch (e) { setErr(errorMessage(e)); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">Banque</div>
          <div className="page-sub">Comptes bancaires/Mobile Money déclarés et mouvements consolidés</div>
        </div>
        <div className="inline-actions">
          <button className="btn btn-outline btn-sm" onClick={printStatement} disabled={printing}>{printing ? '…' : 'Imprimer le relevé'}</button>
          <button className="btn btn-gold btn-sm" onClick={() => setShowModal(true)}>+ Déclarer un compte</button>
        </div>
      </div>

      {err ? <div className="err-text section-gap">{err}</div> : null}

      {liquidity ? (
        <div className={`stat section-gap ${liquidity.belowThreshold ? '' : 'navy'}`} style={{ marginBottom: 18, ...(liquidity.belowThreshold ? { border: '2px solid var(--coral, #F1503D)' } : {}) }}>
          <div className="stat-label">Ratio de liquidité (Instruction BCC n°002)</div>
          <div className="stat-value tnum">{liquidity.ratio !== null ? `${liquidity.ratio}%` : '—'}</div>
          <div className="faint" style={{ fontSize: 11, marginTop: 4 }}>
            Seuil minimum requis : {liquidity.minRequired}% — Trésorerie : {formatMoney(liquidity.liquidites)} / Dépôts : {formatMoney(liquidity.depots)}
            {liquidity.belowThreshold ? <span style={{ color: 'var(--coral, #F1503D)', fontWeight: 700 }}> — Sous le seuil</span> : null}
          </div>
        </div>
      ) : null}


      <div className="card section-gap">
        <div className="card-head"><div className="card-title">Comptes déclarés</div></div>
        {accounts.length === 0 ? (
          <EmptyState icon="₵" title="Aucun compte déclaré" message="Déclarez la banque principale et les comptes Mobile Money de la coopérative." />
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>Libellé</th><th>Banque</th><th>N° de compte</th><th>Type</th><th>Statut</th></tr></thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a._id}>
                    <td style={{ fontWeight: 600 }}>{a.label}</td>
                    <td className="muted">{a.bankName || '-'}</td>
                    <td className="mono muted">{a.accountNumber || '-'}</td>
                    <td><Badge tone="info">{a.type === 'mobile_money' ? 'Mobile Money' : 'Banque'}</Badge></td>
                    <td><Badge tone={a.status === 'active' ? 'success' : 'danger'}>{a.status === 'active' ? 'Actif' : 'Inactif'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="hint" style={{ padding: '10px 16px 16px' }}>Le suivi comptable ci-dessous reste agrégé sur un seul compte de trésorerie (521) tant que les mouvements ne sont pas ventilés par compte déclaré.</div>
      </div>

      {!data && !err ? <Loading /> : null}
      {data ? (
        <>
          <div className="stat navy section-gap" style={{ marginBottom: 18 }}>
            <div className="stat-label">Solde consolidé (Banque / Mobile Money)</div>
            <div className="stat-value tnum">{formatMoney(data.closingBalance || 0)}</div>
          </div>

          <div className="card">
            <div className="card-head"><div className="card-title">Historique des mouvements</div></div>
            {data.data.length === 0 ? (
              <EmptyState icon="₵" title="Aucun mouvement" message="Les dépôts et virements Mobile Money apparaîtront ici." />
            ) : (
              <div className="table-wrap">
                <table className="tbl">
                  <thead><tr><th>Date</th><th>Référence</th><th>Libellé</th><th>Débit</th><th>Crédit</th><th>Solde</th></tr></thead>
                  <tbody>
                    {data.data.map((r, i) => (
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
            )}
          </div>
        </>
      ) : null}

      {showModal ? <BankAccountModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} /> : null}
    </div>
  );
}

function BankAccountModal({ onClose, onSaved }) {
  const [f, setF] = useState({ label: '', bankName: '', accountNumber: '', type: 'banque', note: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async () => {
    if (!f.label.trim()) return setErr('Le libellé est requis.');
    setBusy(true); setErr('');
    try { await AccountingAPI.addBankAccount(f); onSaved(); }
    catch (e) { setErr(errorMessage(e)); }
    finally { setBusy(false); }
  };

  return (
    <Modal title="Déclarer un compte bancaire" onClose={onClose}
      footer={<><button className="btn btn-outline" onClick={onClose}>Annuler</button><button className="btn btn-gold" onClick={submit} disabled={busy}>{busy ? '…' : 'Enregistrer'}</button></>}>
      <div className="field"><label className="label">Libellé</label><input className="input" value={f.label} onChange={set('label')} placeholder="Ex : RAWBANK - compte principal" /></div>
      <div className="field"><label className="label">Type</label>
        <select className="select" value={f.type} onChange={set('type')}>
          <option value="banque">Banque</option><option value="mobile_money">Mobile Money</option>
        </select>
      </div>
      <div className="field"><label className="label">Nom de la banque</label><input className="input" value={f.bankName} onChange={set('bankName')} /></div>
      <div className="field"><label className="label">Numéro de compte</label><input className="input" value={f.accountNumber} onChange={set('accountNumber')} /></div>
      <div className="field"><label className="label">Note</label><textarea className="textarea" value={f.note} onChange={set('note')} /></div>
      {err ? <div className="err-text">{err}</div> : null}
    </Modal>
  );
}
