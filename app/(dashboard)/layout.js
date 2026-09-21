'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import Footer from '@/components/Footer';
import Loading from '@/components/Loading';

const TITLES = [
  [/^\/dashboard/, 'Tableau de bord'],
  [/^\/members\/[^/]+/, 'Fiche membre'],
  [/^\/members/, 'Membres'],
  [/^\/credits\/[^/]+/, 'Dossier de crédit'],
  [/^\/credits/, 'Crédits'],
  [/^\/committee/, 'Comité de crédit'],
  [/^\/cashier/, 'Caisse'],
  [/^\/accounting/, 'Comptabilité'],
  [/^\/share-capital/, 'Parts sociales'],
  [/^\/credit-products/, 'Produits de crédit'],
  [/^\/bank/, 'Banque'],
  [/^\/consolidation/, 'Consolidation'],
  [/^\/audit-logs/, "Pistes d'audit"],
  [/^\/settings/, 'Paramétrages'],
  [/^\/users/, 'Utilisateurs'],
  [/^\/reports/, 'Rapports'],
];
function titleFor(path) {
  for (const [re, t] of TITLES) if (re.test(path)) return t;
  return 'COOPEC-DC';
}

export default function DashboardLayout({ children }) {
  const { loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login');
  }, [loading, isAuthenticated, router]);

  if (loading) return <Loading label="Ouverture de la session…" />;
  if (!isAuthenticated) return <Loading label="Redirection…" />;

  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <Topbar title={titleFor(pathname)} />
        <div className="content" style={{ flex: 1 }}>{children}</div>
        <Footer />
      </div>
    </div>
  );
}
