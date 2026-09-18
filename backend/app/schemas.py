from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import date, datetime

class PropertyCreate(BaseModel):
    name: str
    address: str
    unit_number: Optional[str] = ""
    monthly_rent: float = 0

class PropertyResponse(BaseModel):
    id: int
    name: str
    address: str
    unit_number: Optional[str]
    monthly_rent: float
    user_id: Optional[int] = None

    class Config:
        from_attributes = True


class TenantCreate(BaseModel):
    name: str
    phone: Optional[str] = ""
    rent_amount: float = 0
    rent_due_day: int = 5
    move_in_date: Optional[date] = None
    property_id: int

class TenantResponse(BaseModel):
    id: int
    name: str
    phone: Optional[str]
    rent_amount: float
    rent_due_day: int
    move_in_date: Optional[date]
    property_id: int

    class Config:
        from_attributes = True

class PaymentCreate(BaseModel):
    tenant_id: int
    payment_type: str = "Rent"
    amount: float
    due_date: date
    billing_month: Optional[date] = None
    payment_date: Optional[date] = None
    payment_method: Optional[str] = None
    reference: Optional[str] = None

class PaymentResponse(BaseModel):
    id: int
    tenant_id: int
    payment_type: str
    amount: float
    due_date: date
    billing_month: Optional[date] = None
    payment_date: Optional[date]
    status: str
    payment_method: Optional[str]
    reference: Optional[str]

    class Config:
        from_attributes = True

class MonthlyRentGenerateRequest(BaseModel):
    year: int
    month: int

class UtilityBillCreate(BaseModel):
    tenant_id: int
    utility_type: str
    connection_number: Optional[str] = None
    amount: float
    due_date: date
    payment_date: Optional[date] = None
    notes: Optional[str] = None

class UtilityBillResponse(BaseModel):
    id: int
    tenant_id: int
    utility_type: str
    connection_number: Optional[str]
    amount: float
    due_date: date
    payment_date: Optional[date]
    status: str
    notes: Optional[str]

    class Config:
        from_attributes = True

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name is required and cannot be empty.")
        return v

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Password is required and cannot be empty.")
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        return v

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Password is required and cannot be empty.")
        return v

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


