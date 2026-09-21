'use client';
import { useEffect, useState, useCallback } from 'react';
import { CreditProductAPI, errorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import Loading from '@/components/Loading';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';

export default function CreditProductsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [showModal, setShowModal] = useState(null);

  const load = useCallback(async () => {
    try { const { data } = await CreditProductAPI.list(true); setItems(data.data || []); }
    catch (e) { setErr(errorMessage(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggleActive = async (p) => {
    try { await CreditProductAPI.update(p._id, { active: !p.active }); load(); }
    catch (e) { alert(errorMessage(e)); }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">Produits de crédit</div>
          <div className="page-sub">Crédit scolaire, commercial, agricole, social, express... — chacun avec ses propres bornes</div>
        </div>
        <button className="btn btn-gold btn-sm" onClick={() => setShowModal({})}>+ Nouveau produit</button>
      </div>

      {err ? <div className="err-text section-gap">{err}</div> : null}
      {items.length === 0 ? (
        <div className="card"><EmptyState icon="▤" title="Aucun produit" message="Créez votre premier produit de crédit." /></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>Nom</th><th>Code</th><th>Taux</th><th>Montant</th><th>Durée</th><th>Statut</th><th style={{ textAlign: 'right' }}>Action</th></tr></thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td className="mono muted">{p.code}</td>
                    <td className="mono">{p.interestRate}%</td>
                    <td className="mono muted" style={{ fontSize: 12 }}>{formatMoney(p.minAmount)} – {formatMoney(p.maxAmount)}</td>
                    <td className="muted">{p.minDuration}–{p.maxDuration} mois</td>
                    <td><Badge tone={p.active ? 'success' : 'danger'}>{p.active ? 'Actif' : 'Inactif'}</Badge></td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="inline-actions" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => setShowModal(p)}>Modifier</button>
                        <button className="btn btn-danger btn-sm" onClick={() => toggleActive(p)}>{p.active ? 'Désactiver' : 'Activer'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal ? <ProductModal product={showModal} onClose={() => setShowModal(null)} onSaved={() => { setShowModal(null); load(); }} /> : null}
    </div>
  );
}

function ProductModal({ product, onClose, onSaved }) {
  const isNew = !product._id;
  const [f, setF] = useState({
    name: product.name || '', code: product.code || '', description: product.description || '',
    interestRate: product.interestRate ?? '', feeRate: product.feeRate ?? 0,
    minAmount: product.minAmount ?? '', maxAmount: product.maxAmount ?? '',
    minDuration: product.minDuration ?? '', maxDuration: product.maxDuration ?? '',
    guaranteeRequired: product.guaranteeRequired ?? true,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr('');
    try {
      const payload = {
        ...f,
        interestRate: Number(f.interestRate), feeRate: Number(f.feeRate),
        minAmount: Number(f.minAmount), maxAmount: Number(f.maxAmount),
        minDuration: Number(f.minDuration), maxDuration: Number(f.maxDuration),
      };
      if (isNew) await CreditProductAPI.create(payload);
      else await CreditProductAPI.update(product._id, payload);
      onSaved();
    } catch (e) { setErr(errorMessage(e)); }
    finally { setBusy(false); }
  };

  return (
    <Modal title={isNew ? 'Nouveau produit de crédit' : `Modifier — ${product.name}`} onClose={onClose}
      footer={<><button className="btn btn-outline" onClick={onClose}>Annuler</button><button className="btn btn-gold" onClick={submit} disabled={busy}>{busy ? '…' : 'Enregistrer'}</button></>}>
      <div className="grid grid-2" style={{ columnGap: 14 }}>
        <div className="field"><label className="label">Nom</label><input className="input" value={f.name} onChange={set('name')} placeholder="Crédit scolaire" /></div>
        <div className="field"><label className="label">Code</label><input className="input" value={f.code} onChange={set('code')} placeholder="SCOLAIRE" disabled={!isNew} /></div>
      </div>
      <div className="field"><label className="label">Description</label><textarea className="textarea" value={f.description} onChange={set('description')} /></div>
      <div className="grid grid-2" style={{ columnGap: 14 }}>
        <div className="field"><label className="label">Taux d'intérêt (%/an)</label><input className="input" type="number" value={f.interestRate} onChange={set('interestRate')} /></div>
        <div className="field"><label className="label">Frais de dossier (%)</label><input className="input" type="number" value={f.feeRate} onChange={set('feeRate')} /></div>
      </div>
      <div className="grid grid-2" style={{ columnGap: 14 }}>
        <div className="field"><label className="label">Montant min.</label><input className="input" type="number" value={f.minAmount} onChange={set('minAmount')} /></div>
        <div className="field"><label className="label">Montant max.</label><input className="input" type="number" value={f.maxAmount} onChange={set('maxAmount')} /></div>
      </div>
      <div className="grid grid-2" style={{ columnGap: 14 }}>
        <div className="field"><label className="label">Durée min. (mois)</label><input className="input" type="number" value={f.minDuration} onChange={set('minDuration')} /></div>
        <div className="field"><label className="label">Durée max. (mois)</label><input className="input" type="number" value={f.maxDuration} onChange={set('maxDuration')} /></div>
      </div>
      <div className="field">
        <label className="label"><input type="checkbox" checked={f.guaranteeRequired} onChange={(e) => setF((s) => ({ ...s, guaranteeRequired: e.target.checked }))} style={{ marginRight: 6 }} />Garantie exigée pour ce produit</label>
      </div>
      {err ? <div className="err-text">{err}</div> : null}
    </Modal>
  );
}
