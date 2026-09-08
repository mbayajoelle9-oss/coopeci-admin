import { ShieldCheck, Lock, FileCheck2 } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="app-footer">
      <div className="app-footer-top">
        <div className="app-footer-brand">
          <div className="app-footer-logo">
            <svg viewBox="0 0 100 100" width="16" height="16" fill="none">
              <path d="M 52 24.3 A 27 27 0 1 0 75.5 49.2" stroke="#FFFFFF" strokeWidth="14" strokeLinecap="round"/>
              <path d="M 81 19 L 73.5 42.5 L 65.5 30.3 Z" fill="#FFFFFF"/>
            </svg>
          </div>
          <div>
            <div className="app-footer-name">COOPECI-DC</div>
            <div className="app-footer-sub">Coopérative d'Épargne, de Crédit et d'Investissement Debout Congolais</div>
          </div>
        </div>

        <div className="app-footer-cols">
          <div>
            <div className="app-footer-col-title">Plateforme</div>
            <span className="app-footer-link">Back-office v1.0</span>
            <span className="app-footer-link">Application Agent (POS)</span>
            <span className="app-footer-link">Application Membre</span>
          </div>
          <div>
            <div className="app-footer-col-title">Support</div>
            <span className="app-footer-link">Assistance technique</span>
            <span className="app-footer-link">Journal des opérations</span>
          </div>
        </div>
      </div>

      <div className="app-footer-bottom">
        <div className="app-footer-copy">© {year} COOPECI-DC · Tous droits réservés</div>
        <div className="app-footer-badges">
          <span className="app-footer-badge"><ShieldCheck size={13} /> Conforme BCC</span>
          <span className="app-footer-badge"><Lock size={13} /> Connexion chiffrée</span>
          <span className="app-footer-badge"><FileCheck2 size={13} /> Actions tracées</span>
        </div>
      </div>
    </footer>
  );
}
