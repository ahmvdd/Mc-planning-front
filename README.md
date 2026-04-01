# 🚀 Shiftly — Gestion de Planning d'Équipe

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/Backend-NestJS%2011-E0234E?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma%206-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)

**Shiftly** est une application SaaS moderne conçue pour automatiser la gestion des plannings et des ressources humaines. Elle permet aux entreprises de piloter leurs équipes avec une précision chirurgicale.

> 👤 **Développeur :** [Sayeh Ahmed](https://www.sayehahmed.com)  
> 🌐 **Live :** [shiftly.site](https://shiftly.site)  
> ⚙️ **API :** [mcplanning-back.onrender.com](https://mcplanning-back.onrender.com)

---

## 🏗️ Architecture du Système

Shiftly repose sur une architecture découplée haute performance.

```mermaid
graph TD
    subgraph "Interface Utilisateur (Vercel)"
    A[Next.js 15 App Router] --> B[Tailwind CSS v4]
    A --> C[Framer Motion]
    end

    subgraph "Cœur du Système (Render)"
    D[NestJS 11 API] --> E[Prisma ORM]
    D --> F[JWT Auth Service]
    D --> G[Resend Email SDK]
    end

    subgraph "Stockage (Neon Cloud)"
    E --> H[(PostgreSQL)]
    end

    A -- "Requêtes REST + Bearer Token" --> D
