# Shiftly — Frontend

Interface web de l'application de gestion de planning d'équipe **Shiftly**.  
Fait par [Sayeh Ahmed](https://www.sayehahmed.com)

---

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| Langage | TypeScript |
| Styles | Tailwind CSS v4 — palette zinc dark |
| Animations | Framer Motion + Lenis (scroll fluide) |
| Icons | lucide-react |
| QR scan | html5-qrcode |
| Excel | xlsx |
| Déploiement | Vercel → [shiftly.site](https://shiftly.site) |

---

## Démarrage local

**Prérequis :** Node.js 20+, backend Shiftly en cours d'exécution sur le port 3001.

```bash
npm install
npm run dev        # http://localhost:3000
```

Le fichier `.env.local` est déjà configuré :

```env
NEXT_PUBLIC_API_BASE=http://localhost:3001/api
```

> Sur Vercel : `NEXT_PUBLIC_API_BASE=https://mcplanning-back.onrender.com/api`

---

## Structure des pages

```
src/app/
├── page.tsx                  # Landing page (publique)
├── (auth)/
│   ├── login/                # Connexion
│   ├── signup/
│   │   ├── admin/            # Création compte admin + organisation
│   │   └── employee/         # Inscription employé (via invitation)
│   └── invitation/[token]/   # Acceptation invitation
└── (app)/                    # Pages protégées (JWT requis)
    ├── layout.tsx             # Navbar + footer dark
    ├── dashboard/             # Vue d'ensemble + planning du jour
    ├── planning/              # Gestion créneaux, import Excel, planning visuel
    ├── employees/             # Liste employés (admin), profil (employé)
    ├── requests/              # Demandes RH (congés, documents)
    ├── pointage/              # Suivi présences du jour (admin)
    ├── scan/                  # Scanner QR code pour pointer
    ├── profile/               # Profil + changement mot de passe
    └── admin/                 # Paramètres organisation (admin)
```

---

## Composants partagés

```
src/components/
├── navbar.tsx          # Barre de navigation responsive
├── org-title.tsx       # Nom de l'organisation en header
├── auth-quote.tsx      # Citation decorative (pages auth)
├── smooth-scroll.tsx   # Provider Lenis
└── split-text.tsx      # Animation texte lettre par lettre
```

---

## Client API

`src/lib/clientApi.ts` — fetch avec refresh token automatique :
- Si une réponse `401` est reçue, appelle `POST /auth/refresh` silencieusement
- En cas d'échec du refresh, redirige vers `/login`
- Clés localStorage : `shiftly_token`, `shiftly_refresh_token`

---

## Authentification

| Étape | Détail |
|-------|--------|
| Admin signup | Crée un `Employee` (role=admin) + une `Organization` |
| Login | Retourne `accessToken` (15 min) + `refreshToken` (7 j) |
| Refresh | Automatique via `clientApi.ts` sur 401 |
| Logout | Supprime les tokens + redirect `/` |

---

## Rôles et accès

| Page | Admin | Employé |
|------|:-----:|:-------:|
| `/dashboard` | ✅ | ✅ |
| `/planning` | ✅ | ✅ lecture |
| `/requests` | ✅ valider | ✅ créer |
| `/employees` | ✅ | ❌ |
| `/pointage` | ✅ | ❌ |
| `/admin` | ✅ | ❌ |
| `/scan` | ✅ | ✅ |
| `/profile` | ✅ | ✅ |

---

## Scripts

```bash
npm run dev      # Serveur de développement (Turbopack)
npm run build    # Build de production
npm run start    # Serveur de production
npm run lint     # ESLint
```

---

## Repo GitHub

[github.com/ahmvdd/Mc-planning-front](https://github.com/ahmvdd/Mc-planning-front)

Branches : `develop` (intégration) → `main` (production)
