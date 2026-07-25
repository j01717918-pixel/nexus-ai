# Nexus AI

Nexus AI is a monorepo application featuring a React frontend (deployed on Vercel) and an Express API backend (deployed on Render).

## Production Deployment Documentation

### 1. Render Environment Variables (Backend API Server)

Set the following environment variables in **Render → Service Settings → Environment Variables**:

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` |
| `CLERK_PUBLISHABLE_KEY` | Production Clerk publishable key | `pk_live_...` |
| `CLERK_SECRET_KEY` | Matching production Clerk secret key | `sk_live_...` |
| `GEMINI_API_KEY` | Google AI Studio Gemini API Key | `AIzaSy...` |
| `NODE_ENV` | Environment mode | `production` |

> **Crucial Note on Clerk Authentication:**
> Render **must** use the production Clerk secret key (`sk_live_...`) matching the production publishable key (`pk_live_...`) used on Vercel. Development keys (`pk_test_...` / `sk_test_...`) enforce localhost origin restrictions and will cause `422 Unprocessable Entity` or authentication errors when deployed to production domains.

---

### 2. Vercel Environment Variables (Frontend Chatbot)

Set the following environment variables in **Vercel → Project Settings → Environment Variables**:

| Variable | Description | Value / Format |
|---|---|---|
| `VITE_API_BASE_URL` | Live API backend URL on Render | `https://nexus-ai-djky.onrender.com` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Production Clerk publishable key | Must be a production `pk_live_...` key |

> **Clerk Key Pairing:** Vercel must use the production publishable key (`pk_live_...`) issued from your Clerk Production instance, paired with the secret key (`sk_live_...`) configured on Render.

---

### 3. Database Initialization & Health Verification

- The backend automatically verifies PostgreSQL connectivity (`SELECT 1`) and creates required database schema/tables on startup before accepting HTTP traffic.
- If `DATABASE_URL` is missing, invalid, or unreachable, server startup fails immediately with sanitized, safe error messages in Render logs.
