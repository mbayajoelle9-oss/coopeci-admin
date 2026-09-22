'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CreditAPI, CommitteeAPI, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatMoney, formatDate, statusLabel, statusTone, can, NEXT_STATUSES } from '@/lib/format';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import Loading from '@/components/Loading';

const DECISION_LABEL = { approve: 'Favorable', reject: 'Défavorable', more_info: 'Complément', abstain: 'Abstention' };
const DECISION_TONE = { approve: 'success', reject: 'danger', more_info: 'warning', abstain: 'neutral' };

export default function CreditApplicationPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [app, setApp] = useState(null);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [statusModal, setStatusModal] = useState(false);
  const [disburseModal, setDisburseModal] = useState(false);
  const [creditId, setCreditId] = useState(null);
  const [printing, setPrinting] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await CreditAPI.applicationDetail(id);
      setApp(data.application);
      setVotes(data.application?.committeeVotes || []);
      if (!data.application?.committeeVotes) {
        try { const v = await CommitteeAPI.votes(id); setVotes(v.data.votes || v.data.data || []); } catch (e) {}
      }
      if (data.application?.status === 'disbursed') {
        try { const c = await CreditAPI.byApplication(id); setCreditId(c.data.credit._id); } catch (e) {}
      }
    } catch (e) { setErr(errorMessage(e)); }
    finally { setLoading(false); }
  }, [id]);

  const printContract = async () => {
    setPrinting(true);
    try {
      const { data } = await CreditAPI.printContract(creditId);
      const url = URL.createObjectURL(data);
      window.open(url, '_blank');
    } catch (e) { alert(errorMessage(e)); }
    finally { setPrinting(false); }
  };

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loading />;
  if (!app) return <div className="err-text">{err || 'Dossier introuvable.'}</div>;

  const m = app.member || {};
  const decision = can.creditDecision(user?.role);
  const nextStatuses = NEXT_STATUSES[app.status] || [];
  const canDisburse = decision && app.status === 'approved';

  return (
    <div>
      <div className="row gap" style={{ marginBottom: 16 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => router.push('/credits')}>← Crédits</button>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="row between" style={{ flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div className="row gap" style={{ gap: 10 }}>
              <h2 style={{ fontSize: 20 }} className="mono">{app.applicationNumber}</h2>
              <Badge tone={statusTone(app.status)}>{statusLabel(app.status)}</Badge>
            </div>
            <div className="muted" style={{ marginTop: 6, cursor: m._id ? 'pointer' : 'default' }} onClick={() => m._id && router.push(`/members/${m._id}`)}>
              {m.firstName} {m.lastName} · <span className="mono">{m.memberNumber}</span>{m.phone ? ` · ${m.phone}` : ''}
            </div>
          </div>
          <div className="inline-actions">
            {app.status === 'disbursed' && creditId ? (
              <button className="btn btn-outline btn-sm" onClick={printContract} disabled={printing}>{printing ? '…' : 'Imprimer le contrat'}</button>
            ) : null}
            {decision ? (
              <>
                {nextStatuses.length ? <button className="btn btn-primary btn-sm" onClick={() => setStatusModal(true)}>Changer le statut</button> : null}
                {canDisburse ? <button className="btn btn-gold btn-sm" onClick={() => setDisburseModal(true)}>Décaisser</button> : null}
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-head"><div className="card-title">Éléments du dossier</div></div>
          <div className="card-pad">
            <div className="def-list">
              <dt>Montant demandé</dt><dd className="mono">{formatMoney(app.amountRequested)}</dd>
              {app.amountApproved ? <><dt>Montant approuvé</dt><dd className="mono">{formatMoney(app.amountApproved)}</dd></> : null}
              <dt>Durée</dt><dd>{app.duration} mois</dd>
              <dt>Taux</dt><dd>{app.interestRate}%</dd>
              <dt>Objet</dt><dd>{app.purpose || '—'}</dd>
              <dt>Revenu mensuel</dt><dd className="mono">{formatMoney(app.monthlyIncome)}</dd>
              <dt>Charges mensuelles</dt><dd className="mono">{formatMoney(app.monthlyExpenses)}</dd>
              <dt>Garanties</dt><dd>{app.proposedGuarantees || '—'}</dd>
              {typeof app.score === 'number' ? <><dt>Score</dt><dd><Badge tone={app.score >= 60 ? 'success' : app.score >= 40 ? 'warning' : 'danger'}>{app.score}/100</Badge></dd></> : null}
              {app.rejectionReason ? <><dt>Motif de refus</dt><dd>{app.rejectionReason}</dd></> : null}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Avis du comité</div></div>
          <div className="card-pad">
            {votes.length === 0 ? (
              <div className="muted" style={{ padding: '10px 0' }}>Aucun vote enregistré.</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {votes.map((v, i) => (
                  <div key={v._id || i} className="row between" style={{ paddingBottom: 10, borderBottom: i < votes.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{v.member?.name || v.memberName || 'Membre du comité'}</div>
                      {v.comment ? <div className="muted" style={{ fontSize: 12.5 }}>{v.comment}</div> : null}
                    </div>
                    <Badge tone={DECISION_TONE[v.decision] || 'neutral'}>{DECISION_LABEL[v.decision] || v.decision}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {Array.isArray(app.statusHistory) && app.statusHistory.length ? (
        <div className="card section-gap">
          <div className="card-head"><div className="card-title">Historique</div></div>
          <div className="card-pad">
            <div style={{ display: 'grid', gap: 12 }}>
              {app.statusHistory.slice().reverse().map((h, i) => (
                <div key={i} className="row gap" style={{ gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ marginTop: 3 }}><Badge tone={statusTone(h.status)}>{statusLabel(h.status)}</Badge></div>
                  <div style={{ flex: 1 }}>
                    {h.comment ? <div style={{ fontSize: 13.5 }}>{h.comment}</div> : null}
                    <div className="faint" style={{ fontSize: 12 }}>{formatDate(h.date || h.createdAt, true)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {statusModal ? <StatusModal app={app} nextStatuses={nextStatuses} onClose={() => setStatusModal(false)} onDone={() => { setStatusModal(false); load(); }} /> : null}
      {disburseModal ? <DisburseModal app={app} onClose={() => setDisburseModal(false)} onDone={() => { setDisburseModal(false); load(); }} /> : null}
    </div>
  );
}

function StatusModal({ app, nextStatuses, onClose, onDone }) {
  const [status, setStatus] = useState(nextStatuses[0] || '');
  const [comment, setComment] = useState('');
  const [amountApproved, setAmountApproved] = useState(String(app.amountRequested || ''));
  const [rejectionReason, setRejectionReason] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true); setErr('');
    try {
      const payload = { status, comment };
      if (status === 'approved') payload.amountApproved = Number(amountApproved) || app.amountRequested;
      if (status === 'rejected') payload.rejectionReason = rejectionReason;
      await CreditAPI.updateStatus(app._id, payload);
      onDone();
    } catch (e) { setErr(errorMessage(e)); }
    finally { setBusy(false); }
  };

  return (
    <Modal title="Changer le statut du dossier" onClose={onClose}
      footer={<><button className="btn btn-outline" onClick={onClose}>Annuler</button><button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? '…' : 'Valider'}</button></>}>
      <div className="field"><label className="label">Nouveau statut</label>
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
          {nextStatuses.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </select>
      </div>
      {status === 'approved' ? (
        <div className="field"><label className="label">Montant approuvé (CDF)</label><input className="input mono" value={amountApproved} onChange={(e) => setAmountApproved(e.target.value.replace(/[^0-9]/g, ''))} /></div>
      ) : null}
      {status === 'rejected' ? (
        <div className="field"><label className="label">Motif de refus</label><textarea className="textarea" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} /></div>
      ) : null}
      <div className="field"><label className="label">Commentaire</label><textarea className="textarea" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Note d'instruction (optionnel)" /></div>
      {err ? <div className="err-text">{err}</div> : null}
    </Modal>
  );
}

function DisburseModal({ app, onClose, onDone }) {
  const [method, setMethod] = useState('account');
  const [phone, setPhone] = useState(app.member?.phone || '');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const [creditId, setCreditId] = useState(null);
  const [printing, setPrinting] = useState(false);

  const submit = async () => {
    setBusy(true); setErr('');
    try {
      const { data } = await CreditAPI.disburse(app._id, { method, phone: method === 'mobile_money' ? phone : undefined });
      setCreditId(data.credit._id);
    } catch (e) { setErr(errorMessage(e)); }
    finally { setBusy(false); }
  };

  const printContract = async () => {
    setPrinting(true);
    try {
      const { data } = await CreditAPI.printContract(creditId);
      const url = URL.createObjectURL(data);
      window.open(url, '_blank');
    } catch (e) { alert(errorMessage(e)); }
    finally { setPrinting(false); }
  };

  if (creditId) {
    return (
      <Modal title="Crédit décaissé" onClose={onDone}
        footer={<><button className="btn btn-outline" onClick={onDone}>Fermer</button><button className="btn btn-gold" onClick={printContract} disabled={printing}>{printing ? '…' : 'Imprimer le contrat'}</button></>}>
        <div className="hint">Le décaissement est confirmé et l'échéancier généré. Vous pouvez imprimer le contrat de crédit à faire signer par le membre.</div>
      </Modal>
    );
  }

  return (
    <Modal title="Décaisser le crédit" onClose={onClose}
      footer={<><button className="btn btn-outline" onClick={onClose}>Annuler</button><button className="btn btn-gold" onClick={submit} disabled={busy}>{busy ? 'Décaissement…' : 'Confirmer le décaissement'}</button></>}>
      <p className="muted" style={{ marginTop: 0 }}>Montant : <strong className="mono" style={{ color: 'var(--text)' }}>{formatMoney(app.amountApproved || app.amountRequested)}</strong> sur {app.duration} mois.</p>
      <div className="field"><label className="label">Mode de décaissement</label>
        <select className="select" value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="account">Crédit sur compte épargne</option>
          <option value="mobile_money">Mobile money</option>
        </select>
      </div>
      {method === 'mobile_money' ? (
        <div className="field"><label className="label">Numéro à créditer</label><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08XXXXXXXX" /></div>
      ) : null}
      <p className="hint">L'échéancier est généré automatiquement et le crédit passe en « actif ».</p>
      {err ? <div className="err-text">{err}</div> : null}
    </Modal>
  );
}
