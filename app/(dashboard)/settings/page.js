'use client';
import { useEffect, useState } from 'react';
import { SettingsAPI, EmployeeAPI, errorMessage } from '@/lib/api';
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

  const uploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { const { data } = await EmployeeAPI.upload(file); setF((s) => ({ ...s, logoUrl: data.url })); }
    catch (er) { alert(errorMessage(er)); }
  };

  const submit = async () => {
    setBusy(true); setErr(''); setOk(false);
    try {
      const payload = {
        ...f,
        employeeDocumentTypes: (f.employeeDocumentTypes || []).map((t) => t.trim()).filter(Boolean),
        defaultInterestRate: Number(f.defaultInterestRate),
        defaultLateFeeRate: Number(f.defaultLateFeeRate),
        shareUnitValue: Number(f.shareUnitValue),
        creditRemoteMaxAmount: Number(f.creditRemoteMaxAmount),
        maxLoginAttempts: Number(f.maxLoginAttempts),
        accountLockMinutes: Number(f.accountLockMinutes),
        minLiquidityRatio: Number(f.minLiquidityRatio),
        maxConcentrationRatio: Number(f.maxConcentrationRatio),
        cashMinAmount: Number(f.cashMinAmount),
        cashMaxAmount: Number(f.cashMaxAmount),
        auditRetentionYears: Number(f.auditRetentionYears),
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
          <div className="row" style={{ gap: 16, alignItems: 'center', marginBottom: 16 }}>
            {f.logoUrl ? <img src={f.logoUrl} alt="Logo" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'contain', background: 'var(--surface-alt)' }} /> : <div className="avatar" style={{ width: 64, height: 64 }}>?</div>}
            <div className="field" style={{ marginBottom: 0 }}><label className="label">Logo de la coopérative</label><input className="input" type="file" accept="image/*" onChange={uploadLogo} /></div>
          </div>
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
        <div className="card-head"><div className="card-title">Documents attendus au dossier employé</div></div>
        <div className="card-pad">
          <div className="hint" style={{ marginBottom: 10 }}>Ces types apparaissent dans la liste déroulante quand un document est déposé dans le dossier RH d'un employé.</div>
          {(f.employeeDocumentTypes || []).map((t, i) => (
            <div key={i} className="row gap" style={{ marginBottom: 8 }}>
              <input className="input" value={t} onChange={(e) => setF((s) => {
                const list = [...s.employeeDocumentTypes]; list[i] = e.target.value; return { ...s, employeeDocumentTypes: list };
              })} />
              <button className="btn btn-danger btn-sm" onClick={() => setF((s) => ({ ...s, employeeDocumentTypes: s.employeeDocumentTypes.filter((_, j) => j !== i) }))}>Retirer</button>
            </div>
          ))}
          <button className="btn btn-outline btn-sm" onClick={() => setF((s) => ({ ...s, employeeDocumentTypes: [...(s.employeeDocumentTypes || []), ''] }))}>+ Ajouter un type</button>
        </div>
      </div>

      <div className="card section-gap">
        <div className="card-head"><div className="card-title">Classification des crédits et barème de provisionnement</div></div>
        <div className="card-pad">
          <div className="hint" style={{ marginBottom: 12, color: 'var(--amber, #F2A93B)' }}>
            ⚠️ Ces tranches et taux ne sont pas encore confirmés officiellement — à ajuster ici dès validation avec la BCC, sans besoin de nouveau développement.
          </div>
          <table className="tbl" style={{ marginBottom: 10 }}>
            <thead><tr><th>Libellé</th><th>Jours min.</th><th>Jours max.</th><th>Provision (%)</th><th /></tr></thead>
            <tbody>
              {(f.creditClassification || []).map((c, i) => (
                <tr key={i}>
                  <td><input className="input" value={c.label || ''} onChange={(e) => setF((s) => { const l = [...s.creditClassification]; l[i] = { ...l[i], label: e.target.value }; return { ...s, creditClassification: l }; })} /></td>
                  <td><input className="input" type="number" style={{ width: 90 }} value={c.minDaysLate ?? ''} onChange={(e) => setF((s) => { const l = [...s.creditClassification]; l[i] = { ...l[i], minDaysLate: Number(e.target.value) }; return { ...s, creditClassification: l }; })} /></td>
                  <td><input className="input" type="number" style={{ width: 90 }} placeholder="illimité" value={c.maxDaysLate ?? ''} onChange={(e) => setF((s) => { const l = [...s.creditClassification]; l[i] = { ...l[i], maxDaysLate: e.target.value === '' ? null : Number(e.target.value) }; return { ...s, creditClassification: l }; })} /></td>
                  <td><input className="input" type="number" style={{ width: 90 }} value={c.provisionRate ?? ''} onChange={(e) => setF((s) => { const l = [...s.creditClassification]; l[i] = { ...l[i], provisionRate: Number(e.target.value) }; return { ...s, creditClassification: l }; })} /></td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => setF((s) => ({ ...s, creditClassification: s.creditClassification.filter((_, j) => j !== i) }))}>Retirer</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn btn-outline btn-sm" onClick={() => setF((s) => ({ ...s, creditClassification: [...(s.creditClassification || []), { label: '', minDaysLate: 0, maxDaysLate: null, provisionRate: 0 }] }))}>+ Ajouter une tranche</button>
        </div>
      </div>

      <div className="card section-gap">
        <div className="card-head"><div className="card-title">Normes prudentielles (Instruction BCC n°002)</div></div>
        <div className="card-pad">
          <div className="grid grid-2" style={{ columnGap: 14 }}>
            <div className="field"><label className="label">Taux de liquidité minimum (%)</label><input className="input" type="number" value={f.minLiquidityRatio} onChange={set('minLiquidityRatio')} /></div>
            <div className="field"><label className="label">Limite de concentration — crédit max/membre (% fonds propres)</label><input className="input" type="number" value={f.maxConcentrationRatio} onChange={set('maxConcentrationRatio')} /></div>
          </div>
          <div className="grid grid-2" style={{ columnGap: 14 }}>
            <div className="field"><label className="label">Encaisse minimum (CDF)</label><input className="input" type="number" value={f.cashMinAmount} onChange={set('cashMinAmount')} /></div>
            <div className="field"><label className="label">Plafond d'encaisse (CDF)</label><input className="input" type="number" value={f.cashMaxAmount} onChange={set('cashMaxAmount')} /></div>
          </div>
          <div className="field"><label className="label">Durée de conservation des pistes d'audit (années)</label><input className="input" type="number" value={f.auditRetentionYears} onChange={set('auditRetentionYears')} style={{ maxWidth: 200 }} /></div>
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
