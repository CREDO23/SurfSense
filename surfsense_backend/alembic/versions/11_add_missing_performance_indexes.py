"""Add missing performance indexes for improved query performance

Revision ID: 11
Revises: 10
"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "11"
down_revision: str | None = "10"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create performance-critical indexes.
    
    These indexes address:
    - N+1 query issues in document and chunk lookups
    - Slow search space filtering by type
    - Chat thread queries with archived filter
    - Membership lookups by user and role
    """
    # Index for documents filtered by search_space_id and type
    op.create_index(
        'idx_documents_space_type',
        'documents',
        ['search_space_id', 'type'],
        unique=False
    )
    
    # Index for chunks by document_id (prevents N+1 queries)
    op.create_index(
        'idx_chunks_document_id',
        'chunks',
        ['document_id'],
        unique=False
    )
    
    # Index for chat_threads filtered by search_space_id and is_archived
    op.create_index(
        'idx_chat_threads_space_archived',
        'chat_threads',
        ['search_space_id', 'is_archived'],
        unique=False
    )
    
    # Index for membership lookups by user_id
    op.create_index(
        'idx_membership_user',
        'search_space_memberships',
        ['user_id'],
        unique=False
    )
    
    # Index for membership lookups by search_space_id and role
    op.create_index(
        'idx_membership_space_role',
        'search_space_memberships',
        ['search_space_id', 'role'],
        unique=False
    )


def downgrade() -> None:
    """Remove performance indexes."""
    op.drop_index('idx_membership_space_role', table_name='search_space_memberships')
    op.drop_index('idx_membership_user', table_name='search_space_memberships')
    op.drop_index('idx_chat_threads_space_archived', table_name='chat_threads')
    op.drop_index('idx_chunks_document_id', table_name='chunks')
    op.drop_index('idx_documents_space_type', table_name='documents')
