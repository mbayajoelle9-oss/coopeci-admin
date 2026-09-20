'use client';
import { useEffect, useState } from 'react';
import { GovernanceAPI, errorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import Loading from '@/components/Loading';
import Badge from '@/components/Badge';

export default function ConsolidationPage() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    GovernanceAPI.consolidation().then((r) => setData(r.data)).catch((e) => setErr(errorMessage(e)));
  }, []);

  if (err) return <div className="err-text">{err}</div>;
  if (!data) return <Loading />;

  const { dashboard, par, balanceSheet, incomeStatement, shareCapital } = data;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">Consolidation</div>
          <div className="page-sub">Vue d'ensemble consolidée — réservée à la Direction / Gérance</div>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 18 }}>
        <div className="stat navy">
          <div className="stat-label">Épargne totale</div>
          <div className="stat-value tnum">{formatMoney(dashboard.savings?.totalBalance || 0)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Capital (parts sociales)</div>
          <div className="stat-value tnum">{formatMoney(shareCapital.grandTotal || 0)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Résultat de l'exercice</div>
          <div className="stat-value tnum">{formatMoney(incomeStatement.resultat || 0)}</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 18 }}>
        <div className="card">
          <div className="card-head between"><div className="card-title">Bilan</div>
            <Badge tone={balanceSheet.equilibre ? 'success' : 'danger'}>{balanceSheet.equilibre ? 'Équilibré' : 'Déséquilibre'}</Badge>
          </div>
          <div className="card-pad">
            <dl className="def-list">
              <dt>Total Actif</dt><dd className="tnum">{formatMoney(balanceSheet.totalActif)}</dd>
              <dt>Total Passif</dt><dd className="tnum">{formatMoney(balanceSheet.totalPassif)}</dd>
              <dt>Résultat de l'exercice</dt><dd className="tnum">{formatMoney(balanceSheet.resultatExercice)}</dd>
            </dl>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><div className="card-title">Portefeuille à risque (PAR)</div></div>
          <div className="card-pad">
            <dl className="def-list">
              <dt>Encours total</dt><dd className="tnum">{formatMoney(par.outstanding)}</dd>
              <dt>Montant en retard</dt><dd className="tnum">{formatMoney(par.atRisk)}</dd>
              <dt>Ratio PAR</dt><dd className="tnum">{par.parRatio}%</dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><div className="card-title">Composition des membres</div></div>
        <div className="card-pad">
          <dl className="def-list">
            <dt>Membres actifs</dt><dd className="tnum">{dashboard.members?.active}</dd>
            <dt>Membres au total</dt><dd className="tnum">{dashboard.members?.total}</dd>
            <dt>Comptes d'épargne</dt><dd className="tnum">{dashboard.savings?.count}</dd>
            <dt>Sociétaires détenant des parts</dt><dd className="tnum">{shareCapital.data?.length || 0}</dd>
          </dl>
        </div>
      </div>

      <div className="hint section-gap">Généré le {new Date(data.generatedAt).toLocaleString('fr-FR')} — rassemble en une seule vue les données déjà disponibles dans les modules Tableau de bord, Comptabilité et Parts sociales.</div>
    </div>
  );
}
