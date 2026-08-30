# Keepqueue Server

**Backend server for the Keepqueue platform.**

---

## 🌐 Website

**[https://keepqueue.com/](https://keepqueue.com/)**

---

## Overview

Keepqueue is a SaaS web platform that enables small-business owners to manage customer appointments end-to-end—from booking to reminders. This server provides the API layer for the platform.

### Tech Stack

- **Runtime:** Node.js  
- **Framework:** Express.js  
- **Language:** TypeScript  
- **Database/Auth:** Firebase (Firestore, Auth, Storage)  
- **Validation:** Zod  

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

| Command   | Description                    |
| --------- | ------------------------------ |
| `npm start`   | Run dev server with nodemon    |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run startjs` | Build and run production   |
| `npm run deploy`  | Deploy via PowerShell script |

### Run Locally

```bash
npm start
```

The server starts on the configured port (default: 3000).

---

## API Routes

- `/` — Health check (returns "OK from root")
- `/actions` — Business actions, appointments
- `/data` — Data endpoints

---

## Environment

Configure environment variables via `.env` (Firebase credentials, port, etc.).

---

## License

ISC
