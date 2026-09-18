from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Tenant, Property, Payment, UtilityBill, User
from ..schemas import TenantCreate, TenantResponse
from ..security import get_current_user

router = APIRouter(
    prefix="/tenants",
    tags=["Tenants"]
)


@router.post(
    "/",
    response_model=TenantResponse,
    status_code=status.HTTP_201_CREATED
)
def create_tenant(
    tenant_data: TenantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify that the specified property exists and belongs to the authenticated user
    property_item = (
        db.query(Property)
        .filter(
            Property.id == tenant_data.property_id,
            Property.user_id == current_user.id
        )
        .first()
    )

    if not property_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Return ONLY tenants whose associated property belongs to the current authenticated user
    return (
        db.query(Tenant)
        .join(Property, Tenant.property_id == Property.id)
        .filter(Property.user_id == current_user.id)
        .all()
    )


@router.get(
    "/{tenant_id}",
    response_model=TenantResponse
)
def get_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tenant = (
        db.query(Tenant)
        .join(Property, Tenant.property_id == Property.id)
        .filter(
            Tenant.id == tenant_id,
            Property.user_id == current_user.id
        )
        .first()
    )

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )

    return tenant


@router.put(
    "/{tenant_id}",
    response_model=TenantResponse
)
def update_tenant(
    tenant_id: int,
    tenant_data: TenantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify the existing tenant belongs to current_user through its property
    tenant = (
        db.query(Tenant)
        .join(Property, Tenant.property_id == Property.id)
        .filter(
            Tenant.id == tenant_id,
            Property.user_id == current_user.id
        )
        .first()
    )

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )

    # Verify that the target property exists and belongs to current_user
    target_property = (
        db.query(Property)
        .filter(
            Property.id == tenant_data.property_id,
            Property.user_id == current_user.id
        )
        .first()
    )

    if not target_property:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
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


@router.delete("/{tenant_id}")
def delete_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify tenant ownership through its property
    tenant = (
        db.query(Tenant)
        .join(Property, Tenant.property_id == Property.id)
        .filter(
            Tenant.id == tenant_id,
            Property.user_id == current_user.id
        )
        .first()
    )

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
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
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete tenant because payment or utility records exist."
        )

    db.delete(tenant)
    db.commit()

    return {
        "message": "Tenant deleted successfully"
    }
