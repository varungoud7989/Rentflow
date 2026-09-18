"""baseline_schema

Revision ID: 608587b3620d
Revises: 
Create Date: 2026-09-15 15:26:22.605939

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '608587b3620d'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Baseline schema representing current database state."""
    # users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False, unique=True, index=True),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
    )

    # properties table (user_id is nullable in SQLite baseline)
    op.create_table(
        'properties',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('address', sa.String(), nullable=False),
        sa.Column('unit_number', sa.String(), nullable=True),
        sa.Column('monthly_rent', sa.Float(), nullable=True, server_default=sa.text('0')),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True, index=True),
    )

    # tenants table
    op.create_table(
        'tenants',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('rent_amount', sa.Float(), nullable=True, server_default=sa.text('0')),
        sa.Column('rent_due_day', sa.Integer(), nullable=True, server_default=sa.text('5')),
        sa.Column('move_in_date', sa.Date(), nullable=True),
        sa.Column('property_id', sa.Integer(), sa.ForeignKey('properties.id'), nullable=True),
    )

    # payments table (billing_month is nullable in SQLite baseline)
    op.create_table(
        'payments',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('tenant_id', sa.Integer(), sa.ForeignKey('tenants.id'), nullable=False),
        sa.Column('payment_type', sa.String(), nullable=False, server_default=sa.text("'Rent'")),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('payment_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default=sa.text("'Pending'")),
        sa.Column('payment_method', sa.String(), nullable=True),
        sa.Column('reference', sa.String(), nullable=True),
        sa.Column('billing_month', sa.Date(), nullable=True, index=True),
        sa.UniqueConstraint('tenant_id', 'payment_type', 'billing_month', name='uq_tenant_payment_billing_month'),
    )

    # utility_bills table
    op.create_table(
        'utility_bills',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('tenant_id', sa.Integer(), sa.ForeignKey('tenants.id'), nullable=True),
        sa.Column('utility_type', sa.String(), nullable=True),
        sa.Column('connection_number', sa.String(), nullable=True),
        sa.Column('amount', sa.Float(), nullable=True),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('payment_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(), nullable=True, server_default=sa.text("'Pending'")),
        sa.Column('notes', sa.String(), nullable=True),
    )


def downgrade() -> None:
    """Downgrade baseline schema."""
    op.drop_table('utility_bills')
    op.drop_table('payments')
    op.drop_table('tenants')
    op.drop_table('properties')
    op.drop_table('users')


