"""Add assessment and ADL fields to students table

Revision ID: f1a2b3c4d5e6
Revises: d01b167c44cc
Create Date: 2025-10-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, None] = 'd01b167c44cc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Activities of Daily Living / Self-help & Adaptive
    op.add_column('students', sa.Column('eating_habits', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('drinking_habits', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('toilet_habits', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('brushing', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('bathing', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('dressing_removing_wearing', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('dressing_buttoning', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('dressing_footwear', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('dressing_grooming', sa.Text(), nullable=True))

    # Motor / Sensory / Communication
    op.add_column('students', sa.Column('gross_motor', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('fine_motor', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('sensory', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('language_communication', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('social_behaviour', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('mobility_in_neighborhood', sa.Text(), nullable=True))

    # Cognitive / Attention / Functional
    op.add_column('students', sa.Column('attention', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('identification_of_objects', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('use_of_objects', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('following_instruction', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('awareness_of_danger', sa.Text(), nullable=True))

    # Concept formation
    op.add_column('students', sa.Column('concept_color', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('concept_size', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('concept_sex', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('concept_shape', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('concept_number', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('concept_time', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('concept_money', sa.Text(), nullable=True))

    # Academic & Prevocational
    op.add_column('students', sa.Column('academic_reading', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('academic_writing', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('academic_arithmetic', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('prevocational_ability', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('prevocational_interest', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('prevocational_dislike', sa.Text(), nullable=True))

    # Behaviours / Observations / Recommendations
    op.add_column('students', sa.Column('any_peculiar_behaviour', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('any_other', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('observations', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('recommendation', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('students', 'recommendation')
    op.drop_column('students', 'observations')
    op.drop_column('students', 'any_other')
    op.drop_column('students', 'any_peculiar_behaviour')
    op.drop_column('students', 'prevocational_dislike')
    op.drop_column('students', 'prevocational_interest')
    op.drop_column('students', 'prevocational_ability')
    op.drop_column('students', 'academic_arithmetic')
    op.drop_column('students', 'academic_writing')
    op.drop_column('students', 'academic_reading')
    op.drop_column('students', 'concept_money')
    op.drop_column('students', 'concept_time')
    op.drop_column('students', 'concept_number')
    op.drop_column('students', 'concept_shape')
    op.drop_column('students', 'concept_sex')
    op.drop_column('students', 'concept_size')
    op.drop_column('students', 'concept_color')
    op.drop_column('students', 'awareness_of_danger')
    op.drop_column('students', 'following_instruction')
    op.drop_column('students', 'use_of_objects')
    op.drop_column('students', 'identification_of_objects')
    op.drop_column('students', 'attention')
    op.drop_column('students', 'mobility_in_neighborhood')
    op.drop_column('students', 'social_behaviour')
    op.drop_column('students', 'language_communication')
    op.drop_column('students', 'sensory')
    op.drop_column('students', 'fine_motor')
    op.drop_column('students', 'gross_motor')
    op.drop_column('students', 'dressing_grooming')
    op.drop_column('students', 'dressing_footwear')
    op.drop_column('students', 'dressing_buttoning')
    op.drop_column('students', 'dressing_removing_wearing')
    op.drop_column('students', 'bathing')
    op.drop_column('students', 'brushing')
    op.drop_column('students', 'toilet_habits')
    op.drop_column('students', 'drinking_habits')
    op.drop_column('students', 'eating_habits')
