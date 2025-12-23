"""create_therapists_table

Revision ID: 079e66de2321
Revises: a65fb55baae5
Create Date: 2025-12-09 17:52:04.716505

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '079e66de2321'
down_revision: Union[str, None] = 'a65fb55baae5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'therapists',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('address', sa.String(), nullable=False),
        sa.Column('date_of_birth', sa.Date(), nullable=False),
        sa.Column('gender', sa.String(), nullable=False),
        sa.Column('blood_group', sa.String(), nullable=False),
        sa.Column('mobile_number', sa.String(), nullable=False),
        sa.Column('aadhar_number', sa.String(), nullable=False),
        sa.Column('religion', sa.String(), nullable=False),
        sa.Column('caste', sa.String(), nullable=False),
        sa.Column('rci_number', sa.String(), nullable=False),
        sa.Column('rci_renewal_date', sa.Date(), nullable=False),
        sa.Column('qualifications_details', sa.String(), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('specialization', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('aadhar_number'),
        sa.UniqueConstraint('rci_number')
    )
    op.create_index(op.f('ix_therapists_id'), 'therapists', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_therapists_id'), table_name='therapists')
    op.drop_table('therapists')
