# 🧩 Test Templates & Examples

**Purpose**: Copy-paste ready test templates for all test types

---

## Backend Test Templates

### 1. Unit Test Template (pytest)

```python
# tests/unit/services/test_example_service.py
import pytest
from unittest.mock import Mock, patch
from app.services.example_service import ExampleService

@pytest.fixture
def example_service():
    """Fixture for ExampleService instance"""
    return ExampleService()

class TestExampleService:
    """Test suite for ExampleService"""
    
    def test_method_success(self, example_service):
        """Test: method returns expected result on success"""
        # Arrange
        input_data = {"key": "value"}
        expected_output = {"result": "success"}
        
        # Act
        result = example_service.method(input_data)
        
        # Assert
        assert result == expected_output
```

### 2. Integration Test Template (FastAPI)

```python
# tests/integration/routes/test_example_routes.py
import pytest
from fastapi.testclient import TestClient

class TestExampleRoutes:
    def test_create_resource(self, client, auth_headers, db_session):
        response = client.post("/api/resources", json={"name": "Test"}, headers=auth_headers)
        assert response.status_code == 201
```

### 3. Frontend Component Test Template

```typescript
// tests/components/example.test.tsx
import { render, screen } from '@testing-library/react'
import ExampleComponent from '@/components/example'

describe('ExampleComponent', () => {
  it('renders correctly', () => {
    render(<ExampleComponent title="Test" />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
```

---

**See full templates in the comprehensive test analysis document**
