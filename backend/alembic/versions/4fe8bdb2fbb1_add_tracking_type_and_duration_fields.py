"""add tracking type and duration fields

Revision ID: 4fe8bdb2fbb1
Revises: df3c1e87cc31
Create Date: 2026-03-15 22:20:27.860884

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4fe8bdb2fbb1'
down_revision: Union[str, Sequence[str], None] = 'df3c1e87cc31'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('exercises', schema=None) as batch_op:
        batch_op.add_column(sa.Column('tracking_type', sa.VARCHAR(), nullable=False, server_default='reps_weight'))

    with op.batch_alter_table('workout_exercises_details', schema=None) as batch_op:
        batch_op.alter_column('rep_count', existing_type=sa.INTEGER(), nullable=True)
        batch_op.alter_column('weight', existing_type=sa.FLOAT(), nullable=True)
        batch_op.add_column(sa.Column('duration_sec', sa.Integer(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('workout_exercises_details', schema=None) as batch_op:
        batch_op.drop_column('duration_sec')
        batch_op.alter_column('weight', existing_type=sa.FLOAT(), nullable=False)
        batch_op.alter_column('rep_count', existing_type=sa.INTEGER(), nullable=False)

    with op.batch_alter_table('exercises', schema=None) as batch_op:
        batch_op.drop_column('tracking_type')
