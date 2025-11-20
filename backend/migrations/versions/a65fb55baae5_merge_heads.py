"""merge_heads

Revision ID: a65fb55baae5
Revises: 54d022a28929, add_documents_column
Create Date: 2025-11-20 22:46:18.105243

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a65fb55baae5'
down_revision: Union[str, None] = ('54d022a28929', 'add_documents_column')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
