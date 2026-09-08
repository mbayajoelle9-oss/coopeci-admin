'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Landmark, Users2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { errorMessage } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && isAuthenticated) router.replace('/dashboard'); }, [loading, isAuthenticated, router]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) { setError('Renseignez vos identifiants.'); return; }
    setBusy(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/dashboard');
    } catch (err) {
      setError(errorMessage(err, 'Identifiants incorrects.'));
    } finally { setBusy(false); }
  };

  return (
    <div className="auth-shell">
      <div className="auth-brand">
        <div className="auth-brand-glow" />
        <div className="auth-brand-glow2" />
        <div className="auth-brand-inner">
          <div className="auth-brand-mark">
            <svg viewBox="0 0 100 100" width="30" height="30" fill="none">
              <path d="M 52 24.3 A 27 27 0 1 0 75.5 49.2" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round"/>
              <path d="M 81 19 L 73.5 42.5 L 65.5 30.3 Z" fill="#FFFFFF"/>
            </svg>
          </div>
          <div className="auth-brand-name">COOPECI-DC</div>
          <div className="auth-brand-tagline">Coopérative d'Épargne, de Crédit et d'Investissement Debout Congolais</div>

          <div className="auth-trust">
            <div className="auth-trust-item">
              <span className="auth-trust-ico"><ShieldCheck size={18} strokeWidth={2.2} /></span>
              <div>
                <div className="auth-trust-title">Conforme à la réglementation BCC</div>
                <div className="auth-trust-sub">Contrôles et journalisation des opérations</div>
              </div>
            </div>
            <div className="auth-trust-item">
              <span className="auth-trust-ico"><Lock size={18} strokeWidth={2.2} /></span>
              <div>
                <div className="auth-trust-title">Sécurité de niveau bancaire</div>
                <div className="auth-trust-sub">Connexions chiffrées, accès par rôle</div>
              </div>
            </div>
            <div className="auth-trust-item">
              <span className="auth-trust-ico"><Users2 size={18} strokeWidth={2.2} /></span>
              <div>
                <div className="auth-trust-title">Une plateforme, trois usages</div>
                <div className="auth-trust-sub">Back-office, agents terrain, membres</div>
              </div>
            </div>
          </div>

          <div className="auth-brand-foot">
            <Landmark size={14} /> Coopérative d'Épargne, de Crédit et d'Investissement Debout Congolais
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-form-wrap">
          <div className="auth-form-head">
            <div className="auth-form-title">Connexion</div>
            <div className="auth-form-sub">Accédez à votre espace de gestion</div>
          </div>

          <form onSubmit={submit}>
            <div className="field">
              <label className="label">E-mail professionnel</label>
              <div className="input-ico-wrap">
                <span className="input-ico"><Mail size={17} strokeWidth={2} /></span>
                <input className="input input-ico-pad" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="directeur@coopeci-dc.cd" autoFocus />
              </div>
            </div>
            <div className="field">
              <label className="label">Mot de passe</label>
              <div className="input-ico-wrap">
                <span className="input-ico"><Lock size={17} strokeWidth={2} /></span>
                <input className="input input-ico-pad" type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                <button type="button" className="input-ico-btn" onClick={() => setShowPwd((s) => !s)} aria-label="Afficher le mot de passe" tabIndex={-1}>
                  {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            {error ? <div className="err-text" style={{ marginBottom: 12 }}>{error}</div> : null}
            <button className="btn btn-primary" style={{ width: '100%', height: 46 }} disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button>
          </form>

          <div className="auth-form-note">Mot de passe oublié ? Contactez votre administrateur système.</div>
          <div className="auth-form-security"><Lock size={12} /> Connexion chiffrée · Accès réservé au personnel autorisé · Actions tracées</div>
        </div>
      </div>
    </div>
  );
}
