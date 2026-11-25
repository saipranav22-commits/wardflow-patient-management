# WardFlow Production Deployment Reference

This document records the verified production deployment architecture and live endpoints for WardFlow on **Render** and **Neon PostgreSQL**.

---

## 1. Verified Live Production Services

| Service | Type | Live URL | Deployed Service Name |
|---|---|---|---|
| **Frontend Web App** | Render Static Site | [https://wardflow-patient-management.onrender.com](https://wardflow-patient-management.onrender.com) | `wardflow-patient-management` |
| **Backend REST API** | Render Web Service (Python FastAPI) | [https://wardflow-app.onrender.com](https://wardflow-app.onrender.com) | `wardflow-app` |
| **API Documentation (Swagger)** | Interactive OpenAPI Docs | [https://wardflow-app.onrender.com/docs](https://wardflow-app.onrender.com/docs) | — |
| **Database Engine** | Neon Serverless PostgreSQL | Parameterized `DATABASE_URL` via Render | `wardflow-db` |

---

## 2. Production Service Configuration

### Backend: `wardflow-app`
- **Root Directory**: `backend`
- **Runtime**: `Python 3.12 / 3.13`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Health Check**: `/api/health`
- **Environment Variables**:
  - `APP_ENV`: `production`
  - `DATABASE_URL`: `postgresql://[user]:[password]@[endpoint].neon.tech/wardflow?sslmode=require`
  - `ALLOWED_ORIGINS`: `https://wardflow-patient-management.onrender.com,http://localhost:5173`

### Frontend: `wardflow-patient-management`
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Routing**: SPA Rewrite Rule `/*` -> `/index.html`
- **Environment Variables**:
  - `VITE_API_BASE_URL`: `https://wardflow-app.onrender.com`

---

## 3. Operational Verification

1. **Database Connectivity**: `GET /api/health` returns `{"status":"healthy","database":"connected","environment":"production"}`.
2. **CORS Headers**: Explicitly allows `https://wardflow-patient-management.onrender.com` with `access-control-allow-credentials: true`.
3. **Fail-Fast Protection**: Production mode prohibits accidental SQLite fallback; an invalid or missing `DATABASE_URL` raises an explicit runtime error on cold start rather than creating an ephemeral local file.
4. **Data Persistence**: Records are committed to hosted Neon PostgreSQL and remain persistent across backend deployments, cold starts, and container restarts.
