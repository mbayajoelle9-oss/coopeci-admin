'use client';
import { useEffect, useState } from 'react';
import { SettingsAPI, errorMessage } from '@/lib/api';
import Loading from '@/components/Loading';

export default function SettingsPage() {
  const [f, setF] = useState(null);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    SettingsAPI.get().then((r) => setF(r.data.settings)).catch((e) => setErr(errorMessage(e)));
  }, []);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr(''); setOk(false);
    try {
      const payload = {
        ...f,
        defaultInterestRate: Number(f.defaultInterestRate),
        defaultLateFeeRate: Number(f.defaultLateFeeRate),
        shareUnitValue: Number(f.shareUnitValue),
        creditRemoteMaxAmount: Number(f.creditRemoteMaxAmount),
        maxLoginAttempts: Number(f.maxLoginAttempts),
        accountLockMinutes: Number(f.accountLockMinutes),
      };
      const { data } = await SettingsAPI.update(payload);
      setF(data.settings);
      setOk(true);
    } catch (e) { setErr(errorMessage(e)); }
    finally { setBusy(false); }
  };

  if (!f) return err ? <div className="err-text">{err}</div> : <Loading />;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">Paramétrages</div>
          <div className="page-sub">Réservé à l'administrateur — paramètres généraux de la coopérative</div>
        </div>
        <button className="btn btn-gold btn-sm" onClick={submit} disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
      </div>

      {ok ? <div className="hint" style={{ color: 'var(--mint)', marginBottom: 14 }}>Paramètres enregistrés.</div> : null}
      {err ? <div className="err-text section-gap">{err}</div> : null}

      <div className="card section-gap">
        <div className="card-head"><div className="card-title">Identité de la coopérative</div></div>
        <div className="card-pad">
          <div className="grid grid-2" style={{ columnGap: 14 }}>
            <div className="field"><label className="label">Nom court</label><input className="input" value={f.coopName || ''} onChange={set('coopName')} /></div>
            <div className="field"><label className="label">Numéro d'agrément BCC</label><input className="input" value={f.approvalNumber || ''} onChange={set('approvalNumber')} /></div>
          </div>
          <div className="field"><label className="label">Dénomination complète</label><input className="input" value={f.coopFullName || ''} onChange={set('coopFullName')} /></div>
          <div className="field"><label className="label">Adresse</label><input className="input" value={f.address || ''} onChange={set('address')} /></div>
          <div className="grid grid-2" style={{ columnGap: 14 }}>
            <div className="field"><label className="label">Téléphone</label><input className="input" value={f.phone || ''} onChange={set('phone')} /></div>
            <div className="field"><label className="label">E-mail</label><input className="input" value={f.email || ''} onChange={set('email')} /></div>
          </div>
        </div>
      </div>

      <div className="card section-gap">
        <div className="card-head"><div className="card-title">Paramètres financiers</div></div>
        <div className="card-pad">
          <div className="grid grid-2" style={{ columnGap: 14 }}>
            <div className="field"><label className="label">Taux d'intérêt par défaut (%/an)</label><input className="input" type="number" value={f.defaultInterestRate} onChange={set('defaultInterestRate')} /></div>
            <div className="field"><label className="label">Taux de pénalité de retard (%)</label><input className="input" type="number" value={f.defaultLateFeeRate} onChange={set('defaultLateFeeRate')} /></div>
          </div>
          <div className="grid grid-2" style={{ columnGap: 14 }}>
            <div className="field"><label className="label">Valeur nominale d'une part sociale (CDF)</label><input className="input" type="number" value={f.shareUnitValue} onChange={set('shareUnitValue')} /></div>
            <div className="field"><label className="label">Seuil de crédit à distance (USD)</label><input className="input" type="number" value={f.creditRemoteMaxAmount} onChange={set('creditRemoteMaxAmount')} /></div>
          </div>
          <div className="field"><label className="label">Devise par défaut</label>
            <select className="select" value={f.defaultCurrency} onChange={set('defaultCurrency')}>
              <option value="CDF">CDF</option><option value="USD">USD</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card section-gap">
        <div className="card-head"><div className="card-title">Sécurité</div></div>
        <div className="card-pad">
          <div className="grid grid-2" style={{ columnGap: 14 }}>
            <div className="field"><label className="label">Tentatives de connexion max.</label><input className="input" type="number" value={f.maxLoginAttempts} onChange={set('maxLoginAttempts')} /></div>
            <div className="field"><label className="label">Durée de verrouillage (minutes)</label><input className="input" type="number" value={f.accountLockMinutes} onChange={set('accountLockMinutes')} /></div>
          </div>
          <div className="hint">Ces deux valeurs sont affichées et enregistrées, mais leur application effective dans le contrôle de connexion nécessite une confirmation technique complémentaire avant de s'y fier pleinement.</div>
        </div>
      </div>

      <div className="card section-gap">
        <div className="card-head"><div className="card-title">Moyen de paiement actif</div></div>
        <div className="card-pad">
          <div className="field"><label className="label">Fournisseur</label>
            <select className="select" value={f.activePaymentProvider} onChange={set('activePaymentProvider')}>
              <option value="mock">Test (mock)</option>
              <option value="multipay">Multipay</option>
              <option value="flexpay">FlexPay</option>
            </select>
          </div>
          <div className="hint">Affiché ici à titre indicatif — le fournisseur réellement actif est celui défini par la variable d'environnement PAYMENT_PROVIDER sur le serveur. Modifier cette valeur ici ne change pas le comportement réel du serveur.</div>
        </div>
      </div>
    </div>
  );
}
