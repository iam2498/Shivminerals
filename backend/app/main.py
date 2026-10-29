import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

load_dotenv()

from .routers import parties, loads, payments, employees, expenses, reports, common

app = FastAPI(title="Shiv Minerals Weighbridge API", version="2.0.0")

# CORS Setup
origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,*")
origins = [origin.strip() for origin in origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global 400 error handler to ensure {"error": message} format matching original Node API
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=400,
        content={"error": str(exc)}
    )

# Include Routers
app.include_router(parties.router)
app.include_router(loads.router)
app.include_router(payments.router)
app.include_router(employees.router)
app.include_router(expenses.router)
app.include_router(expenses.category_router)
app.include_router(reports.router)
app.include_router(common.router)

# Production Static Serving: If frontend/dist exists, serve it
dist_dir = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if dist_dir.exists() and dist_dir.is_dir():
    app.mount("/", StaticFiles(directory=str(dist_dir), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
