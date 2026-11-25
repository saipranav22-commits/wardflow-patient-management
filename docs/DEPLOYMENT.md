# WardFlow Deployment Guide

This guide details the deployment steps for hosting WardFlow on **Render** (Frontend Static Site + Backend Web Service) and **Neon** (Serverless PostgreSQL).

## 1. Neon PostgreSQL Setup

1. Sign in to [Neon Console](https://console.neon.tech/).
2. Create a new project named `wardflow-db`.
3. Copy the connection string provided (format: `postgresql://[user]:[password]@[endpoint].neon.tech/wardflow?sslmode=require`).
4. Note: Neon requires SSL mode (`sslmode=require`), which is supported out-of-the-box by our SQLAlchemy configuration.

## 2. Render Backend Web Service

1. Create a **New Web Service** connected to your GitHub repository.
2. Configure settings:
   - **Name**: `wardflow-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free
3. Environment Variables:
   - `DATABASE_URL`: `[Your Neon PostgreSQL Connection String]`
   - `APP_ENV`: `production`
   - `ALLOWED_ORIGINS`: `https://wardflow.onrender.com,http://localhost:5173`
4. Health Check Path: `/api/health`

## 3. Render Frontend Static Site

1. Create a **New Static Site** connected to the same repository.
2. Configure settings:
   - **Name**: `wardflow-app`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
3. Environment Variables:
   - `VITE_API_BASE_URL`: `https://wardflow-api.onrender.com`
4. Redirects / Rewrites:
   - Source: `/*`
   - Destination: `/index.html`
   - Action: `Rewrite`

## 4. Verification Checklist

- [ ] Check `GET /api/health` returns `{"status": "healthy", "database": "connected"}`.
- [ ] Verify CORS headers allow requests from frontend domain.
- [ ] Admit a patient in the production UI and verify persistence upon page refresh.
- [ ] Verify test suite against staging environment.
