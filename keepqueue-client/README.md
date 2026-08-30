# Keepqueue Client

**Frontend web application for the Keepqueue platform.**

---

## 🌐 Website

**[https://keepqueue.com/](https://keepqueue.com/)**

---

## Overview

Keepqueue is a SaaS web platform that enables small-business owners to manage customer appointments end-to-end—from booking to reminders. This client provides the user interface for business owners, customers, and the public booking flow.

### Tech Stack

- **Framework:** Next.js 16 (React 19)
- **Styling:** Tailwind CSS, Radix UI, shadcn/ui
- **State:** Zustand
- **Data:** TanStack React Query, Firebase
- **Animations:** Framer Motion, GSAP
- **Drag & Drop:** @dnd-kit

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Installation

```bash
npm install
```

### Scripts

| Command        | Description                    |
| -------------- | ------------------------------ |
| `npm run dev`  | Run development server (Turbopack) |
| `npm run build`| Production build               |
| `npm run lint` | Run ESLint                     |
| `npm test`     | Start production server        |

### Run Locally

```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

---

## Project Structure

- `app/` — Next.js App Router pages (landing, business dashboard, customer dashboard)
- `components/` — Reusable UI (BookingInterface, Calendar, forms)
- `lib/` — Helpers, types, store, API client

---

## License

ISC
