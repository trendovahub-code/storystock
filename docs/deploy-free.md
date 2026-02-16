# Free Deployment Guide (Render + Vercel)

This project is a split app:
- Backend: Flask API in `backend/`
- Frontend: Next.js app in `frontend/`

The lowest-friction free setup is:
- Backend on Render (free web service)
- Frontend on Vercel (Hobby plan)

## 1. Push your latest code

From repo root:

```bash
git add .
git commit -m "Prepare app for cloud deployment"
git push origin main
```

Notes:
- The frontend now uses `NEXT_PUBLIC_API_BASE_URL` everywhere.
- If you do not push this change, deployed frontend pages can still fail.

## 2. Deploy backend on Render (free)

1. Sign in to Render.
2. Click `New` -> `Web Service`.
3. Connect your GitHub repo and select this project.
4. Configure:
   - Name: `asset-analysis-backend` (or any name)
   - Root Directory: `backend`
   - Runtime: `Python`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python app.py`
   - Plan: `Free`
5. Add environment variables:
   - `GROQ_API_KEY` = your key (required if you want AI insights)
   - `CONTACT_WEBHOOK_URL` = your Google Apps Script webhook (required only for contact form submit)
   - `BRAND_NAME` = `Trendova Hub` (optional)
   - `APP_URL` = your frontend URL (optional, can update later)
   - `FEATURE_ALERTS` = `false` (recommended for free tier)
   - `FEATURE_MAINTENANCE` = `false` (recommended for free tier)
   - `FEATURE_PREFETCH` = `false` (recommended for free tier)
   - `FEATURE_USER_RATE_LIMIT` = `true` (recommended)
6. Click `Create Web Service`.
7. Wait for deploy success and copy backend URL, for example:
   - `https://asset-analysis-backend.onrender.com`

Quick backend check:

```bash
curl https://asset-analysis-backend.onrender.com/api/health
```

You should get JSON with `"status":"healthy"`.

## 3. Deploy frontend on Vercel (free Hobby)

1. Sign in to Vercel.
2. Click `Add New...` -> `Project`.
3. Import this GitHub repo.
4. In project settings before deploy:
   - Framework Preset: `Next.js` (auto-detected)
   - Root Directory: `frontend`
5. Add environment variables:
   - `NEXT_PUBLIC_API_BASE_URL` = your Render backend URL  
     Example: `https://asset-analysis-backend.onrender.com`
   - `NEXT_PUBLIC_APP_URL` = your Vercel URL (use temporary URL first, then replace with final/custom domain)
6. Deploy.
7. Open the deployed frontend URL and test:
   - Search a symbol
   - Open `/analysis/<SYMBOL>`
   - Click PDF export
   - Submit contact form (only if `CONTACT_WEBHOOK_URL` is configured)

## 4. Post-deploy verification checklist

1. Backend health:
   - `GET /api/health` returns 200.
2. Frontend search:
   - Search box returns company suggestions.
3. Analysis page:
   - Loads financials and ratios without browser CORS errors.
4. AI insights:
   - Present only when `GROQ_API_KEY` is configured.
5. PDF:
   - Download works from deployed UI.

## 5. Common issues and fixes

1. `Failed to fetch` in browser:
   - Verify `NEXT_PUBLIC_API_BASE_URL` is set in Vercel.
   - Redeploy frontend after changing env vars.
2. Contact form returns error:
   - Set `CONTACT_WEBHOOK_URL` in Render backend.
3. Slow first request:
   - Render free services can spin down when idle; first hit may be slower.
4. AI insights missing:
   - Set `GROQ_API_KEY` and redeploy backend.

## 6. Cost expectations

- Vercel Hobby: free (with usage limits).
- Render free web service: free (with free-tier limits and idle behavior).
- Total platform cost can be zero if you remain within free-tier limits.
