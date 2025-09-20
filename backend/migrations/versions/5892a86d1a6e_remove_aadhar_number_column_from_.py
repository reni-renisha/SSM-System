"""Remove aadhar_number column from students table

Revision ID: 5892a86d1a6e
Revises: e381a6a50391
Create Date: 2025-09-20 14:28:49.711521

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5892a86d1a6e'
down_revision: Union[str, None] = 'e381a6a50391'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
