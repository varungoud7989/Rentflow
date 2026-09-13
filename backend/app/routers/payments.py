import calendar
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Payment, Tenant
from ..schemas import (
    PaymentCreate,
    PaymentResponse,
    MonthlyRentGenerateRequest,
)

router = APIRouter(
    prefix="/payments",
    tags=["Payments"]
)


def calculate_status(
    due_date,
    payment_date
):
    if payment_date:
        return "Paid"

    if date.today() > due_date:
        return "Overdue"

    return "Pending"


def calculate_due_date(year: int, month: int, rent_due_day: int) -> date:
    _, max_days = calendar.monthrange(year, month)
    day = min(max(1, rent_due_day), max_days)
    return date(year, month, day)


@router.post(
    "/generate-monthly",
)
def generate_monthly_rent(
    data: MonthlyRentGenerateRequest,
    db: Session = Depends(get_db)
):
    if data.month < 1 or data.month > 12:
        raise HTTPException(
            status_code=400,
            detail="Month must be between 1 and 12."
        )
    if data.year < 2000 or data.year > 2100:
        raise HTTPException(
            status_code=400,
            detail="Invalid year specified."
        )

    billing_month_date = date(data.year, data.month, 1)
    tenants = db.query(Tenant).all()

    created_records = []
    skipped_records = []

    for tenant in tenants:
        existing_payment = (
            db.query(Payment)
            .filter(
                Payment.tenant_id == tenant.id,
                Payment.payment_type == "Rent",
                Payment.billing_month == billing_month_date
            )
            .first()
        )

        if existing_payment:
            skipped_records.append({
                "tenant_id": tenant.id,
                "tenant_name": tenant.name,
                "reason": f"Rent record already exists for {data.year}-{data.month:02d}"
            })
            continue

        due_date = calculate_due_date(data.year, data.month, tenant.rent_due_day)
        status = calculate_status(due_date, None)

        new_payment = Payment(
            tenant_id=tenant.id,
            payment_type="Rent",
            amount=tenant.rent_amount,
            due_date=due_date,
            billing_month=billing_month_date,
            status=status
        )
        db.add(new_payment)
        created_records.append({
            "tenant_id": tenant.id,
            "tenant_name": tenant.name,
            "amount": tenant.rent_amount,
            "due_date": str(due_date),
            "status": status
        })

    db.commit()

    return {
        "message": f"Monthly rent generation completed for {data.year}-{data.month:02d}",
        "billing_month": str(billing_month_date),
        "generated_count": len(created_records),
        "skipped_count": len(skipped_records),
        "created_details": created_records,
        "skipped_details": skipped_records
    }


@router.post(
    "/",
    response_model=PaymentResponse
)
def create_payment(
    payment_data: PaymentCreate,
    db: Session = Depends(get_db)
):

    tenant = (
        db.query(Tenant)
        .filter(
            Tenant.id == payment_data.tenant_id
        )
        .first()
    )

    if not tenant:
        raise HTTPException(
            status_code=404,
            detail="Tenant not found"
        )

    if payment_data.billing_month and payment_data.payment_type == "Rent":
        existing_payment = (
            db.query(Payment)
            .filter(
                Payment.tenant_id == payment_data.tenant_id,
                Payment.payment_type == "Rent",
                Payment.billing_month == payment_data.billing_month
            )
            .first()
        )
        if existing_payment:
            raise HTTPException(
                status_code=400,
                detail=f"A monthly rent record already exists for this tenant for month {payment_data.billing_month}"
            )

    status = calculate_status(
        payment_data.due_date,
        payment_data.payment_date
    )

    new_payment = Payment(
        tenant_id=payment_data.tenant_id,
        payment_type=payment_data.payment_type,
        amount=payment_data.amount,
        due_date=payment_data.due_date,
        billing_month=payment_data.billing_month,
        payment_date=payment_data.payment_date,
        status=status,
        payment_method=payment_data.payment_method,
        reference=payment_data.reference
    )

    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)

    return new_payment


@router.get(
    "/",
    response_model=list[PaymentResponse]
)
def get_payments(
    billing_month: Optional[str] = None,
    db: Session = Depends(get_db)
):

    query = db.query(Payment)

    if billing_month:
        query = query.filter(Payment.billing_month == billing_month)

    payments = query.all()

    # Recalculate status
    for payment in payments:

        payment.status = calculate_status(
            payment.due_date,
            payment.payment_date
        )

    db.commit()

    return payments


@router.get(
    "/{payment_id}",
    response_model=PaymentResponse
)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db)
):

    payment = (
        db.query(Payment)
        .filter(Payment.id == payment_id)
        .first()
    )

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    payment.status = calculate_status(
        payment.due_date,
        payment.payment_date
    )

    db.commit()

    return payment


@router.put(
    "/{payment_id}/pay",
    response_model=PaymentResponse
)
def mark_payment_paid(
    payment_id: int,
    db: Session = Depends(get_db)
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    payment.payment_date = date.today()
    payment.status = "Paid"

    db.commit()
    db.refresh(payment)

    return payment


@router.delete("/{payment_id}")
def delete_payment(
    payment_id: int,
    db: Session = Depends(get_db)
):
    payment = (
        db.query(Payment)
        .filter(Payment.id == payment_id)
        .first()
    )

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    db.delete(payment)
    db.commit()

    return {
        "message": "Payment deleted successfully"
    }


@router.put("/{payment_id}", response_model=PaymentResponse)
def update_payment(
    payment_id: int,
    payment_data: PaymentCreate,
    db: Session = Depends(get_db)
):
    payment = (
        db.query(Payment)
        .filter(Payment.id == payment_id)
        .first()
    )

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    tenant = (
        db.query(Tenant)
        .filter(Tenant.id == payment_data.tenant_id)
        .first()
    )

    if not tenant:
        raise HTTPException(
            status_code=404,
            detail="Tenant not found"
        )

    payment.tenant_id = payment_data.tenant_id
    payment.payment_type = payment_data.payment_type
    payment.amount = payment_data.amount
    payment.due_date = payment_data.due_date
    payment.payment_date = payment_data.payment_date
    payment.payment_method = payment_data.payment_method
    payment.reference = payment_data.reference

    payment.status = calculate_status(
        payment_data.due_date,
        payment_data.payment_date
    )

    db.commit()
    db.refresh(payment)

    return payment
