# Institutional Stock Analysis Platform (NSE)

An institutional-grade fundamental research platform for Indian NSE stocks, built with an agentic multi-LLM architecture.

## 🚀 Quick Start

### 1. Prerequisites
- **Python 3.9+**
- **Node.js 18+**
- **Redis Server** (required for caching)

### 2. Environment Setup
Create a `.env` file in the `backend/` directory:
```env
OPENAI_API_KEY=your_key
GROQ_API_KEY=your_key
GOOGLE_API_KEY=your_key
REDIS_URL=redis://localhost:6379/0
```

### 3. Running the Platform

#### Backend (Flask)
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
*API will run on `http://localhost:5000`*

#### Frontend (Next.js)
```powershell
cd frontend
npm install
npm run dev
```
*UI will run on `http://localhost:3000`*

## 🛠 Features
- **Parallel Intelligence**: Concurrent orchestration of GPT-4, Llama 3 (Groq), and Gemini Pro.
- **Deep Fundamental Engines**: F-Score, Z-Score, and Sector Benchmarking.
- **NSE Integration**: Native data fetching from NSE via `nsepython`.
- **Institutional Styling**: High-performance dashboard with glassmorphism and real-time charts.

## ⚖ Compliance
This platform is designed as an **educational tool**. It includes automated keyword filtering to ensure no specific investment advice (Buy/Sell/Hold) is generated, aligning with institutional and regulatory standards.

## 📂 Architecture
Refer to the [Technical Architecture](file:///c:/Users/arunj/AntiGravity/Asset%20Analysis/docs/architecture.md) for a deep dive into the Parallel Perspective Engine.
