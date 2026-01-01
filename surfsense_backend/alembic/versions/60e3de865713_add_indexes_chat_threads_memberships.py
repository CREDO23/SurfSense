"""add_indexes_chat_threads_memberships

Revision ID: 60e3de865713
Revises: db15e302a528
Create Date: 2026-01-01 11:46:55.125874

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '60e3de865713'
down_revision: Union[str, None] = 'db15e302a528'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add index for chat threads filtering by search_space_id and archived status
    op.create_index(
        'idx_chat_threads_space_archived',
        'new_chat_threads',
        ['search_space_id', 'archived'],
        unique=False
    )
    
    # Add index for membership lookups by user_id
    op.create_index(
        'idx_membership_user',
        'search_space_memberships',
        ['user_id'],
        unique=False
    )
    
    # Add index for membership lookups by search_space_id and role_id
    op.create_index(
        'idx_membership_space_role',
        'search_space_memberships',
        ['search_space_id', 'role_id'],
        unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('idx_membership_space_role', table_name='search_space_memberships')
    op.drop_index('idx_membership_user', table_name='search_space_memberships')
    op.drop_index('idx_chat_threads_space_archived', table_name='new_chat_threads')
