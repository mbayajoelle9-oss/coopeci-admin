'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { errorMessage } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">C</div>
          <h1 style={{ fontSize: 21 }}>COOPECI-DC</h1>
          <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>Back-office administratif</div>
        </div>
        <form onSubmit={submit}>
          <div className="field">
            <label className="label">E-mail professionnel</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="directeur@coopeci-dc.cd" autoFocus />
          </div>
          <div className="field">
            <label className="label">Mot de passe</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error ? <div className="err-text" style={{ marginBottom: 12 }}>{error}</div> : null}
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button>
        </form>
        <div className="muted" style={{ fontSize: 11.5, textAlign: 'center', marginTop: 18 }}>Accès réservé au personnel autorisé · actions tracées</div>
      </div>
    </div>
  );
}
