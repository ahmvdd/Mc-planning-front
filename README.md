# Shiftly — Frontend

Next.js 16 · Tailwind CSS · TypeScript

## Lancer en local

```bash
npm install
npm run dev
```

Disponible sur [http://localhost:3000](http://localhost:3000)

## Variables d'environnement

Créer un fichier `.env.local` :

```env
NEXT_PUBLIC_API_BASE=http://localhost:3001/api
NEXT_PUBLIC_DEV_BYPASS=true   # données fictives sans backend
```

## Stack

- **Next.js 16** — App Router
- **Tailwind CSS** — styles
- **Framer Motion** — animations
- **Lucide** — icônes

## Structure

```
src/app/
  (auth)/       # login, signup, invitation
  (app)/        # dashboard, planning, requests, employees, admin
  page.tsx      # landing page
```

## Déploiement

Vercel — branche `main`
