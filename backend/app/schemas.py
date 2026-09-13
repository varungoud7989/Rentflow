from pydantic import BaseModel
from typing import Optional
from datetime import date

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
