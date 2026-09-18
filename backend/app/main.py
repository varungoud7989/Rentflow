import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from . import models
from .routers import payments, properties, tenants, utilities, auth

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RentFlow API",
    description="Smart Rental & Utility Management System",
    version="1.0.0"
)

# Parse ALLOWED_ORIGINS from environment as a comma-separated list.
# Default strictly to local Vite dev server origins (no wildcard '*')
raw_origins = os.getenv("ALLOWED_ORIGINS", "")
if raw_origins:
    origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
else:
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Application Routes
app.include_router(properties.router)
app.include_router(tenants.router)
app.include_router(payments.router)
app.include_router(utilities.router)
app.include_router(auth.router)

@app.get("/")
def root():
    return {
        "message": "Welcome to RentFlow API"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }
