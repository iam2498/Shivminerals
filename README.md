# Shiv Minerals - Weighbridge & Billing System

Enterprise weighbridge billing and dispatch management system for sand suppliers. Tracks truck loads per party, payments received, employees (salary earned/paid/advance), and expenses with official printable computerized slips and PDF reports. Data is persisted to MongoDB and synced in real-time to Google Sheets via Google Apps Script.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.11+ / FastAPI, Uvicorn, Motor (Async MongoDB), Pydantic v2, httpx, python-dotenv.
- **Frontend**: React 18, Vite, React Router (`HashRouter`), Vanilla CSS (Light & Dark themes, A4 landscape print layout).
- **Database**: MongoDB (Atlas or local).
- **Google Sheets Sync**: Google Apps Script webhook (`apps-script.gs`).

---

## 📁 Clean Project Structure

```text
weighbridge/
├── backend/                  # Python 3.11+ FastAPI Service
│   ├── app/
│   │   ├── routers/          # Modular API endpoints (parties, loads, payments, employees, expenses, reports)
│   │   ├── db.py             # Async MongoDB (Motor) connection client
│   │   ├── models.py         # Pydantic v2 schemas
│   │   ├── sheets.py         # Asynchronous Google Sheet webhook sync
│   │   ├── utils.py          # Half-up rounding, IST date parsing & serialization
│   │   └── main.py           # FastAPI entrypoint, CORS & static frontend serving
│   ├── tests/                # Pytest unit & integration test suite (mongomock-motor)
│   ├── requirements.txt      # Python dependencies
│   ├── .env.example          # Backend environment template
│   └── .env                  # Backend environment variables
│
├── frontend/                 # React 18 + Vite SPA
│   ├── src/
│   │   ├── components/       # Reusable UI (Header, BottomNav, Toast, PrintHead, WeighbridgeSlipModal)
│   │   ├── pages/            # View pages (Home, TruckLoad, PaymentIn, Parties, ReportsHub, etc.)
│   │   ├── api.js            # Centralized API fetch helper
│   │   ├── i18n.jsx          # English & Gujarati dictionary context provider
│   │   ├── styles.css        # Unified stylesheet (theme tokens, tiles, tables, print rules)
│   │   ├── utils.js          # Currency/date formatting & WhatsApp slip generator
│   │   ├── App.jsx           # HashRouter and navigation configuration
│   │   └── main.jsx          # React DOM root entry
│   ├── index.html            # Single page entry with branded SVG favicon
│   ├── vite.config.js        # Vite dev proxy configuration (/api -> :8000)
│   └── package.json          # React dependencies and build scripts
│
├── apps-script.gs            # Google Apps Script for Google Sheet live synchronization
├── package.json              # Root project convenience scripts (dev:backend, dev:frontend, etc.)
├── .gitignore                # Comprehensive git ignore rules
└── README.md                 # Project documentation
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- MongoDB running locally (`mongodb://localhost:27017/weighbridge`) or MongoDB Atlas URI.

---

### 2. Backend Setup & Run

1. Open terminal in the project directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Linux/macOS:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables in `backend/.env` (copy from `backend/.env.example`):
   ```env
   MONGODB_URI=mongodb://localhost:27017/weighbridge
   SHEET_WEBHOOK_URL=https://script.google.com/macros/s/.../exec
   TZ=Asia/Kolkata
   PORT=8000
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   ```
5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   Interactive API docs are available at: `http://localhost:8000/docs`.

---

### 3. Frontend Setup & Run

1. Open a new terminal in the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser.
   - The Vite dev server proxies `/api` requests to `http://localhost:8000`.

---

## 🧪 Automated & Manual Testing

### Running Automated Pytest Suite
Run the backend tests:
```bash
cd backend
pytest
```
All 7 unit and integration tests run in-memory using `mongomock-motor` covering:
- Net weight and half-up decimal rounding calculations
- Party total, paid (including spot cash), and pending balances
- Statement pre-period opening and running balance
- Staff salary earned, paid, and advance ledger
- Daywise rozmel cash, debit, and net cash
- Deletion and Google Sheet sync resilience

### Short Manual Test Script
1. **Home / Dashboard (`#/`)**: Open dashboard, verify KPI stats, theme switch (🌙/☀️), and language toggle (English/ગુજરાતી).
2. **Truck Load (`#/load`)**: Fill vehicle number (e.g. `GJ02AB1234`), select a party, enter empty wt `10000` and loaded wt `35000` (live calculation shows `25.00 Ton`), enter rate `500` (live calculation shows `₹12,500.00`). Click Save. Verify toast, recent loads table, and computerized Weighbridge Slip modal with WhatsApp share.
3. **Payment In (`#/pay`)**: Select party, verify pending balance shows, enter payment amount `5000`, mode `Bank`, click Save.
4. **Parties (`#/parties`)**: Verify party table shows updated total, paid, and pending balance. Click on the party name to open Party Ledger.
5. **Party Ledger (`#/stmt/:id`)**: Verify pre-period opening balance, transaction rows, and running balance. Click "Print / Save PDF" to verify clean A4 print layout.
6. **Expenses (`#/exp`)**: Select a staff member, enter notes and amount, click Save. Check Expenses Report below: select staff filter or all staff, click View Report, and verify total expenses summary card and printable table.

---

## ☁️ Deployment Guide

### Option A: Unified Deployment (FastAPI serves built React frontend)
FastAPI in `backend/app/main.py` is configured to automatically serve `frontend/dist` when present:
1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```
2. Deploy `backend` to **Render** or **Railway**:
   - Build Command: `pip install -r backend/requirements.txt`
   - Start Command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Set Environment variables:
     - `MONGODB_URI`: Your MongoDB Atlas connection string.
     - `SHEET_WEBHOOK_URL`: Your Google Apps Script deployment URL.
     - `TZ`: `Asia/Kolkata`

### Option B: Split Deployment (Backend on Render/Railway + Frontend on Netlify)
1. **Backend on Render / Railway**:
   - Start command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Environment variable:
     - `CORS_ORIGINS`: `https://your-app.netlify.app`
2. **Frontend on Netlify**:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
   - Environment variable:
     - `VITE_API_BASE`: `https://your-backend.onrender.com`
