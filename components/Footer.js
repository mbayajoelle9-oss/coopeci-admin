import { ShieldCheck, Lock, FileCheck2 } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="app-footer">
      <div className="app-footer-top">
        <div className="app-footer-brand">
          <img src="/logo-icon.png" alt="COOPEC-DC" className="app-footer-logo-img" />
          <div>
            <div className="app-footer-name">COOPEC-DC</div>
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
        <div className="app-footer-copy">© {year} COOPEC-DC · Tous droits réservés</div>
        <div className="app-footer-badges">
          <span className="app-footer-badge"><ShieldCheck size={13} /> Conforme BCC</span>
          <span className="app-footer-badge"><Lock size={13} /> Connexion chiffrée</span>
          <span className="app-footer-badge"><FileCheck2 size={13} /> Actions tracées</span>
        </div>
      </div>
    </footer>
  );
}
