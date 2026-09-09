'use client';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, FileBarChart, Users, Landmark, Scale, Wallet, Settings } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { can } from '@/lib/format';

const NAV = [
  { group: 'Pilotage', items: [
    { href: '/dashboard', label: 'Tableau de bord', ico: LayoutGrid },
    { href: '/reports', label: 'Rapports', ico: FileBarChart, gate: (r) => can.par(r) },
  ]},
  { group: 'Opérations', items: [
    { href: '/members', label: 'Membres', ico: Users },
    { href: '/credits', label: 'Crédits', ico: Landmark },
    { href: '/committee', label: 'Comité', ico: Scale, gate: (r) => can.committee(r) },
    { href: '/cashier', label: 'Caisse', ico: Wallet, gate: (r) => can.cashier(r) },
  ]},
  { group: 'Administration', items: [
    { href: '/users', label: 'Utilisateurs', ico: Settings, gate: (r) => can.users(r) },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.role;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src="/logo-icon.png" alt="COOPEC-DC" className="sidebar-logo-img" />
        <div>
          <div className="sidebar-brand-name">COOPEC-DC</div>
          <div className="sidebar-brand-sub">Back-office</div>
        </div>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto' }}>
        {NAV.map((section) => {
          const items = section.items.filter((it) => !it.gate || it.gate(role));
          if (!items.length) return null;
          return (
            <div key={section.group}>
              <div className="nav-group-label">{section.group}</div>
              {items.map((it) => {
                const active = pathname === it.href || pathname.startsWith(it.href + '/');
                const Icon = it.ico;
                return (
                  <div key={it.href} className={`nav-item ${active ? 'active' : ''}`} onClick={() => router.push(it.href)}>
                    <span className="nav-ico"><Icon size={18} strokeWidth={2.2} /></span>
                    <span>{it.label}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-foot">Coopérative d'Épargne, de Crédit<br />et d'Investissement Debout Congolais</div>
    </aside>
  );
}
