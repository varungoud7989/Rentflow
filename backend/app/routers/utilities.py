from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import UtilityBill, Tenant, Property, User
from ..schemas import (
    UtilityBillCreate,
    UtilityBillResponse
)
from ..security import get_current_user

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
    response_model=UtilityBillResponse,
    status_code=status.HTTP_201_CREATED
)
def create_utility_bill(
    bill_data: UtilityBillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify tenant exists and belongs to a property owned by current_user
    tenant = (
        db.query(Tenant)
        .join(Property, Tenant.property_id == Property.id)
        .filter(
            Tenant.id == bill_data.tenant_id,
            Property.user_id == current_user.id
        )
        .first()
    )

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )

    status_val = calculate_status(
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
        status=status_val,
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Return ONLY utility bills belonging to tenants whose property belongs to current_user
    bills = (
        db.query(UtilityBill)
        .join(Tenant, UtilityBill.tenant_id == Tenant.id)
        .join(Property, Tenant.property_id == Property.id)
        .filter(Property.user_id == current_user.id)
        .all()
    )

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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bill = (
        db.query(UtilityBill)
        .join(Tenant, UtilityBill.tenant_id == Tenant.id)
        .join(Property, Tenant.property_id == Property.id)
        .filter(
            UtilityBill.id == bill_id,
            Property.user_id == current_user.id
        )
        .first()
    )

    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utility bill not found"
        )

    bill.status = calculate_status(
        bill.due_date,
        bill.payment_date
    )

    db.commit()

    return bill


@router.post(
    "/{bill_id}/pay",
    response_model=UtilityBillResponse
)
@router.put(
    "/{bill_id}/pay",
    response_model=UtilityBillResponse
)
def mark_utility_bill_paid(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bill = (
        db.query(UtilityBill)
        .join(Tenant, UtilityBill.tenant_id == Tenant.id)
        .join(Property, Tenant.property_id == Property.id)
        .filter(
            UtilityBill.id == bill_id,
            Property.user_id == current_user.id
        )
        .first()
    )

    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bill = (
        db.query(UtilityBill)
        .join(Tenant, UtilityBill.tenant_id == Tenant.id)
        .join(Property, Tenant.property_id == Property.id)
        .filter(
            UtilityBill.id == bill_id,
            Property.user_id == current_user.id
        )
        .first()
    )

    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bill = (
        db.query(UtilityBill)
        .join(Tenant, UtilityBill.tenant_id == Tenant.id)
        .join(Property, Tenant.property_id == Property.id)
        .filter(
            UtilityBill.id == bill_id,
            Property.user_id == current_user.id
        )
        .first()
    )

    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utility bill not found"
        )

    target_tenant = (
        db.query(Tenant)
        .join(Property, Tenant.property_id == Property.id)
        .filter(
            Tenant.id == bill_data.tenant_id,
            Property.user_id == current_user.id
        )
        .first()
    )

    if not target_tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
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
