# COOPECI-DC — Back-office (App Admin)

Application web **Next.js** d'administration de la coopérative. Interface
réservée au personnel, avec modules adaptés au rôle du compte connecté.

## Modules
- **Tableau de bord** : membres, épargne collectée, encours, PAR + graphiques (recharts)
- **Membres** : recherche/filtre, enregistrement, fiche (comptes, historique, édition, désactivation)
- **Crédits** : liste des demandes, dossier complet, workflow de statut, décaissement
- **Comité** : dossiers en attente d'avis, vote (favorable/défavorable/complément/abstention)
- **Caisse** : file d'attente, confirmation d'encaissement, validation/refus de retrait
- **Utilisateurs** : création/modification/désactivation des comptes staff et rôles
- **Rapports** : portefeuille à risque, transactions par type (graphique + tableau)

## Accès par rôle
Le menu et les actions s'affichent selon le rôle : **Utilisateurs** (super admin/directeur),
**Comité** (comité/directeur/resp. crédit), **Caisse** (caissier/directeur),
**Rapports/PAR** (directeur/resp. crédit). Les décisions crédit et décaissements
sont réservés au responsable crédit / directeur.

## Prérequis
- Node.js 18.18+ (recommandé : Node 20)

## Installation & lancement
```bash
npm install
npm run dev        # http://localhost:3000
# production :
npm run build && npm start
```

## Configuration de l'API
Créez `.env.local` (voir `.env.example`) :
```
NEXT_PUBLIC_API_URL=https://coopeci-dc-backend.onrender.com/api
```
Par défaut, l'app pointe déjà sur le backend Render.

## ⚠️ CORS
Le navigateur applique le CORS. Le backend doit autoriser l'origine de l'admin.
La variable `CLIENT_URL` du backend accepte désormais une **liste séparée par des
virgules**. Pour le développement local, définissez par exemple :
```
CLIENT_URL=http://localhost:3000
```
(ou `http://localhost:5173,http://localhost:3000` pour autoriser aussi un front Vite).
En production, mettez-y l'URL de déploiement de l'admin.

## Comptes de test (après `npm run seed` côté backend)
- Directeur : `directeur@coopeci-dc.cd` / `Passe2026!` (accès complet)
- Responsable crédit : `credit@coopeci-dc.cd` / `Passe2026!`
- Caissier : `caisse@coopeci-dc.cd` / `Passe2026!`
- Comité : `comite@coopeci-dc.cd` / `Passe2026!`

## Stack
Next.js 14 (App Router) · React 18 · axios (refresh token auto) · recharts ·
design system CSS navy/or (aucune dépendance UI lourde).

## Structure
```
app/
  layout.js            racine + AuthProvider
  login/               connexion staff
  (dashboard)/         zone protégée (sidebar + garde d'auth)
    dashboard/ members/ credits/ committee/ cashier/ users/ reports/
lib/    api.js · auth.js · format.js (rôles, statuts, workflow)
components/  Sidebar, Topbar, Card, StatCard, Badge, Modal, Loading, EmptyState
```
