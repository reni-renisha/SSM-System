"""placeholder missing revision

Revision ID: 7ab58a691691
Revises: a8b9c0d1e2f3
Create Date: 2026-04-09 00:00:00.000000

This migration exists to restore a missing Alembic revision file that the
production database is already stamped to. It is intentionally a no-op.

"""

from typing import Sequence, Union

from alembic import op  # noqa: F401
import sqlalchemy as sa  # noqa: F401


# revision identifiers, used by Alembic.
revision: str = "7ab58a691691"
down_revision: Union[str, None] = "a8b9c0d1e2f3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # No-op: DB is already at this revision.
    pass


def downgrade() -> None:
    # No-op.
    pass
