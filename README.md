# Shiftly — Frontend

Application web de gestion de planning d'équipe, côté client. Next.js (App Router) + Tailwind CSS.

Backend : [Mc-planning-back](https://github.com/ahmvdd/Mc-planning-back)
Production : [shiftly.site](https://shiftly.site)

---
<img width="1463" height="948" alt="image" src="https://github.com/user-attachments/assets/9213dd49-974f-4f32-a8e4-6756854245f4" />


## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| Langage | TypeScript |
| Styles | Tailwind CSS v4 |
| Animations | Framer Motion |
| Scroll landing | Lenis |
| Icônes | lucide-react |
| Scan QR | html5-qrcode |
| Import Excel | xlsx |
| Déploiement | Vercel |

---

## Démarrage local

### Prérequis
- Node.js 20+
- Le backend qui tourne en local (`localhost:3001`) ou en `DEV_BYPASS` (voir plus bas)

### Installation

```bash
npm install
npm run dev
```

Disponible sur [http://localhost:3000](http://localhost:3000)

### Variables d'environnement

Créer un fichier `.env.local` :

```env
NEXT_PUBLIC_API_BASE=http://localhost:3001/api
NEXT_PUBLIC_DEV_BYPASS=true   # données fictives, sans backend
```

En production (Vercel) :

```env
NEXT_PUBLIC_API_BASE=https://mcplanning-back.onrender.com/api
```

---

## Scripts

```bash
npm run dev      # serveur de dev — localhost:3000
npm run build    # build de production
npm run start    # sert le build de production
npm run lint     # ESLint
```

---

## Structure

```
src/
├── app/
│   ├── (auth)/                            # login, signup admin, invitation employé
│   ├── (app)/                             # zone connectée
│   │   ├── dashboard/
│   │   ├── planning/                      # créneaux, import CSV/Excel
│   │   ├── pointage/                      # pointage manuel
│   │   ├── scan/                          # pointage par QR code
│   │   ├── employees/                     # CRUD employés
│   │   ├── requests/                      # demandes RH (congés, documents)
│   │   ├── admin/                         # paramètres organisation
│   │   └── profile/
│   ├── cgu/ confidentialite/ rgpd/ support/   # pages légales
│   └── page.tsx                           # landing page
├── components/
│   ├── navbar.tsx
│   ├── org-title.tsx
│   ├── smooth-scroll.tsx                  # Lenis, landing uniquement
│   ├── auth-quote.tsx
│   └── split-text.tsx
└── lib/
    ├── clientApi.ts                       # fetch client + refresh token auto
    └── api.ts                             # fetch serveur (sans refresh)
```

---

## Fonctionnalités

- **Multi-tenant** — chaque organisation a ses données isolées
- **Auth JWT** — access token 15 min + refresh token 7 j, renouvellement silencieux (`clientApi.ts`)
- **Planning hebdomadaire** — créneaux CRUD, import CSV/Excel
- **Pointage** — manuel ou par scan QR code
- **Demandes RH** — congés, documents, validation admin
- **Gestion employés** — CRUD complet avec rôles, invitation par email

---

## Déploiement

Vercel, branche `main`. Le push sur `develop` ne déploie rien automatiquement.
