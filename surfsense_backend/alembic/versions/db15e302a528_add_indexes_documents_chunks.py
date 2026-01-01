"""add_indexes_documents_chunks

Revision ID: db15e302a528
Revises: 53
Create Date: 2026-01-01 09:34:49.098895

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'db15e302a528'
down_revision: Union[str, None] = '53'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Index 1: Composite index on documents(search_space_id, document_type)
    # Used in queries that filter documents by space and type
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_documents_space_type 
        ON documents(search_space_id, document_type);
    """)
    
    # Index 2: Foreign key index on chunks(document_id)
    # Speeds up joins between documents and chunks
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_chunks_document_id 
        ON chunks(document_id);
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP INDEX IF EXISTS idx_documents_space_type;")
    op.execute("DROP INDEX IF EXISTS idx_chunks_document_id;")
