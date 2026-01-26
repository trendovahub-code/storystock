---
description: How to run the Stock Analysis Platform
---

Follow these steps to start the full-stack application.

1. **Start Redis**
Ensure your local Redis server is running on the default port (6379).

2. **Start the Backend**
// turbo
```powershell
cd backend; .\venv\Scripts\activate; python app.py
```

3. **Start the Frontend**
// turbo
```powershell
cd frontend; npm run dev
```

4. **Access the Platform**
Open your browser and navigate to `http://localhost:3000`.
Use the search bar to look up symbols like `TCS`, `RELIANCE`, or `INFY`.
