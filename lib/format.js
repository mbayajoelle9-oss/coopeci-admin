/** L'adresse en base peut être soit une chaîne (ancien format), soit un objet
 * {street, city, province, country} (schéma actuel du backend). On gère les deux
 * pour ne jamais planter à l'affichage, quelle que soit la façon dont le membre a été créé. */
export function formatAddress(a) {
  if (!a) return '';
  if (typeof a === 'string') return a;
  if (typeof a === 'object') return [a.street, a.city, a.province, a.country].filter(Boolean).join(', ');
  return '';
}

export function formatMoney(amount, currency = 'CDF') {
  const n = Number(amount || 0);
  return `${n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
}
export function formatDate(value, withTime = false) {
  if (!value) return '—';
  const d = new Date(value);
  const opts = withTime
    ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' };
  return d.toLocaleDateString('fr-FR', opts);
}
export function initials(name = '') {
  const parts = String(name).trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

export const roleLabel = (r) => ({
  super_admin: 'Super administrateur', director: 'Directeur / Gérante',
  credit_manager: 'Responsable crédit', credit_manager_deputy: 'Responsable crédit adjoint',
  credit_controller: 'Contrôleur de crédit',
  cashier: 'Caissier', accountant: 'Comptable', chief_accountant: 'Chef comptable',
  chief_accountant_deputy: 'Chef comptable adjoint',
  agent: 'Agent',
  board_president: 'Président du Conseil d\'Administration', board_vice_president: 'Vice-Président du CA',
  board_member: 'Membre du Conseil d\'Administration', committee_member: 'Membre du comité (ancien libellé)',
  viewer: 'Observateur',
}[r] || r);

export const ROLE_OPTIONS = [
  { value: 'director', label: 'Directeur / Gérante' },
  { value: 'credit_manager', label: 'Responsable crédit' },
  { value: 'credit_manager_deputy', label: 'Responsable crédit adjoint' },
  { value: 'credit_controller', label: 'Contrôleur de crédit' },
  { value: 'cashier', label: 'Caissier' },
  { value: 'accountant', label: 'Comptable' },
  { value: 'chief_accountant', label: 'Chef comptable' },
  { value: 'chief_accountant_deputy', label: 'Chef comptable adjoint' },
  { value: 'agent', label: 'Agent' },
  { value: 'board_president', label: 'Président du Conseil d\'Administration' },
  { value: 'board_vice_president', label: 'Vice-Président du CA' },
  { value: 'board_member', label: 'Membre du Conseil d\'Administration' },
  { value: 'viewer', label: 'Observateur' },
];

export const trxLabel = (t) => ({
  deposit: 'Dépôt', withdrawal: 'Retrait', interest: 'Intérêts',
  credit_disbursement: 'Décaissement', repayment: 'Remboursement', fee: 'Frais',
}[t] || t);

export const statusLabel = (s) => ({
  pending: 'En attente', completed: 'Effectué', failed: 'Échoué', cancelled: 'Annulé',
  active: 'Actif', inactive: 'Inactif', suspended: 'Suspendu', closed: 'Clôturé', dormant: 'Dormant',
  in_arrears: 'En retard', disbursed: 'Décaissé',
  submitted: 'Soumise', under_review: 'En examen', agent_visit: 'Visite agent',
  pending_committee: 'Au comité', approved: 'Approuvée', rejected: 'Refusée', more_info: 'Complément requis',
  pending_disbursement: 'En attente de décaissement',
}[s] || s);

/** Statut → ton de badge. */
export function statusTone(s) {
  if (['completed', 'active', 'approved', 'disbursed'].includes(s)) return 'success';
  if (['pending', 'submitted', 'under_review', 'agent_visit', 'pending_committee', 'more_info'].includes(s)) return 'warning';
  if (['failed', 'cancelled', 'rejected', 'in_arrears', 'suspended', 'closed'].includes(s)) return 'danger';
  return 'neutral';
}

export const isCredit = (type) => ['deposit', 'interest', 'credit_disbursement'].includes(type);

/* Droits dérivés du rôle (miroir backend) */
export const can = {
  users: (r) => ['super_admin', 'director'].includes(r),
  creditDecision: (r) => ['credit_manager', 'credit_manager_deputy', 'director', 'super_admin'].includes(r),
  committee: (r) => ['committee_member', 'board_president', 'board_vice_president', 'board_member', 'director', 'credit_manager'].includes(r),
  cashier: (r) => ['cashier', 'director', 'super_admin'].includes(r),
  par: (r) => ['director', 'credit_manager', 'chief_accountant', 'super_admin'].includes(r),
  memberEdit: (r) => ['director', 'credit_manager', 'super_admin'].includes(r),
  agentStats: (r) => ['director', 'super_admin'].includes(r),
  accounting: (r) => ['director', 'chief_accountant', 'chief_accountant_deputy', 'accountant', 'cashier', 'super_admin'].includes(r),
  bank: (r) => ['director', 'chief_accountant', 'chief_accountant_deputy', 'accountant', 'cashier', 'super_admin'].includes(r),
  settings: (r) => ['super_admin'].includes(r),
  auditLogs: (r) => ['director', 'chief_accountant', 'super_admin'].includes(r),
  consolidation: (r) => ['director', 'super_admin'].includes(r),
};

/* Transitions de statut proposées dans le back-office */
export const NEXT_STATUSES = {
  submitted: ['under_review', 'rejected'],
  under_review: ['agent_visit', 'pending_committee', 'more_info', 'rejected'],
  agent_visit: ['pending_committee', 'more_info', 'rejected'],
  pending_committee: ['approved', 'rejected', 'more_info'],
  more_info: ['under_review', 'pending_committee', 'rejected'],
  approved: [],
  rejected: [],
};
