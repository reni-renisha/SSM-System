"""add documents column to students

Revision ID: add_documents_column
Revises: 
Create Date: 2025-11-20

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision = 'add_documents_column'
down_revision = None  # Update this with your latest migration revision
branch_labels = None
depends_on = None


def upgrade():
    # Add documents column to students table
    op.add_column('students', sa.Column('documents', JSONB, nullable=True))


def downgrade():
    # Remove documents column
    op.drop_column('students', 'documents')
