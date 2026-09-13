from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from . import models
from .routers import payments, properties
from .routers import tenants, utilities

from sqlalchemy import text

# Safe database migration check for existing SQLite database
with engine.connect() as conn:
    try:
        result = conn.execute(text("PRAGMA table_info(payments);"))
        columns = [row[1] for row in result.fetchall()]
        if columns and "billing_month" not in columns:
            conn.execute(text("ALTER TABLE payments ADD COLUMN billing_month DATE;"))
            conn.commit()
    except Exception as e:
        print("Database migration check warning:", e)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RentFlow API",
    description="Smart Rental & Utility Management System",
    version="1.0.0"
)

# Allow the React frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Property routes
app.include_router(properties.router)
app.include_router(tenants.router)
app.include_router(payments.router)
app.include_router(utilities.router)

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
