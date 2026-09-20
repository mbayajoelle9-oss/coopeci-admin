'use client';
import { useEffect, useState } from 'react';
import { AccountingAPI, errorMessage } from '@/lib/api';
import { formatMoney, formatDate } from '@/lib/format';
import Loading from '@/components/Loading';
import EmptyState from '@/components/EmptyState';

export default function BankPage() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    AccountingAPI.ledger('521').then((r) => setData(r.data)).catch((e) => setErr(errorMessage(e)));
  }, []);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">Banque</div>
          <div className="page-sub">Mouvements du compte Banque / Mobile Money (FlexPay) — compte 521</div>
        </div>
      </div>

      {err ? <div className="err-text section-gap">{err}</div> : null}
      {!data && !err ? <Loading /> : null}

      {data ? (
        <>
          <div className="stat navy section-gap" style={{ marginBottom: 18 }}>
            <div className="stat-label">Solde actuel du compte Banque</div>
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
    </div>
  );
}
