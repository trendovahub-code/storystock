---
name: start-dev
description: Start the development environment for the Asset Analysis project. Checks and starts Redis, Flask backend, and Next.js frontend.
disable-model-invocation: true
---

# Start Development Environment

Start up the full development stack for Trendova Hub.

## Services to Start

### 1. Redis (Port 6379)
```bash
# Check if Redis is running
redis-cli ping

# If not running, start it
redis-server --daemonize yes
```

### 2. Backend - Flask (Port 5002)
```bash
cd backend
source venv/bin/activate  # or: python -m venv venv && source venv/bin/activate
pip install -r requirements.txt  # only if deps changed
PORT=5002 python app.py
```
- Runs with `debug=True` (auto-reload on file changes)
- Requires `.env` file with `GROQ_API_KEY`

### 3. Frontend - Next.js (Port 3000)
```bash
cd frontend
npm install  # only if deps changed
npm run dev
```
- Hot reload enabled by default
- Connects to backend at `http://localhost:5002`

## Health Verification
```bash
# Backend health
curl http://localhost:5002/api/health

# Frontend
curl -s http://localhost:3000 | head -1
```

## Quick Start (all-in-one)
The project has a `start_all.sh` script at the root that handles all three services.

## Steps

1. Check if Redis is running, start if needed
2. Start the Flask backend on port 5002 in the background
3. Start the Next.js frontend on port 3000
4. Verify all services are healthy
