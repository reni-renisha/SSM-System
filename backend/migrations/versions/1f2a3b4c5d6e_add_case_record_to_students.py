"""
add case_record column to students

Revision ID: 1f2a3b4c5d6e
Revises: d7f8b2c678e5_add_headmistress_role_to_users
Create Date: 2025-08-11 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '1f2a3b4c5d6e'
down_revision = 'd7f8b2c678e5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('students', sa.Column('case_record', postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    op.drop_column('students', 'case_record')


