# 🚀 Shiftly — Management de Planning d'Équipe

**Shiftly** est une solution SaaS moderne de gestion de planning et de ressources humaines. Conçue pour simplifier la coordination des équipes, l'application permet aux administrateurs de gérer des organisations, d'inviter des collaborateurs et de piloter les plannings en temps réel.

> 🛠️ **Statut du projet :** En cours de développement actif.  
> 👤 **Auteur :** [Sayeh Ahmed](https://www.sayehahmed.com)  
> 🌐 **Live Demo :** [shiftly.site](https://shiftly.site)

---

## 🛠️ Stack Technique

Shiftly repose sur une architecture découplée (Monorepo-style) pour une performance maximale.

| Couche | Technologie |
| :--- | :--- |
| **Frontend** | Next.js 15 (App Router), Tailwind CSS v4, Framer Motion |
| **Backend** | NestJS 11 (Node.js framework) |
| **Base de données** | PostgreSQL via [Neon.tech](https://neon.tech) |
| **ORM** | Prisma 6 |
| **Authentification** | JWT (Access & Refresh Tokens) |
| **Communications** | Resend SDK (Emails transactionnels) |

---

## 📐 Architecture du Système

### Structure des Dossiers
```text
mcplanning-manager/
├── frontend/              # Next.js (Déployé sur Vercel)
│   └── src/app/(app)      # Dashboard, Planning, Admin (Protected)
└── backend/               # NestJS (Déployé sur Render)
    └── src/auth           # Logique Refresh Token & Sécurité
