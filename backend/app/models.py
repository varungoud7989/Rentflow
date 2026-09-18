from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship

from .database import Base

class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    name = Column(String, nullable=False)

    address = Column(String, nullable=False)

    unit_number = Column(String)

    monthly_rent = Column(Float, default=0)

    owner = relationship(
        "User",
        back_populates="properties"
    )

    tenants = relationship(
        "Tenant",
        back_populates="property"
    )

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)

    phone = Column(String)

    rent_amount = Column(Float, default=0)

    rent_due_day = Column(Integer, default=5)

    move_in_date = Column(Date)

    property_id = Column(
        Integer,
        ForeignKey("properties.id")
    )

    property = relationship(
        "Property",
        back_populates="tenants"
    )

class Payment(Base):
    __tablename__ = "payments"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    tenant_id = Column(
        Integer,
        ForeignKey("tenants.id"),
        nullable=False
    )

    payment_type = Column(
        String,
        default="Rent",
        nullable=False
    )

    amount = Column(
        Float,
        nullable=False
    )

    due_date = Column(
        Date,
        nullable=False
    )

    billing_month = Column(
        Date,
        nullable=True,
        index=True
    )

    payment_date = Column(
        Date,
        nullable=True
    )

    status = Column(
        String,
        default="Pending",
        nullable=False
    )

    payment_method = Column(
        String,
        nullable=True
    )

    reference = Column(
        String,
        nullable=True
    )

    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "payment_type",
            "billing_month",
            name="uq_tenant_payment_billing_month"
        ),
    )

class UtilityBill(Base):
    __tablename__ = "utility_bills"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    tenant_id = Column(
        Integer,
        ForeignKey("tenants.id"),
        nullable=False
    )

    utility_type = Column(
        String,
        nullable=False
    )

    connection_number = Column(
        String,
        nullable=True
    )

    amount = Column(
        Float,
        nullable=False
    )

    due_date = Column(
        Date,
        nullable=False
    )

    payment_date = Column(
        Date,
        nullable=True
    )

    status = Column(
        String,
        default="Pending",
        nullable=False
    )

    notes = Column(
        String,
        nullable=True
    )

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    email = Column(
        String,
        nullable=False,
        unique=True,
        index=True
    )

    hashed_password = Column(
        String,
        nullable=False
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )

    properties = relationship(
        "Property",
        back_populates="owner"
    )
