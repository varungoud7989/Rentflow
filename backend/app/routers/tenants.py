from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Tenant, Property, Payment, UtilityBill
from ..schemas import TenantCreate, TenantResponse

router = APIRouter(
    prefix="/tenants",
    tags=["Tenants"]
)

@router.post(
    "/",
    response_model=TenantResponse
)
def create_tenant(
    tenant_data: TenantCreate,
    db: Session = Depends(get_db)
):

    # Check whether property exists
    property_item = (
        db.query(Property)
        .filter(Property.id == tenant_data.property_id)
        .first()
    )

    if not property_item:
        raise HTTPException(
            status_code=404,
            detail="Property not found"
        )

    new_tenant = Tenant(
        name=tenant_data.name,
        phone=tenant_data.phone,
        rent_amount=tenant_data.rent_amount,
        rent_due_day=tenant_data.rent_due_day,
        move_in_date=tenant_data.move_in_date,
        property_id=tenant_data.property_id
    )

    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)

    return new_tenant

@router.get(
    "/",
    response_model=list[TenantResponse]
)
def get_tenants(
    db: Session = Depends(get_db)
):
    return db.query(Tenant).all()

@router.get(
    "/{tenant_id}",
    response_model=TenantResponse
)
def get_tenant(
    tenant_id: int,
    db: Session = Depends(get_db)
):

    tenant = (
        db.query(Tenant)
        .filter(Tenant.id == tenant_id)
        .first()
    )

    if not tenant:
        raise HTTPException(
            status_code=404,
            detail="Tenant not found"
        )

    return tenant

@router.delete("/{tenant_id}")
def delete_tenant(
    tenant_id: int,
    db: Session = Depends(get_db)
):

    tenant = (
        db.query(Tenant)
        .filter(Tenant.id == tenant_id)
        .first()
    )

    if not tenant:
        raise HTTPException(
            status_code=404,
            detail="Tenant not found"
        )

    payment_exists = (
        db.query(Payment)
        .filter(Payment.tenant_id == tenant_id)
        .first()
    )

    utility_exists = (
        db.query(UtilityBill)
        .filter(UtilityBill.tenant_id == tenant_id)
        .first()
    )

    if payment_exists or utility_exists:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete tenant because payment or utility records exist."
        )

    db.delete(tenant)
    db.commit()

    return {
        "message": "Tenant deleted successfully"
    }

@router.put("/{tenant_id}", response_model=TenantResponse)
def update_tenant(
    tenant_id: int,
    tenant_data: TenantCreate,
    db: Session = Depends(get_db)
):
    tenant = (
        db.query(Tenant)
        .filter(Tenant.id == tenant_id)
        .first()
    )

    if not tenant:
        raise HTTPException(
            status_code=404,
            detail="Tenant not found"
        )

    property_item = (
        db.query(Property)
        .filter(Property.id == tenant_data.property_id)
        .first()
    )

    if not property_item:
        raise HTTPException(
            status_code=404,
            detail="Property not found"
        )

    tenant.name = tenant_data.name
    tenant.phone = tenant_data.phone
    tenant.rent_amount = tenant_data.rent_amount
    tenant.rent_due_day = tenant_data.rent_due_day
    tenant.move_in_date = tenant_data.move_in_date
    tenant.property_id = tenant_data.property_id

    db.commit()
    db.refresh(tenant)

    return tenant
