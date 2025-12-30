"""Regression tests for N+1 query issues."""

import pytest
from sqlalchemy import event
from sqlalchemy.engine import Engine


class QueryCounter:
    """Context manager to count SQL queries executed."""
    
    def __init__(self):
        self.count = 0
        
    def __enter__(self):
        event.listen(Engine, "before_cursor_execute", self.receive_before_cursor_execute)
        return self
        
    def __exit__(self, *args):
        event.remove(Engine, "before_cursor_execute", self.receive_before_cursor_execute)
        
    def receive_before_cursor_execute(self, conn, cursor, statement, parameters, context, executemany):
        self.count += 1


@pytest.mark.regression
def test_search_spaces_list_no_n_plus_one(client, auth_headers, db_session):
    """Test that listing search spaces doesn't trigger N+1 queries.
    
    Before fix: 2N+1 queries
    After fix: Should be <=2 queries
    """
    from app.db import SearchSpace, User, SearchSpaceMembership
    from app.utils.auth import hash_password
    
    user = User(
        email="test@example.com",
        hashed_password=hash_password("testpass123"),
        full_name="Test User"
    )
    db_session.add(user)
    db_session.flush()
    
    spaces = []
    for i in range(5):
        space = SearchSpace(
            name=f"Test Space {i}",
            description=f"Test description {i}"
        )
        db_session.add(space)
        db_session.flush()
        
        membership = SearchSpaceMembership(
            search_space_id=space.id,
            user_id=user.id,
            is_owner=(i == 0)
        )
        db_session.add(membership)
        spaces.append(space)
    
    db_session.commit()
    
    with QueryCounter() as counter:
        response = client.get("/api/search_spaces/", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 5
    
    assert counter.count <= 3, (
        f"N+1 query detected! Expected <=3 queries but got {counter.count}. "
        f"This suggests selectinload() is not being used properly."
    )


@pytest.mark.regression
def test_documents_list_no_n_plus_one(client, auth_headers, db_session):
    """Test that listing documents doesn't trigger N+1 queries."""
    from app.db import SearchSpace, Document, User
    from app.utils.auth import hash_password
    
    user = User(
        email="test2@example.com",
        hashed_password=hash_password("testpass123"),
        full_name="Test User 2"
    )
    db_session.add(user)
    db_session.flush()
    
    space = SearchSpace(name="Test Space", description="Test")
    db_session.add(space)
    db_session.flush()
    
    for i in range(10):
        doc = Document(
            search_space_id=space.id,
            title=f"Document {i}",
            content=f"Content {i}",
            type="TEXT"
        )
        db_session.add(doc)
    
    db_session.commit()
    
    with QueryCounter() as counter:
        response = client.get(
            f"/api/documents/?search_space_id={space.id}",
            headers=auth_headers
        )
    
    assert response.status_code == 200
    data = response.json()
    
    assert counter.count <= 3, (
        f"N+1 query detected in documents endpoint! "
        f"Expected <=3 queries but got {counter.count}"
    )


@pytest.mark.regression
@pytest.mark.parametrize("num_spaces", [1, 5, 10])
def test_n_plus_one_scales_linearly_not_quadratically(client, auth_headers, db_session, num_spaces):
    """Test that query count doesn't scale with number of results."""
    from app.db import SearchSpace, User, SearchSpaceMembership
    from app.utils.auth import hash_password
    
    user = User(
        email=f"test_{num_spaces}@example.com",
        hashed_password=hash_password("testpass123"),
        full_name="Test User"
    )
    db_session.add(user)
    db_session.flush()
    
    for i in range(num_spaces):
        space = SearchSpace(name=f"Space {i}", description=f"Desc {i}")
        db_session.add(space)
        db_session.flush()
        
        membership = SearchSpaceMembership(
            search_space_id=space.id,
            user_id=user.id,
            is_owner=True
        )
        db_session.add(membership)
    
    db_session.commit()
    
    with QueryCounter() as counter:
        response = client.get("/api/search_spaces/", headers=auth_headers)
    
    assert response.status_code == 200
    
    assert counter.count <= 3, (
        f"Query count scales with data size! Got {counter.count} queries for {num_spaces} spaces. "
        f"This indicates an N+1 query pattern."
    )
