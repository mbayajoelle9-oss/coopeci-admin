'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MembersAPI, CreditAPI, ShareCapitalAPI, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatMoney, formatDate, statusLabel, statusTone, trxLabel, isCredit, initials, can, formatAddress } from '@/lib/format';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import Loading from '@/components/Loading';

const ACCOUNT_LABELS = { savings: 'Épargne', fixed_deposit: 'Dépôt à terme', blocked: 'Bloqué' };

export default function MemberDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [member, setMember] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [edit, setEdit] = useState(false);
  const [pinModal, setPinModal] = useState(false);
  const [credits, setCredits] = useState([]);
  const [shareCapital, setShareCapital] = useState(null);
  const [printingFiche, setPrintingFiche] = useState(false);
  const [printingId, setPrintingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [d, h] = await Promise.all([MembersAPI.detail(id), MembersAPI.history(id)]);
      setMember(d.data.member); setAccounts(d.data.accounts || []); setHistory((h.data.data || []).slice(0, 12));
      CreditAPI.byMember(id).then((r) => setCredits(r.data.data || [])).catch(() => {});
      ShareCapitalAPI.memberSummary(id).then((r) => setShareCapital(r.data)).catch(() => {});
    } catch (e) { setErr(errorMessage(e)); }
    finally { setLoading(false); }
  }, [id]);

  const printFiche = async () => {
    setPrintingFiche(true);
    try {
      const { data } = await MembersAPI.fiche(id);
      const url = URL.createObjectURL(data);
      window.open(url, '_blank');
    } catch (e) { alert(errorMessage(e)); }
    finally { setPrintingFiche(false); }
  };

  const printCreditContract = async (creditId) => {
    setPrintingId(creditId);
    try {
      const { data } = await CreditAPI.printContract(creditId);
      const url = URL.createObjectURL(data);
      window.open(url, '_blank');
    } catch (e) { alert(errorMessage(e)); }
    finally { setPrintingId(null); }
  };

  const printShareCertificate = async (shareId) => {
    setPrintingId(shareId);
    try {
      const { data } = await ShareCapitalAPI.printCertificate(shareId);
      const url = URL.createObjectURL(data);
      window.open(url, '_blank');
    } catch (e) { alert(errorMessage(e)); }
    finally { setPrintingId(null); }
  };

  useEffect(() => { load(); }, [load]);

  const deactivate = async () => {
    if (!confirm('Désactiver ce membre ? Cette action bloque son accès.')) return;
    try { await MembersAPI.deactivate(id); load(); } catch (e) { alert(errorMessage(e)); }
  };

  if (loading) return <Loading />;
  if (!member) return <div className="err-text">{err || 'Membre introuvable.'}</div>;

  return (
    <div>
      <div className="row gap" style={{ marginBottom: 16 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => router.push('/members')}>← Membres</button>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="row between" style={{ flexWrap: 'wrap', gap: 16 }}>
          <div className="row gap" style={{ gap: 16 }}>
            <div className="avatar" style={{ width: 58, height: 58, fontSize: 19 }}>{initials(`${member.firstName} ${member.lastName}`)}</div>
            <div>
              <h2 style={{ fontSize: 21 }}>{member.firstName} {member.lastName}</h2>
              <div className="muted mono" style={{ marginTop: 2 }}>{member.memberNumber} · {member.phone}</div>
              <div style={{ marginTop: 8 }}><Badge tone={statusTone(member.status)}>{statusLabel(member.status)}</Badge></div>
            </div>
          </div>
          {can.memberEdit(user?.role) || can.cashier(user?.role) ? (
            <div className="inline-actions">
              <button className="btn btn-outline btn-sm" onClick={printFiche} disabled={printingFiche}>{printingFiche ? '…' : 'Imprimer la fiche'}</button>
              {can.memberEdit(user?.role) ? <button className="btn btn-outline btn-sm" onClick={() => setEdit(true)}>Modifier</button> : null}
              {can.cashier(user?.role) ? <button className="btn btn-outline btn-sm" onClick={() => setPinModal(true)}>Réinitialiser le mot de passe</button> : null}
              {can.memberEdit(user?.role) && member.status === 'active' ? <button className="btn btn-danger btn-sm" onClick={deactivate}>Désactiver</button> : null}
            </div>
          ) : null}
        </div>

        <div className="def-list section-gap">
          <dt>E-mail</dt><dd>{member.email || '—'}</dd>
          <dt>Pièce d'identité</dt><dd>{member.nationalId || '—'}</dd>
          <dt>Profession</dt><dd>{member.profession || '—'}</dd>
          <dt>Revenu mensuel</dt><dd>{member.monthlyIncome ? formatMoney(member.monthlyIncome) : '—'}</dd>
          <dt>Adresse</dt><dd>{formatAddress(member.address) || '—'}</dd>
          <dt>Inscrit le</dt><dd>{formatDate(member.createdAt)}</dd>
        </div>
      </div>

      <div className="grid grid-2">
        {accounts.map((a) => (
          <div key={a._id} className="card card-pad">
            <div className="row between">
              <Badge tone="info">{ACCOUNT_LABELS[a.type] || a.type}</Badge>
              <span className="muted mono" style={{ fontSize: 12 }}>{a.accountNumber}</span>
            </div>
            <div className="tnum" style={{ fontSize: 25, fontWeight: 800, marginTop: 10, color: 'var(--ink)' }}>{formatMoney(a.balance, a.currency)}</div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>Disponible : {formatMoney(Math.max((a.balance || 0) - (a.blockedBalance || 0), 0), a.currency)}</div>
          </div>
        ))}
      </div>

      <div className="card section-gap">
        <div className="card-head"><div className="card-title">Crédits</div></div>
        <div className="table-wrap">
          {credits.length === 0 ? (
            <div className="muted" style={{ padding: 24, textAlign: 'center' }}>Aucun crédit décaissé.</div>
          ) : (
            <table className="tbl">
              <thead><tr><th>N° crédit</th><th>Montant</th><th>Statut</th><th>Décaissé le</th><th style={{ textAlign: 'right' }}>Action</th></tr></thead>
              <tbody>
                {credits.map((c) => (
                  <tr key={c._id}>
                    <td className="mono" style={{ fontWeight: 600 }}>{c.creditNumber}</td>
                    <td className="mono">{formatMoney(c.amountDisbursed, c.currency)}</td>
                    <td><Badge tone={statusTone(c.status)}>{statusLabel(c.status)}</Badge></td>
                    <td className="muted">{formatDate(c.disbursementDate)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => printCreditContract(c._id)} disabled={printingId === c._id}>{printingId === c._id ? '…' : 'Imprimer le contrat'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card section-gap">
        <div className="card-head between">
          <div className="card-title">Parts sociales</div>
          {shareCapital ? <span className="muted mono" style={{ fontSize: 12.5 }}>{shareCapital.totalParts} part(s) — {formatMoney(shareCapital.totalValue)}</span> : null}
        </div>
        <div className="table-wrap">
          {!shareCapital || (shareCapital.history || []).length === 0 ? (
            <div className="muted" style={{ padding: 24, textAlign: 'center' }}>Aucun mouvement de parts sociales.</div>
          ) : (
            <table className="tbl">
              <thead><tr><th>Type</th><th>Parts</th><th>Montant</th><th>Date</th><th style={{ textAlign: 'right' }}>Action</th></tr></thead>
              <tbody>
                {shareCapital.history.map((h) => (
                  <tr key={h._id}>
                    <td>{h.type === 'subscription' ? 'Souscription' : 'Remboursement'}<div className="muted mono" style={{ fontSize: 11 }}>{h.reference}</div></td>
                    <td className="mono">{h.numberOfParts}</td>
                    <td className="mono">{formatMoney(h.amount)}</td>
                    <td className="muted">{formatDate(h.createdAt)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => printShareCertificate(h._id)} disabled={printingId === h._id}>{printingId === h._id ? '…' : 'Imprimer'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card section-gap">
        <div className="card-head"><div className="card-title">Dernières opérations</div></div>
        <div className="table-wrap">
          {history.length === 0 ? (
            <div className="muted" style={{ padding: 24, textAlign: 'center' }}>Aucune opération.</div>
          ) : (
            <table className="tbl">
              <thead><tr><th>Type</th><th>Montant</th><th>Statut</th><th>Référence</th><th>Date</th></tr></thead>
              <tbody>
                {history.map((t) => (
                  <tr key={t._id}>
                    <td style={{ fontWeight: 600 }}>{trxLabel(t.type)}</td>
                    <td className="mono" style={{ color: isCredit(t.type) ? 'var(--mint)' : 'var(--text)' }}>{isCredit(t.type) ? '+' : '−'}{formatMoney(t.amount, t.currency)}</td>
                    <td><Badge tone={statusTone(t.status)}>{statusLabel(t.status)}</Badge></td>
                    <td className="mono muted" style={{ fontSize: 12.5 }}>{t.reference}</td>
                    <td className="muted">{formatDate(t.createdAt, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {edit ? <EditMemberModal member={member} onClose={() => setEdit(false)} onSaved={() => { setEdit(false); load(); }} /> : null}
      {pinModal ? <ResetPasswordModal member={member} onClose={() => setPinModal(false)} /> : null}
    </div>
  );
}

function ResetPasswordModal({ member, onClose }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [tempPassword, setTempPassword] = useState(null);

  const confirmReset = async () => {
    setBusy(true); setErr('');
    try {
      const { data } = await MembersAPI.resetPassword(member._id);
      setTempPassword(data.tempPassword);
    } catch (e) { setErr(errorMessage(e)); }
    finally { setBusy(false); }
  };

  return (
    <Modal title="Réinitialiser le mot de passe" onClose={onClose}
      footer={tempPassword
        ? <button className="btn btn-primary" onClick={onClose}>Terminé</button>
        : <><button className="btn btn-outline" onClick={onClose}>Annuler</button><button className="btn btn-gold" onClick={confirmReset} disabled={busy}>{busy ? 'Génération…' : 'Générer un nouveau mot de passe'}</button></>}>
      {tempPassword ? (
        <div>
          <div className="hint" style={{ marginBottom: 10 }}>Communiquez ce mot de passe à <b>{member.firstName} {member.lastName}</b> de vive voix (guichet ou téléphone). Il ne sera plus affiché ensuite.</div>
          <div className="tnum" style={{ fontSize: 28, fontWeight: 800, textAlign: 'center', letterSpacing: 4, background: 'var(--surface-alt)', borderRadius: 12, padding: '18px 0', color: 'var(--ink)' }}>{tempPassword}</div>
          <div className="hint" style={{ marginTop: 10 }}>Le membre pourra le changer depuis son application une fois connecté.</div>
        </div>
      ) : (
        <div>
          <p style={{ margin: 0 }}>Un nouveau mot de passe sera généré pour <b>{member.firstName} {member.lastName}</b> ({member.phone}), remplaçant l'ancien immédiatement.</p>
          {err ? <div className="err-text" style={{ marginTop: 10 }}>{err}</div> : null}
        </div>
      )}
    </Modal>
  );
}

function EditMemberModal({ member, onClose, onSaved }) {
  const [f, setF] = useState({ email: member.email || '', profession: member.profession || '', address: formatAddress(member.address), monthlyIncome: member.monthlyIncome || '', status: member.status });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const save = async () => {
    setBusy(true); setErr('');
    try {
      await MembersAPI.update(member._id, { ...f, monthlyIncome: f.monthlyIncome ? Number(f.monthlyIncome) : undefined });
      onSaved();
    } catch (e) { setErr(errorMessage(e)); }
    finally { setBusy(false); }
  };

  return (
    <Modal title="Modifier le membre" onClose={onClose}
      footer={<><button className="btn btn-outline" onClick={onClose}>Annuler</button><button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button></>}>
      <div className="field"><label className="label">E-mail</label><input className="input" value={f.email} onChange={set('email')} /></div>
      <div className="field"><label className="label">Profession</label><input className="input" value={f.profession} onChange={set('profession')} /></div>
      <div className="field"><label className="label">Adresse</label><input className="input" value={f.address} onChange={set('address')} /></div>
      <div className="field"><label className="label">Revenu mensuel (CDF)</label><input className="input" value={f.monthlyIncome} onChange={(e) => setF((s) => ({ ...s, monthlyIncome: e.target.value.replace(/[^0-9]/g, '') }))} /></div>
      <div className="field"><label className="label">Statut</label>
        <select className="select" value={f.status} onChange={set('status')}>
          <option value="active">Actif</option><option value="suspended">Suspendu</option><option value="pending">En attente</option><option value="closed">Clôturé</option>
        </select>
      </div>
      {err ? <div className="err-text">{err}</div> : null}
    </Modal>
  );
}
