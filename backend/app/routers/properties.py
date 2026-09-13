from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Property
from ..schemas import PropertyCreate, PropertyResponse

router = APIRouter(
    prefix="/properties",
    tags=["Properties"]
)

@router.post(
    "/",
    response_model=PropertyResponse
)
def create_property(
    property_data: PropertyCreate,
    db: Session = Depends(get_db)
):
    new_property = Property(
        name=property_data.name,
        address=property_data.address,
        unit_number=property_data.unit_number,
        monthly_rent=property_data.monthly_rent
    )

    db.add(new_property)
    db.commit()
    db.refresh(new_property)

    return new_property

@router.get(
    "/",
    response_model=list[PropertyResponse]
)
def get_properties(
    db: Session = Depends(get_db)
):
    return db.query(Property).all()

@router.get(
    "/{property_id}",
    response_model=PropertyResponse
)
def get_property(
    property_id: int,
    db: Session = Depends(get_db)
):
    property_item = (
        db.query(Property)
        .filter(Property.id == property_id)
        .first()
    )

    if not property_item:
        raise HTTPException(
            status_code=404,
            detail="Property not found"
        )

    return property_item

@router.delete("/{property_id}")
def delete_property(
    property_id: int,
    db: Session = Depends(get_db)
):
    property_item = (
        db.query(Property)
        .filter(Property.id == property_id)
        .first()
    )

    if not property_item:
        raise HTTPException(
            status_code=404,
            detail="Property not found"
        )

    db.delete(property_item)
    db.commit()

    return {
        "message": "Property deleted successfully"
    }


@router.put("/{property_id}", response_model=PropertyResponse)
def update_property(
    property_id: int,
    property_data: PropertyCreate,
    db: Session = Depends(get_db)
):
    property_item = (
        db.query(Property)
        .filter(Property.id == property_id)
        .first()
    )

    if not property_item:
        raise HTTPException(
            status_code=404,
            detail="Property not found"
        )

    property_item.name = property_data.name
    property_item.address = property_data.address
    property_item.unit_number = property_data.unit_number
    property_item.monthly_rent = property_data.monthly_rent

    db.commit()
    db.refresh(property_item)

    return property_item
