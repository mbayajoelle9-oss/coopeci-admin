'use client';
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://coopeci-dc-backend.onrender.com/api';

export const api = axios.create({ baseURL: BASE_URL, timeout: 20000, headers: { 'Content-Type': 'application/json' } });

const store = {
  get access() { return typeof window !== 'undefined' ? localStorage.getItem('coopeci_admin_access') : null; },
  get refresh() { return typeof window !== 'undefined' ? localStorage.getItem('coopeci_admin_refresh') : null; },
  setAccess(t) { if (typeof window !== 'undefined') localStorage.setItem('coopeci_admin_access', t || ''); },
};

let onExpired = () => {};
export function setOnExpired(fn) { onExpired = fn; }

api.interceptors.request.use((config) => {
  const t = store.access;
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const isAuthCall = original?.url?.includes('/auth/');
    if (status === 401 && !original._retried && !isAuthCall) {
      original._retried = true;
      try {
        if (!refreshing) {
          const rt = store.refresh;
          if (!rt) throw new Error('no refresh');
          refreshing = axios.post(`${BASE_URL}/auth/refresh-token`, { refreshToken: rt })
            .then((r) => r.data.accessToken).finally(() => { refreshing = null; });
        }
        const newAccess = await refreshing;
        store.setAccess(newAccess);
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch (e) {
        onExpired();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);

export function errorMessage(err, fallback = 'Une erreur est survenue.') {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.response?.data?.details?.length) return err.response.data.details[0].message;
  if (err?.message === 'Network Error') return "Connexion au serveur impossible (vérifiez l'API et le CORS).";
  return fallback;
}

/* API groupée */
export const AuthAPI = {
  login: (email, password) => api.post('/auth/admin/login', { email, password }),
  logout: () => api.post('/auth/logout'),
};
export const ReportAPI = {
  dashboard: () => api.get('/reports/dashboard'),
  par: () => api.get('/reports/par'),
  transactions: (params) => api.get('/reports/transactions', { params }),
  agents: () => api.get('/reports/agents'),
};
export const AccountingAPI = {
  pending: () => api.get('/accounting/pending-transfer'),
  agentCashPending: () => api.get('/accounting/agent-cash-pending'),
  transfers: () => api.get('/accounting/transfers'),
  recordTransfer: (payload) => api.post('/accounting/transfer', payload),
  chartOfAccounts: () => api.get('/accounting/chart-of-accounts'),
  journal: (params) => api.get('/accounting/journal', { params }),
  ledger: (code) => api.get(`/accounting/ledger/${code}`),
  trialBalance: () => api.get('/accounting/trial-balance'),
  balanceSheet: () => api.get('/accounting/balance-sheet'),
  incomeStatement: () => api.get('/accounting/income-statement'),
};
export const MembersAPI = {
  list: (q = '', status = '', page = 1) => api.get('/members', { params: { q, status, page, limit: 20 } }),
  stats: () => api.get('/members/stats'),
  detail: (id) => api.get(`/members/${id}`),
  register: (payload) => api.post('/members/register', payload),
  update: (id, payload) => api.put(`/members/${id}`, payload),
  deactivate: (id) => api.post(`/members/${id}/deactivate`),
  resetPin: (id) => api.post(`/members/${id}/reset-pin`),
  history: (id) => api.get(`/transactions/member/${id}`),
};
export const NotificationAPI = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};
export const CreditAPI = {
  applications: (status = '', page = 1) => api.get('/credits/applications', { params: { status, page, limit: 20 } }),
  applicationDetail: (id) => api.get(`/credits/applications/${id}`),
  updateStatus: (id, payload) => api.put(`/credits/applications/${id}/status`, payload),
  disburse: (id, payload) => api.post(`/credits/applications/${id}/disburse`, payload),
  detail: (id) => api.get(`/credits/${id}`),
};
export const CommitteeAPI = {
  pending: () => api.get('/committee/pending'),
  vote: (id, decision, comment) => api.post(`/committee/applications/${id}/vote`, { decision, comment }),
  votes: (id) => api.get(`/committee/applications/${id}/votes`),
};
export const TxAPI = {
  pending: (type) => api.get('/transactions/pending', { params: { type, limit: 50 } }),
  confirmDeposit: (reference) => api.post('/transactions/deposit/confirm', { reference }),
  validateWithdrawal: (id, approve) => api.put(`/transactions/withdrawal/validate/${id}`, { approve }),
  receipt: (reference) => api.get(`/transactions/${reference}/receipt`, { responseType: 'blob' }),
};
export const UsersAPI = {
  list: () => api.get('/admin/users'),
  create: (payload) => api.post('/admin/users', payload),
  update: (id, payload) => api.put(`/admin/users/${id}`, payload),
  remove: (id) => api.delete(`/admin/users/${id}`),
};
