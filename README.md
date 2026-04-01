# 🚀 Mon Projet Next.js

Une application web moderne, performante et scalable construite avec le **App Router** de Next.js.

---

## 📋 Présentation
Ce projet est une application web optimisée utilisant les dernières fonctionnalités de React et Next.js. L'objectif est d'offrir une expérience utilisateur fluide tout en garantissant une maintenance aisée grâce à TypeScript.

### 🛠️ Stack Technique
| Technologie | Usage |
| :--- | :--- |
| **Next.js 15** | Framework React (App Router) |
| **TypeScript** | Typage statique sécurisé |
| **Tailwind CSS** | Design responsive et moderne |
| **Geist Font** | Optimisation de la typographie |
| **Vercel** | Hébergement et CI/CD |

---

## 📐 Architecture du Projet

Le schéma ci-dessous illustre l'organisation des dossiers et le flux de données :

```mermaid
graph TD
    A[Root: /app] --> B[Layouts & Pages]
    A --> C[API Routes]
    D[Components] --> B
    E[Public Assets] --> B
    F[Styles/Tailwind] --> A
    
    subgraph Structure
    B
    C
    D
    end
