"""add_household_column_to_students

Revision ID: 54d022a28929
Revises: 616d15931db4
Create Date: 2025-11-20 19:32:28.088739

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision: str = '54d022a28929'
down_revision: Union[str, None] = '616d15931db4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add household column as JSONB
    op.add_column('students', sa.Column('household', JSONB, nullable=True))


def downgrade() -> None:
    # Remove household column
    op.drop_column('students', 'household')
