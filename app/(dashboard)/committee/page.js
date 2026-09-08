'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CommitteeAPI, errorMessage } from '@/lib/api';
import { formatMoney, formatDate, statusLabel, statusTone } from '@/lib/format';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import Loading from '@/components/Loading';

export default function CommitteePage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [voteFor, setVoteFor] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const { data } = await CommitteeAPI.pending();
      setItems(data.data || data.applications || data.pending || []);
    } catch (e) { setErr(errorMessage(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loading />;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">Comité de crédit</div>
          <div className="page-sub">Dossiers en attente d'avis du comité</div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card"><EmptyState icon="⚖" title="Aucun dossier au comité" message={err || 'Les demandes transmises au comité apparaîtront ici.'} /></div>
      ) : (
        <div className="grid grid-2">
          {items.map((a) => (
            <div key={a._id} className="card card-pad">
              <div className="row between">
                <span className="mono" style={{ fontWeight: 700 }}>{a.applicationNumber}</span>
                <Badge tone={statusTone(a.status)}>{statusLabel(a.status)}</Badge>
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700, marginTop: 8 }} className="tnum">{formatMoney(a.amountRequested)}</div>
              <div className="muted" style={{ marginTop: 2 }}>{a.member ? `${a.member.firstName} ${a.member.lastName}` : '—'} · {a.duration} mois</div>
              {typeof a.score === 'number' ? <div style={{ marginTop: 8 }}><Badge tone={a.score >= 60 ? 'success' : a.score >= 40 ? 'warning' : 'danger'}>Score {a.score}/100</Badge></div> : null}
              <div className="inline-actions" style={{ marginTop: 14 }}>
                <button className="btn btn-outline btn-sm" onClick={() => router.push(`/credits/${a._id}`)}>Voir le dossier</button>
                <button className="btn btn-primary btn-sm" onClick={() => setVoteFor(a)}>Voter</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {voteFor ? <VoteModal app={voteFor} onClose={() => setVoteFor(null)} onDone={() => { setVoteFor(null); load(); }} /> : null}
    </div>
  );
}

function VoteModal({ app, onClose, onDone }) {
  const [decision, setDecision] = useState('approve');
  const [comment, setComment] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true); setErr('');
    try { await CommitteeAPI.vote(app._id, decision, comment); onDone(); }
    catch (e) { setErr(errorMessage(e)); }
    finally { setBusy(false); }
  };

  return (
    <Modal title={`Vote — ${app.applicationNumber}`} onClose={onClose}
      footer={<><button className="btn btn-outline" onClick={onClose}>Annuler</button><button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? '…' : 'Enregistrer le vote'}</button></>}>
      <div className="field"><label className="label">Avis</label>
        <select className="select" value={decision} onChange={(e) => setDecision(e.target.value)}>
          <option value="approve">Favorable</option>
          <option value="reject">Défavorable</option>
          <option value="more_info">Demande de complément</option>
          <option value="abstain">Abstention</option>
        </select>
      </div>
      <div className="field"><label className="label">Commentaire</label><textarea className="textarea" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Motivation de votre avis (optionnel)" /></div>
      {err ? <div className="err-text">{err}</div> : null}
    </Modal>
  );
}
