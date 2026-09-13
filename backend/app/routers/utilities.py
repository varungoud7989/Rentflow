from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import UtilityBill, Tenant
from ..schemas import (
    UtilityBillCreate,
    UtilityBillResponse
)

router = APIRouter(
    prefix="/utilities",
    tags=["Utility Bills"]
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


@router.post(
    "/",
    response_model=UtilityBillResponse
)
def create_utility_bill(
    bill_data: UtilityBillCreate,
    db: Session = Depends(get_db)
):

    tenant = (
        db.query(Tenant)
        .filter(
            Tenant.id == bill_data.tenant_id
        )
        .first()
    )

    if not tenant:
        raise HTTPException(
            status_code=404,
            detail="Tenant not found"
        )

    status = calculate_status(
        bill_data.due_date,
        bill_data.payment_date
    )

    new_bill = UtilityBill(
        tenant_id=bill_data.tenant_id,
        utility_type=bill_data.utility_type,
        connection_number=bill_data.connection_number,
        amount=bill_data.amount,
        due_date=bill_data.due_date,
        payment_date=bill_data.payment_date,
        status=status,
        notes=bill_data.notes
    )

    db.add(new_bill)
    db.commit()
    db.refresh(new_bill)

    return new_bill


@router.get(
    "/",
    response_model=list[UtilityBillResponse]
)
def get_utility_bills(
    db: Session = Depends(get_db)
):

    bills = db.query(UtilityBill).all()

    for bill in bills:
        bill.status = calculate_status(
            bill.due_date,
            bill.payment_date
        )

    db.commit()

    return bills


@router.get(
    "/{bill_id}",
    response_model=UtilityBillResponse
)
def get_utility_bill(
    bill_id: int,
    db: Session = Depends(get_db)
):

    bill = (
        db.query(UtilityBill)
        .filter(
            UtilityBill.id == bill_id
        )
        .first()
    )

    if not bill:
        raise HTTPException(
            status_code=404,
            detail="Utility bill not found"
        )

    bill.status = calculate_status(
        bill.due_date,
        bill.payment_date
    )

    db.commit()

    return bill


@router.put(
    "/{bill_id}/pay",
    response_model=UtilityBillResponse
)
def mark_utility_bill_paid(
    bill_id: int,
    db: Session = Depends(get_db)
):
    bill = db.query(UtilityBill).filter(UtilityBill.id == bill_id).first()

    if not bill:
        raise HTTPException(
            status_code=404,
            detail="Utility bill not found"
        )

    bill.payment_date = date.today()
    bill.status = "Paid"

    db.commit()
    db.refresh(bill)

    return bill


@router.delete("/{bill_id}")
def delete_utility_bill(
    bill_id: int,
    db: Session = Depends(get_db)
):
    bill = (
        db.query(UtilityBill)
        .filter(UtilityBill.id == bill_id)
        .first()
    )

    if not bill:
        raise HTTPException(
            status_code=404,
            detail="Utility bill not found"
        )

    db.delete(bill)
    db.commit()

    return {
        "message": "Utility bill deleted successfully"
    }


@router.put("/{bill_id}", response_model=UtilityBillResponse)
def update_utility_bill(
    bill_id: int,
    bill_data: UtilityBillCreate,
    db: Session = Depends(get_db)
):
    bill = (
        db.query(UtilityBill)
        .filter(UtilityBill.id == bill_id)
        .first()
    )

    if not bill:
        raise HTTPException(
            status_code=404,
            detail="Utility bill not found"
        )

    tenant = (
        db.query(Tenant)
        .filter(Tenant.id == bill_data.tenant_id)
        .first()
    )

    if not tenant:
        raise HTTPException(
            status_code=404,
            detail="Tenant not found"
        )

    bill.tenant_id = bill_data.tenant_id
    bill.utility_type = bill_data.utility_type
    bill.connection_number = bill_data.connection_number
    bill.amount = bill_data.amount
    bill.due_date = bill_data.due_date
    bill.payment_date = bill_data.payment_date
    bill.notes = bill_data.notes

    bill.status = calculate_status(
        bill_data.due_date,
        bill_data.payment_date
    )

    db.commit()
    db.refresh(bill)

    return bill
